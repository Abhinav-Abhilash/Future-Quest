/**
 * Future Quest 2026 - Game State Management (Backend API Integrated)
 *
 * All state transitions, timers, validations, clues, and verification hashes
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
        if (parsed.blocks) {
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
   * Re-sync state with MongoDB Atlas backend truth.
   */
  async syncWithServer() {
    if (this.syncInProgress) return this.state;
    this.syncInProgress = true;

    try {
      const data = await Api.getState();
      if (!data || !data.team) {
        this.state = null;
        this.saveState();
        return null;
      }

      const team = data.team;
      const tiles = data.tiles || [];

      // Reconstruct local blocks map from server tiles
      const blocks = {};
      const gridOrder = [];

      tiles.forEach((t) => {
        gridOrder.push(t.puzzleId);
        blocks[t.puzzleId] = {
          status: t.status, // AVAILABLE, OPENED, SOLVED, FAILED
          attemptsUsed: t.attemptsUsed || 0,
          hintUsed: !!t.hintUsed,
          timeSpentMs: 0,
          activeSince: t.status === 'OPENED' ? getServerNow() : null,
          unlockedClue: t.unlockedClue || null,
          timeLimitSeconds: t.timeLimitSeconds || null,
          timeRemainingSeconds: t.timeRemainingSeconds ?? null,
          progress: (this.state?.blocks?.[t.puzzleId]?.progress) || {},
        };

        // Cache any unlocked clue into client config
        if (t.unlockedClue && CONFIG.PUZZLES[t.puzzleId]) {
          CONFIG.PUZZLES[t.puzzleId].clue = t.unlockedClue;
        }
      });

      // Always fix vault_12 at slot 12
      if (!gridOrder.includes('vault_12')) {
        gridOrder.push('vault_12');
      }

      this.state = {
        teamName: team.teamName,
        schoolName: team.schoolName,
        timerStartedAt: team.timerStartedAt,
        timerLockedAt: team.timerLockedAt,
        vaultEntered: !!team.isVaultLocked,
        hintsRemaining: team.hintsLeft ?? 3,
        gridOrder,
        activeBlock: this.state?.activeBlock || null,
        blocks,
        verificationHash: this.state?.verificationHash || null,
      };

      this.saveState();
      return this.state;
    } catch (err) {
      if (err.status === 401) {
        // No active session on server
        this.state = null;
        this.saveState();
        return null;
      }
      // Offline / network failure: keep existing cache
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
    this.saveState();
  }

  /**
   * Register a new team with the backend server.
   * Calls POST /api/register.
   */
  async initSession(teamName, schoolName, members = []) {
    const res = await Api.register({
      teamName: teamName.trim(),
      schoolName: schoolName.trim(),
      members,
    });

    if (!res || !res.team) {
      throw new Error(res?.error || 'Registration failed');
    }

    // Immediately sync state to load seeded grid order and initialized blocks
    await this.syncWithServer();
    return this.state;
  }

  /**
   * Computes master countdown seconds using server clock offset.
   */
  getMasterRemainingSeconds() {
    if (!this.state || !this.state.timerStartedAt) return CONFIG.MASTER_TIME;

    const start = this.state.timerStartedAt;
    const end = this.state.timerLockedAt || getServerNow();
    const elapsedSec = Math.floor((end - start) / 1000);
    return Math.max(0, CONFIG.MASTER_TIME - elapsedSec);
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
    if (CONFIG.PUZZLES[id]?.bonus) return 0;

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
      if (CONFIG.PUZZLES[id]?.bonus) continue;
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

    // Bonus arcade puzzle: purely client-side, does not start a timer or change status
    if (CONFIG.PUZZLES[id]?.bonus) {
      return this.state.blocks[id];
    }

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
      block.timeLimitSeconds = res.puzzle?.timeLimit || 600;
      block.timeRemainingSeconds = res.timeRemainingSeconds;
      block.activeSince = res.status === 'OPENED' ? getServerNow() : null;
      block.unlockedClue = res.unlockedClue || null;

      this.state.activeBlock = id;
      this.state.hintsRemaining = res.hintsLeft ?? this.state.hintsRemaining;

      this.saveState();
      return block;
    } catch (err) {
      console.error(`Failed to open puzzle ${id}:`, err);
      throw err;
    }
  }

  /**
   * Leave a puzzle. Calls POST /api/puzzle/:id/leave.
   */
  async leavePuzzle(id) {
    if (!this.state) return;
    const targetId = id || this.state.activeBlock;
    if (!targetId) return;

    if (CONFIG.PUZZLES[targetId]?.bonus) {
      if (this.state.activeBlock === targetId) {
        this.state.activeBlock = null;
        this.saveState();
      }
      return;
    }

    try {
      if (this.state.blocks?.[targetId]?.activeSince) {
        this.state.blocks[targetId].activeSince = null;
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

    if (CONFIG.PUZZLES[id]?.bonus) {
      return { success: true, correct: true, bonus: true };
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
        attemptsLeft: res.attemptsRemaining ?? Math.max(0, 3 - (res.attemptsUsed || 0)),
        clue: res.clue || null,
        message: res.message || '',
      };
    } catch (err) {
      console.error('Answer check error:', err);
      throw err;
    }
  }

  /**
   * Request a hint from the server.
   * Calls POST /api/puzzle/:id/hint.
   */
  async useHint(id) {
    if (!this.state || !this.state.blocks?.[id]) return false;
    if (CONFIG.PUZZLES[id]?.bonus) return false;

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
    if (CONFIG.PUZZLES[id]?.bonus) return;

    this.state.blocks[id].progress = {
      ...(this.state.blocks[id].progress || {}),
      ...progressObj,
    };
    this.saveState();
  }

  /**
   * Enter the submission vault.
   * Calls POST /api/vault/enter to freeze timers & generate HMAC verification hash.
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
    const questPuzzleIds = Object.keys(CONFIG.PUZZLES).filter((id) => !CONFIG.PUZZLES[id]?.bonus);
    const totalQuestPuzzles = questPuzzleIds.length;

    if (!this.state) {
      return { solved: 0, total: totalQuestPuzzles, hintsUsed: 0, timeTakenFormatted: '00:00:00', verificationHash: '' };
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
      verificationHash: this.state.verificationHash || '',
    };
  }

  /**
   * Mark puzzle solved (dev/test helper; ignores bonus).
   */
  markSolved(id) {
    if (!this.state || !this.state.blocks?.[id]) return;
    if (CONFIG.PUZZLES[id]?.bonus) return;
    this.state.blocks[id].status = 'SOLVED';
    this.state.blocks[id].activeSince = null;
    this.saveState();
  }

  /**
   * Mark puzzle failed (dev/test helper; ignores bonus).
   */
  failPuzzle(id, reason = 'TIMEOUT') {
    if (!this.state || !this.state.blocks?.[id]) return;
    if (CONFIG.PUZZLES[id]?.bonus) return;
    this.state.blocks[id].status = 'FAILED';
    this.state.blocks[id].activeSince = null;
    this.saveState();
  }
}

export const GameState = new StateManager();
