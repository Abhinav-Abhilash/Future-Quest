/**
 * Future Quest 2026 - Game State Management
 * 
 * NOTE: localStorage is only a client-side cache for this prototype.
 * In the production deployment, all state transitions, validation,
 * timer enforcement, and clues must be verified and issued by the
 * backend server to prevent client-side tampering.
 */

import { CONFIG } from './config.js';

const STORAGE_KEY = 'future_quest_2026_state';

class StateManager {
  constructor() {
    this.state = this.loadState();
    // Cache listeners for reactive UI updates
    this.listeners = new Set();
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
   * Load state from localStorage or return default null if uninitialized.
   */
  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      const parsed = JSON.parse(serialized);
      if (parsed && parsed.teamName && parsed.gridOrder) {
        if (!CONFIG.SHUFFLE_TILES) {
          // In style test mode, enforce fixed sequential order
          parsed.gridOrder = [...Object.keys(CONFIG.PUZZLES), 'vault_12'];
        }
        return parsed;
      }
      return null;
    } catch (e) {
      console.warn('Failed to parse localStorage state:', e);
      return null;
    }
  }

  /**
   * Save current state to localStorage.
   */
  saveState() {
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
   * Check if a valid session exists.
   */
  hasSession() {
    return !!(this.state && this.state.teamName && this.state.timerStartedAt);
  }

  /**
   * Reset session (useful for tests or complete game restart).
   */
  resetSession() {
    this.state = null;
    this.saveState();
  }

  /**
   * Fisher-Yates shuffle algorithm.
   */
  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Initialize a new contest session.
   * Shuffles puzzle 1..11 ONCE and fixes vault_12 at slot 12.
   * Records timerStartedAt = Date.now().
   */
  initSession(teamName, schoolName) {
    const puzzleIds = Object.keys(CONFIG.PUZZLES); // 11 puzzle IDs
    const puzzleOrder = CONFIG.SHUFFLE_TILES ? this.shuffleArray(puzzleIds) : [...puzzleIds];
    // Vault 12 is always the 12th slot (index 11)
    const gridOrder = [...puzzleOrder, 'vault_12'];

    const blocks = {};
    for (const id of puzzleIds) {
      blocks[id] = {
        status: 'UNOPENED', // UNOPENED | OPENED_IN_PROGRESS | SOLVED | FAILED
        attemptsUsed: 0,
        hintUsed: false,
        timeSpentMs: 0,
        activeSince: null,
        unlockedClue: null
      };
    }

    this.state = {
      teamName: teamName.trim(),
      schoolName: schoolName.trim(),
      timerStartedAt: Date.now(),
      timerLockedAt: null,
      vaultEntered: false,
      hintsRemaining: CONFIG.TOTAL_HINTS,
      gridOrder,
      activeBlock: null,
      blocks
    };

    this.saveState();
    return this.state;
  }

  /**
   * Computes master remaining seconds.
   */
  getMasterRemainingSeconds() {
    if (!this.state || !this.state.timerStartedAt) return CONFIG.MASTER_TIME;
    
    const start = this.state.timerStartedAt;
    const end = this.state.timerLockedAt || Date.now();
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
   * Computes puzzle remaining seconds.
   * NOTE: In production, puzzle difficulties and time limits must come from the
   * server later, since anything in client code can be read with DevTools.
   */
  getPuzzleRemainingSeconds(id) {
    if (!this.state || !this.state.blocks[id]) return 0;
    const block = this.state.blocks[id];
    const difficulty = CONFIG.TILE_DIFFICULTY[id] || 'easy';
    const maxSec = CONFIG.DIFFICULTY_TIME[difficulty] || 600;

    let totalSpentMs = block.timeSpentMs || 0;
    if (block.activeSince && !this.state.vaultEntered && block.status === 'OPENED_IN_PROGRESS') {
      totalSpentMs += (Date.now() - block.activeSince);
    }

    const remaining = Math.max(0, maxSec - Math.floor(totalSpentMs / 1000));
    return remaining;
  }

  /**
   * Called when opening a puzzle screen.
   * If UNOPENED, transitions to OPENED_IN_PROGRESS.
   * Starts or resumes activeSince countdown.
   */
  openPuzzle(id) {
    if (!this.state || !this.state.blocks[id]) return null;
    const block = this.state.blocks[id];

    // If master timer or vault entered, do not update timer
    if (this.state.vaultEntered || this.isMasterExpired()) {
      return block;
    }

    // Set active block
    this.state.activeBlock = id;

    // Transition unopened to in-progress
    if (block.status === 'UNOPENED') {
      block.status = 'OPENED_IN_PROGRESS';
    }

    // If still in progress and not locked, start tracking active time
    if (block.status === 'OPENED_IN_PROGRESS') {
      block.activeSince = Date.now();
    }

    this.saveState();
    return block;
  }

  /**
   * Called when leaving a puzzle screen ("Back to grid" or routing away).
   * Pauses the puzzle timer and accumulates elapsed milliseconds.
   */
  leavePuzzle(id) {
    if (!this.state) return;
    const targetId = id || this.state.activeBlock;
    if (!targetId || !this.state.blocks[targetId]) return;

    const block = this.state.blocks[targetId];
    if (block.activeSince) {
      const elapsed = Date.now() - block.activeSince;
      block.timeSpentMs = (block.timeSpentMs || 0) + elapsed;
      block.activeSince = null;
    }

    this.state.activeBlock = null;
    this.saveState();
  }

  /**
   * Submits an answer for the given puzzle.
   * Returns result object: { correct: boolean, failed: boolean, attemptsLeft: number, clue: object | null }
   */
  submitAnswer(id, rawAnswer) {
    if (!this.state || !this.state.blocks[id]) {
      return { error: 'Invalid puzzle' };
    }

    const block = this.state.blocks[id];

    if (this.state.vaultEntered) {
      return { error: 'Contest is locked; vault has been entered.' };
    }

    if (block.status === 'SOLVED' || block.status === 'FAILED') {
      return { error: 'Puzzle is already locked.' };
    }

    // Accumulate time spent up to this moment
    if (block.activeSince) {
      const elapsed = Date.now() - block.activeSince;
      block.timeSpentMs = (block.timeSpentMs || 0) + elapsed;
      block.activeSince = Date.now(); // reset anchor for continued play if not solved
    }

    const normalizedAnswer = (rawAnswer || '').trim().toUpperCase();
    const correctAnswer = (CONFIG.MOCK_ANSWERS[id] || '').trim().toUpperCase();

    if (normalizedAnswer === correctAnswer) {
      // Puzzle Solved!
      block.status = 'SOLVED';
      block.activeSince = null; // puzzle timer stops permanently
      block.unlockedClue = CONFIG.PUZZLES[id].clue;
      this.saveState();
      return {
        correct: true,
        failed: false,
        attemptsLeft: CONFIG.MAX_ATTEMPTS - block.attemptsUsed,
        clue: block.unlockedClue
      };
    } else {
      // Incorrect answer
      block.attemptsUsed = (block.attemptsUsed || 0) + 1;
      const attemptsLeft = CONFIG.MAX_ATTEMPTS - block.attemptsUsed;

      if (attemptsLeft <= 0) {
        // Attempts exhausted: FAIL permanently
        block.status = 'FAILED';
        block.activeSince = null;
        this.saveState();
        return {
          correct: false,
          failed: true,
          attemptsLeft: 0,
          clue: null
        };
      } else {
        this.saveState();
        return {
          correct: false,
          failed: false,
          attemptsLeft,
          clue: null
        };
      }
    }
  }

  /**
   * Spend one of the 3 shared hints on a puzzle.
   */
  useHint(id) {
    if (!this.state || !this.state.blocks[id]) return false;
    const block = this.state.blocks[id];

    if (this.state.vaultEntered || this.isMasterExpired()) return false;
    if (block.hintUsed) return true; // already revealed
    if (this.state.hintsRemaining <= 0) return false;

    this.state.hintsRemaining -= 1;
    block.hintUsed = true;
    this.saveState();
    return true;
  }

  /**
   * Mark a puzzle as failed (e.g. when puzzle timer hits zero).
   */
  failPuzzle(id, reason = 'TIMEOUT') {
    if (!this.state || !this.state.blocks[id]) return;
    const block = this.state.blocks[id];
    if (block.status === 'SOLVED' || block.status === 'FAILED') return;

    // Freeze spent time at max
    const difficulty = CONFIG.TILE_DIFFICULTY[id] || 'easy';
    const maxSec = CONFIG.DIFFICULTY_TIME[difficulty] || 600;
    block.timeSpentMs = maxSec * 1000;
    block.activeSince = null;
    block.status = 'FAILED';
    this.saveState();
  }

  /**
   * Enter the submission vault.
   * Locks the master timer, freezes all tiles, transitions to vault.
   */
  enterVault(isTimerExpired = false) {
    if (!this.state) return;
    if (this.state.vaultEntered) return;

    // Freeze any currently active puzzle timer
    if (this.state.activeBlock && this.state.blocks[this.state.activeBlock]) {
      const active = this.state.blocks[this.state.activeBlock];
      if (active.activeSince) {
        active.timeSpentMs = (active.timeSpentMs || 0) + (Date.now() - active.activeSince);
        active.activeSince = null;
      }
      this.state.activeBlock = null;
    }

    this.state.vaultEntered = true;
    if (isTimerExpired) {
      this.state.timerLockedAt = this.state.timerStartedAt + (CONFIG.MASTER_TIME * 1000);
    } else {
      this.state.timerLockedAt = Date.now();
    }

    this.saveState();
  }

  /**
   * Get contest summary statistics.
   */
  getSummary() {
    if (!this.state) return { solved: 0, total: 11, hintsUsed: 0, timeTakenFormatted: '00:00:00' };

    let solvedCount = 0;
    for (const id in this.state.blocks) {
      if (this.state.blocks[id].status === 'SOLVED') {
        solvedCount++;
      }
    }

    const hintsUsed = CONFIG.TOTAL_HINTS - this.state.hintsRemaining;
    
    // Time taken: from timerStartedAt to timerLockedAt or Date.now()
    const start = this.state.timerStartedAt || Date.now();
    const end = this.state.timerLockedAt || Date.now();
    const elapsedSec = Math.min(CONFIG.MASTER_TIME, Math.max(0, Math.floor((end - start) / 1000)));

    const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');

    return {
      solved: solvedCount,
      total: 11,
      hintsUsed,
      timeTakenFormatted: `${hrs}:${mins}:${secs}`,
      elapsedSec
    };
  }

  /**
   * Generate client-side placeholder verification hash.
   * NOTE: In production, this must be cryptographically generated and signed
   * on the server (e.g. HMAC-SHA256) to prevent client-side forgery.
   */
  generateVerificationHash() {
    if (!this.state) return 'FQ2026-UNINITIALIZED';

    const { teamName, schoolName, timerStartedAt, timerLockedAt } = this.state;
    const summary = this.getSummary();
    const solvedIds = Object.keys(this.state.blocks)
      .filter(id => this.state.blocks[id].status === 'SOLVED')
      .sort()
      .join(',');

    // Simple deterministic pseudo-hash for mockup
    const seed = `${teamName}|${schoolName}|${timerStartedAt}|${timerLockedAt}|${summary.solved}|${solvedIds}`;
    let hashNum = 0;
    for (let i = 0; i < seed.length; i++) {
      hashNum = ((hashNum << 5) - hashNum) + seed.charCodeAt(i);
      hashNum |= 0;
    }
    const hex = Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');
    const teamSlug = teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'TEAM';
    
    return `FQ26-JU-${teamSlug}-S${summary.solved}-H${summary.hintsUsed}-${hex}`;
  }

  // ===================== DEV MODE HELPERS =====================
  devSolve(id) {
    if (!CONFIG.DEV_MODE || !this.state || !this.state.blocks[id]) return;
    const block = this.state.blocks[id];
    block.status = 'SOLVED';
    block.activeSince = null;
    block.unlockedClue = CONFIG.PUZZLES[id].clue;
    this.saveState();
  }

  devFail(id) {
    if (!CONFIG.DEV_MODE || !this.state || !this.state.blocks[id]) return;
    const block = this.state.blocks[id];
    block.status = 'FAILED';
    block.activeSince = null;
    this.saveState();
  }

  devSkipTimer(id) {
    if (!CONFIG.DEV_MODE || !this.state || !this.state.blocks[id]) return;
    const block = this.state.blocks[id];
    const difficulty = CONFIG.TILE_DIFFICULTY[id] || 'easy';
    const maxSec = CONFIG.DIFFICULTY_TIME[difficulty] || 600;
    // Set time spent so only 10 seconds remain
    const targetSpentSec = Math.max(0, maxSec - 10);
    block.timeSpentMs = targetSpentSec * 1000;
    if (block.activeSince) {
      block.activeSince = Date.now();
    }
    this.saveState();
  }
}

export const GameState = new StateManager();
