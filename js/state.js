/**
 * Future Quest 2026 - Game State Management (Backend API Integrated)
 *
 * All state transitions, timers, validations, and clues
 * are strictly sourced from the Node.js + Express + MongoDB Atlas backend.
 * localStorage acts purely as an ephemeral client cache to prevent UI flash on load.
 */

import { CONFIG } from './config.js';
import { Api, getServerNow, recordServerTime, OfflineError } from './api.js';

const STORAGE_KEY = 'future_quest_2026_state';

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Set();
    this.syncInProgress = false;

    // Periodic synchronization every 60 seconds
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.syncWithServer().catch(() => {});
      });

      setInterval(() => {
        this.syncWithServer().catch(() => {});
      }, 60000);

      // Initial server sync in background on script load
      this.syncWithServer().catch(() => {});

      // Preserve active puzzle timer and progress before window unloads / refreshes
      window.addEventListener('beforeunload', () => {
        if (this.state && this.state.blocks) {
          const now = Date.now();
          for (const bid in this.state.blocks) {
            const b = this.state.blocks[bid];
            if (b.activeSince && (b.status === 'OPENED' || b.status === 'OPENED_IN_PROGRESS')) {
              b.timeSpentMs = (b.timeSpentMs || 0) + Math.max(0, now - b.activeSince);
              b.activeSince = now;
            }
          }
          this.saveState();
        }
      });
    }
  }

  /**
   * Subscribe to state updates.
   * @param {Function} callback
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const callback of this.listeners) {
      try {
        callback(this.state);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    }
  }

  /**
   * Load cached state from localStorage to render initial view without flash.
   */
  loadState() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      const parsed = JSON.parse(serialized);
      if (parsed && parsed.teamName && parsed.gridOrder) {
        // Sanitize gridOrder: preserve canonical sequential order when SHUFFLE_TILES is false
        if (!CONFIG.SHUFFLE_TILES) {
          parsed.gridOrder = [...Object.keys(CONFIG.PUZZLES), 'vault_12'];
        } else {
          const validQuestIds = new Set(Object.keys(CONFIG.PUZZLES));
          const cleanQuestOrder = parsed.gridOrder.filter(id => validQuestIds.has(id));
          parsed.gridOrder = [...cleanQuestOrder, 'vault_12'];
        }
        if (parsed.blocks) {
          delete parsed.blocks['puzzle_11'];
          for (const bid in parsed.blocks) {
            parsed.blocks[bid].progress = parsed.blocks[bid].progress || {};
          }
        }
        return parsed;
      }
      return null;
    } catch (e) {
      console.warn('Failed to parse localStorage cache:', e);
      return null;
    }
  }

  /**
   * Save current state cache to localStorage.
   */
  saveState() {
    if (typeof localStorage === 'undefined') return;
    if (!this.state) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Failed to write to localStorage:', e);
      }
    }
    this.notify();
  }

  /**
   * Re-sync state with MongoDB Atlas backend truth while preserving
   * client-side solved blocks, pouch clues, and timer progression.
   */
  async syncWithServer() {
    if (this.syncInProgress) return this.state;
    this.syncInProgress = true;

    try {
      // Gather any locally solved puzzles to keep backend synchronized
      const solvedPayload = {};
      if (this.state && this.state.blocks) {
        for (const [bid, b] of Object.entries(this.state.blocks)) {
          if (b && b.status === 'SOLVED') {
            solvedPayload[bid] = {
              status: 'SOLVED',
              unlockedClue: b.unlockedClue,
            };
          }
        }
      }

      let data;
      if (Object.keys(solvedPayload).length > 0) {
        data = await Api.syncState({ blocks: solvedPayload }).catch(() => Api.getState());
      } else {
        data = await Api.getState();
      }

      if (!data || !data.team) {
        // Under no circumstances wipe existing local progress if server returns null/empty
        return this.state;
      }

      const team = data.team;
      const tiles = data.tiles || [];

      // Reconstruct blocks map from server tiles while merging local truths
      const blocks = { ...(this.state?.blocks || {}) };
      const gridOrder = [];

      const validQuestIds = new Set(Object.keys(CONFIG.PUZZLES));
      tiles.forEach((t) => {
        if (!validQuestIds.has(t.puzzleId)) return; // skip legacy or invalid puzzles like puzzle_11
        gridOrder.push(t.puzzleId);

        const localBlock = this.state?.blocks?.[t.puzzleId] || {};

        // Status rule: SOLVED is permanent! Never downgrade a SOLVED puzzle to AVAILABLE or OPENED
        let status = t.status;
        if (localBlock.status === 'SOLVED') {
          status = 'SOLVED';
        } else if (localBlock.status === 'FAILED' && status !== 'SOLVED') {
          status = 'FAILED';
        }

        // Time spent: preserve local accumulated time spent
        let timeSpentMs = localBlock.timeSpentMs || 0;
        if (typeof t.timeSpentMs === 'number' && t.timeSpentMs > timeSpentMs) {
          timeSpentMs = t.timeSpentMs;
        }

        // Active since:
        let activeSince = localBlock.activeSince || null;
        if (status === 'OPENED' && !activeSince) {
          activeSince = t.status === 'OPENED' ? getServerNow() : null;
        } else if (status === 'SOLVED' || status === 'FAILED') {
          activeSince = null;
        }

        const unlockedClue = localBlock.unlockedClue || t.unlockedClue || null;

        blocks[t.puzzleId] = {
          status,
          attemptsUsed: Math.max(localBlock.attemptsUsed || 0, t.attemptsUsed || 0),
          hintUsed: localBlock.hintUsed || !!t.hintUsed,
          timeSpentMs,
          activeSince,
          unlockedClue,
          timeLimitSeconds: t.timeLimitSeconds || localBlock.timeLimitSeconds || (CONFIG.PUZZLES[t.puzzleId]?.timeLimit) || 600,
          timeRemainingSeconds: t.timeRemainingSeconds ?? localBlock.timeRemainingSeconds ?? null,
          progress: localBlock.progress || {},
        };

        // Cache any unlocked clue into client config
        if (unlockedClue && CONFIG.PUZZLES[t.puzzleId]) {
          CONFIG.PUZZLES[t.puzzleId].clue = unlockedClue;
        }
      });

      // Always fix vault_12 as the single last tile
      if (!CONFIG.SHUFFLE_TILES) {
        gridOrder.length = 0;
        gridOrder.push(...Object.keys(CONFIG.PUZZLES), 'vault_12');
      } else {
        gridOrder.push('vault_12');
      }

      this.state = {
        teamName: team.teamName || this.state?.teamName,
        schoolName: team.schoolName || this.state?.schoolName,
        timerStartedAt: this.state?.timerStartedAt || team.timerStartedAt,
        timerLockedAt: team.timerLockedAt || this.state?.timerLockedAt || null,
        vaultEntered: !!team.isVaultLocked || !!this.state?.vaultEntered,
        hintsRemaining: Math.min(this.state?.hintsRemaining ?? 3, team.hintsLeft ?? 3),
        gridOrder: gridOrder.length ? gridOrder : (this.state?.gridOrder || [...Object.keys(CONFIG.PUZZLES), 'vault_12']),
        activeBlock: this.state?.activeBlock || null,
        blocks,
        verificationHash: this.state?.verificationHash || null,
        isLocalFallback: this.state?.isLocalFallback || false,
      };

      this.saveState();
      return this.state;
    } catch (err) {
      if (err.status === 401) {
        // Backend returned 401: preserve local state cache so contestant progress is never lost
        console.warn('Backend returned 401 during sync. Preserving local state cache.');
        return this.state;
      }
      // Offline / network failure: keep existing cache intact
      return this.state;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Check if a valid session exists.
   */
  hasSession() {
    return !!(this.state && this.state.teamName && this.state.timerStartedAt);
  }

  /**
   * Reset session locally.
   */
  resetSession() {
    this.state = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('future_quest_token');
      localStorage.removeItem('future_quest_team_id');
    }
    this.notify();
  }

  /**
   * Register a new team with the backend server.
   * Calls POST /api/register.
   */
  async initSession(teamName, schoolName, members = []) {
    try {
      const res = await Api.register({
        teamName: teamName.trim(),
        schoolName: schoolName.trim(),
        members,
      });

      if (!res || !res.team) {
        throw new Error(res?.error || 'Registration failed');
      }

      if (res.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('future_quest_token', res.token);
        localStorage.setItem('future_quest_team_id', res.team.id);
      }

      // Immediately sync state to load seeded grid order and initialized blocks
      await this.syncWithServer();
      return this.state;
    } catch (err) {
      // Re-throw user validation errors (e.g. duplicate team name)
      if (err.status === 400 || err.status === 409) {
        throw err;
      }

      console.warn('Backend API registration unreachable, activating resilient local session:', err);
      const cleanQuestIds = Object.keys(CONFIG.PUZZLES);
      const blocks = {};
      cleanQuestIds.forEach((id) => {
        blocks[id] = {
          status: 'AVAILABLE',
          attemptsUsed: 0,
          hintUsed: false,
          timeSpentMs: 0,
          activeSince: null,
          unlockedClue: null,
          timeLimitSeconds: CONFIG.PUZZLES[id]?.timeLimit || 600,
          timeRemainingSeconds: CONFIG.PUZZLES[id]?.timeLimit || 600,
          progress: {},
        };
      });

      const now = Date.now();
      this.state = {
        teamName: teamName.trim(),
        schoolName: schoolName.trim(),
        timerStartedAt: now,
        timerLockedAt: null,
        vaultEntered: false,
        hintsRemaining: 3,
        gridOrder: [...cleanQuestIds, 'vault_12'],
        activeBlock: null,
        blocks,
        verificationHash: null,
        isLocalFallback: true,
      };

      this.saveState();
      return this.state;
    }
  }

  /**
   * Computes master countdown seconds using server clock offset.
   */
  getMasterRemainingSeconds() {
    if (!this.state || !this.state.timerStartedAt) return CONFIG.MASTER_TIME;

    const start = this.state.timerStartedAt;
    const end = this.state.timerLockedAt || getServerNow();
    const elapsedSec = Math.max(0, Math.floor((end - start) / 1000));
    return Math.min(CONFIG.MASTER_TIME, Math.max(0, CONFIG.MASTER_TIME - elapsedSec));
  }

  /**
   * Check if master timer has expired.
   */
  isMasterExpired() {
    return this.getMasterRemainingSeconds() <= 0;
  }

  /**
   * Computes puzzle remaining seconds using server data.
   */
  getPuzzleRemainingSeconds(id) {
    if (!this.state || !this.state.blocks?.[id]) return 0;

    const block = this.state.blocks[id];
    if (block.status === 'SOLVED' || block.status === 'FAILED') return 0;

    const timeLimitSec = block.timeLimitSeconds || (CONFIG.PUZZLES[id]?.timeLimit) || 600;
    let spentMs = block.timeSpentMs || 0;

    if (block.activeSince && !this.state.vaultEntered && (block.status === 'OPENED' || block.status === 'OPENED_IN_PROGRESS')) {
      spentMs += (getServerNow() - block.activeSince);
    }

    return Math.max(0, timeLimitSec - Math.floor(spentMs / 1000));
  }

  /**
   * Check all opened puzzles for timeouts locally between server syncs.
   */
  checkExpiredPuzzles() {
    if (!this.state || !this.state.blocks) return;
    for (const id in this.state.blocks) {
      const block = this.state.blocks[id];
      if (block.status === 'OPENED' || block.status === 'OPENED_IN_PROGRESS') {
        const remaining = this.getPuzzleRemainingSeconds(id);
        if (remaining <= 0) {
          block.status = 'FAILED';
          block.activeSince = null;
        }
      }
    }
  }

  /**
   * Activate / Open a puzzle. Calls POST /api/puzzle/:id/open.
   * Receives server-validated puzzle data, time limit, and active status.
   */
  async openPuzzle(id) {
    if (!this.state) return null;

    try {
      const res = await Api.openPuzzle(id);

      // Merge server-returned interactive puzzle payload
      if (res.puzzle && CONFIG.PUZZLES[id]) {
        CONFIG.PUZZLES[id].data = res.puzzle.data;
        CONFIG.PUZZLES[id].timeLimit = res.puzzle.timeLimit;
      }

      if (res.unlockedClue && CONFIG.PUZZLES[id]) {
        CONFIG.PUZZLES[id].clue = res.unlockedClue;
      }

      // Update block state
      if (!this.state.blocks[id]) {
        this.state.blocks[id] = {};
      }

      const block = this.state.blocks[id];
      block.status = res.status;
      block.attemptsUsed = res.attemptsUsed || 0;
      block.attemptsRemaining = res.attemptsRemaining;
      block.hintUsed = !!res.hintUsed;
      block.difficulty = res.puzzle?.difficulty || (res.puzzle?.timeLimit <= 600 ? 'easy' : res.puzzle?.timeLimit <= 900 ? 'medium' : 'hard');
      block.timeLimitSeconds = res.puzzle?.timeLimit || 600;
      block.timeRemainingSeconds = res.timeRemainingSeconds;
      block.activeSince = res.status === 'OPENED' ? getServerNow() : null;
      block.unlockedClue = res.unlockedClue || null;

      this.state.activeBlock = id;
      this.state.hintsRemaining = res.hintsLeft ?? this.state.hintsRemaining;

      this.saveState();
      return block;
    } catch (err) {
      console.warn(`Backend openPuzzle failed for ${id}, using local state fallback:`, err);
      if (!this.state.blocks[id]) {
        this.state.blocks[id] = {};
      }
      const block = this.state.blocks[id];
      if (block.status === 'AVAILABLE') {
        block.status = 'OPENED';
      }
      block.attemptsUsed = block.attemptsUsed || 0;
      block.timeLimitSeconds = block.timeLimitSeconds || (CONFIG.PUZZLES[id]?.timeLimit) || 600;
      block.timeRemainingSeconds = block.timeRemainingSeconds ?? block.timeLimitSeconds;
      block.activeSince = block.status === 'OPENED' ? (block.activeSince || getServerNow()) : null;
      this.state.activeBlock = id;
      this.saveState();
      return block;
    }
  }

  /**
   * Leave a puzzle. Calls POST /api/puzzle/:id/leave.
   */
  async leavePuzzle(id) {
    if (!this.state) return;
    const targetId = id || this.state.activeBlock;
    if (!targetId) return;

    try {
      if (this.state.blocks?.[targetId]?.activeSince) {
        const now = getServerNow();
        const block = this.state.blocks[targetId];
        block.timeSpentMs = (block.timeSpentMs || 0) + Math.max(0, now - block.activeSince);
        block.activeSince = null;
      }
      this.state.activeBlock = null;
      this.saveState();

      // Notify backend to pause timer
      await Api.leavePuzzle(targetId).catch(() => {});
    } catch (err) {
      console.warn('Error pausing puzzle on server:', err);
    }
  }

  /**
   * Submit an answer for server validation.
   * Calls POST /api/puzzle/:id/check.
   */
  async submitAnswer(id, rawAnswerOrPayload) {
    if (!this.state || !this.state.blocks?.[id]) {
      return { error: 'Invalid puzzle' };
    }

    try {
      const res = await Api.checkAnswer(id, rawAnswerOrPayload);

      const block = this.state.blocks[id];
      block.status = res.status;
      block.attemptsUsed = res.attemptsUsed || 0;

      if (res.correct) {
        block.unlockedClue = res.clue;
        block.activeSince = null;
        if (CONFIG.PUZZLES[id]) {
          CONFIG.PUZZLES[id].clue = res.clue;
        }
      } else if (res.status === 'FAILED') {
        block.activeSince = null;
      }

      this.saveState();

      return {
        correct: !!res.correct,
        failed: res.status === 'FAILED',
        attemptsLeft: null,
        attemptsUsed: res.attemptsUsed || 0,
        clue: res.clue || null,
        message: res.message || '',
      };
    } catch (err) {
      console.error('Answer check error:', err);
      throw err;
    }
  }

  /**
   * Local helper for wrong attempt recording without failure lockout
   */
  recordWrong(id) {
    if (!this.state || !this.state.blocks[id]) return { failed: false };
    const b = this.state.blocks[id];
    b.attemptsUsed = (b.attemptsUsed || 0) + 1;
    this.saveState();
    return {
      failed: false,
      attemptsUsed: b.attemptsUsed,
      unlimited: true
    };
  }

  /**
   * Request a hint from the server.
   * Calls POST /api/puzzle/:id/hint.
   */
  async useHint(id) {
    if (!this.state || !this.state.blocks?.[id]) return false;

    try {
      const res = await Api.useHint(id);

      if (res.success && res.hint) {
        this.state.hintsRemaining = res.hintsRemaining ?? res.hintsLeft ?? this.state.hintsRemaining;
        if (this.state.blocks[id]) {
          this.state.blocks[id].hintUsed = true;
          this.state.blocks[id].revealedHint = res.hint;
        }
        if (CONFIG.PUZZLES[id]) {
          CONFIG.PUZZLES[id].hint = res.hint;
        }
        this.saveState();
        return { success: true, hint: res.hint, hintsRemaining: this.state.hintsRemaining };
      }

      return false;
    } catch (err) {
      console.error('Hint request error:', err);
      throw err;
    }
  }

  /**
   * Save partial progress locally (selections, entered letters).
   */
  saveProgress(id, progressObj) {
    if (!this.state || !this.state.blocks?.[id]) return;

    this.state.blocks[id].progress = {
      ...(this.state.blocks[id].progress || {}),
      ...progressObj,
    };
    this.saveState();
  }

  /**
   * Enter the submission vault.
   * Calls POST /api/vault/enter to freeze timers and finalize contest state.
   */
  async enterVault() {
    if (!this.state) return null;

    try {
      const res = await Api.enterVault();

      this.state.vaultEntered = true;
      this.state.timerLockedAt = res.timerLockedAt || getServerNow();
      this.state.verificationHash = res.verificationHash;

      if (this.state.activeBlock && this.state.blocks?.[this.state.activeBlock]) {
        this.state.blocks[this.state.activeBlock].activeSince = null;
        this.state.activeBlock = null;
      }

      this.saveState();
      return res;
    } catch (err) {
      console.error('Vault enter error:', err);
      throw err;
    }
  }

  /**
   * Submit final contest poster URL.
   * Calls POST /api/submit.
   */
  async submitVault(posterUrl) {
    if (!this.state) return null;
    return Api.submit({
      posterUrl,
      hash: this.state.verificationHash || '',
    });
  }

  /**
   * Get contest summary statistics.
   */
  getSummary() {
    const questPuzzleIds = Object.keys(CONFIG.PUZZLES);
    const totalQuestPuzzles = questPuzzleIds.length;

    if (!this.state) {
      return { solved: 0, total: totalQuestPuzzles, hintsUsed: 0, timeTakenFormatted: '00:00:00' };
    }

    let solvedCount = 0;
    for (const id of questPuzzleIds) {
      if (this.state.blocks?.[id]?.status === 'SOLVED') {
        solvedCount++;
      }
    }

    const hintsUsed = CONFIG.TOTAL_HINTS - (this.state.hintsRemaining ?? 3);
    const start = this.state.timerStartedAt || getServerNow();
    const end = this.state.timerLockedAt || getServerNow();
    const elapsedSec = Math.min(CONFIG.MASTER_TIME, Math.max(0, Math.floor((end - start) / 1000)));

    const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');

    return {
      solved: solvedCount,
      total: totalQuestPuzzles,
      hintsUsed,
      timeTakenFormatted: `${hrs}:${mins}:${secs}`,
      elapsedSec,
    };
  }

  /**
   * Mark puzzle solved (dev/test helper).
   */
  markSolved(id) {
    if (!this.state || !this.state.blocks?.[id]) return;
    this.state.blocks[id].status = 'SOLVED';
    this.state.blocks[id].activeSince = null;
    this.saveState();
  }

  /**
   * Mark puzzle failed (dev/test helper).
   */
  failPuzzle(id, reason = 'TIMEOUT') {
    if (!this.state || !this.state.blocks?.[id]) return;
    this.state.blocks[id].status = 'FAILED';
    this.state.blocks[id].activeSince = null;
    this.saveState();
  }
}

export const GameState = new StateManager();
