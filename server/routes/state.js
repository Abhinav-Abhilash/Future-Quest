/**
 * Contest State Route
 * Future Quest 2026 - Server Backend
 *
 * Returns team state, master time left, tile statuses, and clues.
 * NON-NEGOTIABLE SECURITY: Answers, difficulties, and time limits are omitted
 * for unopened puzzles.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTeamBlocks } from '../models/block.js';
import { PUZZLES, MASTER_TIME_LIMIT_MS } from '../puzzles/definitions.js';
import { getTeamPuzzleOrder } from '../puzzles/shuffle.js';

const router = Router();

/**
 * GET /api/state
 * Return complete team contest status
 */
router.get('/state', requireAuth, async (req, res) => {
  try {
    const team = req.team;
    const now = Date.now();
    const blocks = await getTeamBlocks(team._id);

    // Map blocks by puzzleId for fast lookup
    const blockMap = new Map();
    blocks.forEach((b) => blockMap.set(b.puzzleId, b));

    // Get deterministic shuffled tile order for this team
    const orderedPuzzleIds = getTeamPuzzleOrder(team.shuffleSeed || 12345);

    let solvedCount = 0;
    const unlockedClues = [];

    const tiles = orderedPuzzleIds.map((puzzleId, index) => {
      const puz = PUZZLES[puzzleId] || {};
      const block = blockMap.get(puzzleId) || {
        status: 'AVAILABLE',
        attemptsUsed: 0,
        hintUsed: false,
        timeSpentMs: 0,
        activeSince: null,
      };

      const isBonus = !!puz.bonus;
      const isSolved = block.status === 'SOLVED';
      const isFailed = block.status === 'FAILED';
      const isOpened = block.status === 'OPENED';

      if (!isBonus && isSolved) {
        solvedCount += 1;
      }

      if (isSolved && block.unlockedClue) {
        unlockedClues.push(block.unlockedClue);
      }

      // Base tile summary safe for client
      const tile = {
        tileIndex: index,
        tileLabel: `Task ${index + 1}`,
        puzzleId,
        status: block.status,
        attemptsUsed: block.attemptsUsed || 0,
        attemptsRemaining: null,
        hintUsed: !!block.hintUsed,
        bonus: isBonus,
      };

      // Only include unlocked clue if solved
      if (isSolved && block.unlockedClue) {
        tile.unlockedClue = block.unlockedClue;
      }

      // For currently OPENED puzzles, compute active time remaining on the fly
      if (isOpened && !isBonus && puz.timeLimit) {
        const totalSpentMs =
          (block.timeSpentMs || 0) + (block.activeSince ? now - block.activeSince : 0);
        const timeLimitMs = puz.timeLimit * 1000;
        tile.timeLimitSeconds = puz.timeLimit;
        tile.timeRemainingSeconds = Math.max(0, Math.floor((timeLimitMs - totalSpentMs) / 1000));
      }

      return tile;
    });

    // Master timer calculations
    const masterRemainingSeconds = Math.max(
      0,
      Math.floor(req.masterTimeRemainingMs / 1000)
    );

    res.status(200).json({
      success: true,
      team: {
        id: team._id.toString(),
        teamName: team.teamName,
        schoolName: team.schoolName,
        timerStartedAt: team.timerStartedAt,
        timerLockedAt: team.timerLockedAt,
        masterTimeRemainingSeconds: masterRemainingSeconds,
        masterTimeLimitSeconds: MASTER_TIME_LIMIT_MS / 1000,
        hintsLeft: team.totalHintsLeft ?? 3,
        isVaultLocked: !!team.timerLockedAt,
      },
      summary: {
        solvedCount,
        totalQuestPuzzles: 10,
        cluesCount: unlockedClues.length,
      },
      tiles,
      clues: unlockedClues,
    });
  } catch (error) {
    console.error('[STATE ROUTE ERROR]', error);
    res.status(500).json({ error: 'Failed to retrieve game state.' });
  }
});

export default router;

