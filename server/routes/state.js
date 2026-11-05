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
import { getTeamBlocks, initBlocksForTeam } from '../models/block.js';
import { getCollections } from '../db/connection.js';
import { PUZZLES, MASTER_TIME_LIMIT_MS } from '../puzzles/definitions.js';
import { getTeamPuzzleOrder } from '../puzzles/shuffle.js';

const router = Router();

/**
 * Helper to build the unified contest state response
 */
async function buildStateResponse(team, masterTimeRemainingMs) {
  const now = Date.now();
  let blocks = await getTeamBlocks(team._id);

  if (!blocks || blocks.length === 0) {
    await initBlocksForTeam(team._id);
    blocks = await getTeamBlocks(team._id);
  }

  // Map blocks by puzzleId for fast lookup
  const blockMap = new Map();
  blocks.forEach((b) => blockMap.set(b.puzzleId, b));

  // Maintain exact sequential order 1 to 10
  const orderedPuzzleIds = [
    'puzzle_1',
    'puzzle_2',
    'puzzle_3',
    'puzzle_4',
    'puzzle_5',
    'puzzle_6',
    'puzzle_7',
    'puzzle_8',
    'puzzle_9',
    'puzzle_10',
  ];

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

    const isSolved = block.status === 'SOLVED';
    const isFailed = block.status === 'FAILED';
    const isOpened = block.status === 'OPENED';

    if (isSolved) {
      solvedCount += 1;
    }

    if (isSolved && (block.unlockedClue || puz.clue)) {
      unlockedClues.push(block.unlockedClue || puz.clue);
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
      timeSpentMs: block.timeSpentMs || 0,
    };

    // Only include unlocked clue if solved
    if (isSolved && (block.unlockedClue || puz.clue)) {
      tile.unlockedClue = block.unlockedClue || puz.clue;
    }

    // For currently OPENED puzzles, compute active time remaining on the fly
    if (isOpened && puz.timeLimit) {
      const totalSpentMs =
        (block.timeSpentMs || 0) + (block.activeSince ? now - block.activeSince : 0);
      const timeLimitMs = puz.timeLimit * 1000;
      tile.timeLimitSeconds = puz.timeLimit;
      tile.difficulty = puz.difficulty;
      tile.timeRemainingSeconds = Math.max(0, Math.floor((timeLimitMs - totalSpentMs) / 1000));
      tile.timeSpentMs = totalSpentMs;
    }

    return tile;
  });

  // Master timer calculations
  const masterRemainingSeconds = Math.max(
    0,
    Math.floor((masterTimeRemainingMs || 0) / 1000)
  );

  return {
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
  };
}

/**
 * GET /api/state
 * Return complete team contest status
 */
router.get('/state', requireAuth, async (req, res) => {
  try {
    const payload = await buildStateResponse(req.team, req.masterTimeRemainingMs);
    res.status(200).json(payload);
  } catch (error) {
    console.error('[STATE ROUTE ERROR]', error);
    res.status(500).json({ error: 'Failed to retrieve game state.' });
  }
});

/**
 * POST /api/state/sync
 * Two-way resilient synchronization: saves client-confirmed progress into DB and returns state
 */
router.post('/state/sync', requireAuth, async (req, res) => {
  try {
    const team = req.team;
    const now = Date.now();
    const { blocks } = getCollections();
    const clientBlocks = req.body?.blocks;

    if (clientBlocks && typeof clientBlocks === 'object') {
      for (const [puzzleId, b] of Object.entries(clientBlocks)) {
        if (!PUZZLES[puzzleId] || !b) continue;
        if (b.status === 'SOLVED') {
          await blocks.updateOne(
            { teamId: team._id, puzzleId },
            {
              $set: {
                status: 'SOLVED',
                activeSince: null,
                unlockedClue: b.unlockedClue || PUZZLES[puzzleId].clue,
                updatedAt: now,
              },
            },
            { upsert: true }
          );
        }
      }
    }

    const payload = await buildStateResponse(req.team, req.masterTimeRemainingMs);
    res.status(200).json(payload);
  } catch (error) {
    console.error('[STATE SYNC ROUTE ERROR]', error);
    res.status(500).json({ error: 'Failed to sync game state.' });
  }
});

export default router;

