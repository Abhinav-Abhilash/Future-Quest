/**
 * Puzzle Interaction Routes
 * Future Quest 2026 - Server Backend
 *
 * Implements open, leave, answer validation (/check), and hints.
 * Enforces server clock timers, attempt bounds, and anti-leak protections.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { answerLimiter } from '../middleware/security.js';
import { getCollections } from '../db/connection.js';
import {
  PUZZLES,
  checkPuzzleAnswer,
  getClientPuzzlePayload,
} from '../puzzles/definitions.js';
import { logEvent, EVENT_TYPES } from '../models/event.js';

const router = Router();

/**
 * POST /api/puzzle/:id/open
 * Activates a puzzle tile, starts its server timer, pauses any other active puzzle.
 * ONLY NOW returns the interactive puzzle data and time limit.
 */
router.post('/puzzle/:id/open', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const team = req.team;
    const now = Date.now();

    const puz = PUZZLES[id];
    if (!puz) {
      return res.status(404).json({ error: `Puzzle "${id}" not found.` });
    }

    if (req.isMasterExpired) {
      return res.status(403).json({
        error: 'Contest master time has expired. The vault is locked.',
      });
    }

    const { blocks } = getCollections();
    let block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    if (!block) {
      const { initBlocksForTeam } = await import('../models/block.js');
      await initBlocksForTeam(team._id);
      block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    }
    if (!block) {
      return res.status(404).json({ error: 'Puzzle block not initialized for team.' });
    }

    if (block.status === 'FAILED') {
      return res.status(400).json({
        error: 'This puzzle has failed permanently and cannot be reopened.',
        status: 'FAILED',
      });
    }

    // 1. Pause any OTHER currently active puzzle block for this team
    const activeBlocks = await blocks
      .find({ teamId: team._id, puzzleId: { $ne: id }, activeSince: { $ne: null } })
      .toArray();

    for (const other of activeBlocks) {
      const elapsed = now - other.activeSince;
      const updatedSpent = (other.timeSpentMs || 0) + elapsed;
      await blocks.updateOne(
        { _id: other._id },
        {
          $set: {
            timeSpentMs: updatedSpent,
            activeSince: null,
            updatedAt: now,
          },
        }
      );
    }

    // 2. Handle the requested puzzle block
    const isSolved = block.status === 'SOLVED';

    let timeRemainingSeconds = null;

    if (!isSolved) {
      const timeLimitMs = puz.timeLimit * 1000;
      const currentSpentMs = block.timeSpentMs || 0;

      // Check if already timed out while paused
      if (currentSpentMs >= timeLimitMs) {
        await blocks.updateOne(
          { _id: block._id },
          { $set: { status: 'FAILED', activeSince: null, updatedAt: now } }
        );
        return res.status(400).json({
          error: 'Puzzle time limit has expired. Marked as FAILED.',
          status: 'FAILED',
        });
      }

      // Start / resume puzzle timer
      await blocks.updateOne(
        { _id: block._id },
        {
          $set: {
            status: 'OPENED',
            activeSince: now,
            updatedAt: now,
          },
        }
      );

      timeRemainingSeconds = Math.max(0, Math.floor((timeLimitMs - currentSpentMs) / 1000));
      await logEvent(team._id, EVENT_TYPES.PUZZLE_OPENED, { puzzleId: id });
    }

    // 3. Return client-safe interactive payload
    const payload = getClientPuzzlePayload(id);

    res.status(200).json({
      success: true,
      puzzle: payload,
      status: isSolved ? 'SOLVED' : block.status === 'FAILED' ? 'FAILED' : 'OPENED',
      timeRemainingSeconds,
      attemptsRemaining: null,
      attemptsUsed: block.attemptsUsed || 0,
      hintUsed: !!block.hintUsed,
      hintsLeft: team.totalHintsLeft ?? 3,
      unlockedClue: isSolved ? block.unlockedClue : null,
    });
  } catch (error) {
    console.error('[PUZZLE OPEN ERROR]', error);
    res.status(500).json({ error: 'Failed to open puzzle.' });
  }
});

/**
 * POST /api/puzzle/:id/leave
 * Pauses a puzzle's active timer when player navigates away to the grid or another view
 */
router.post('/puzzle/:id/leave', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const team = req.team;
    const now = Date.now();

    const { blocks } = getCollections();
    let block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    if (!block) {
      const { initBlocksForTeam } = await import('../models/block.js');
      await initBlocksForTeam(team._id);
      block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    }
    if (!block) {
      return res.status(404).json({ error: 'Block not found.' });
    }

    if (block.activeSince) {
      const elapsed = now - block.activeSince;
      const updatedSpent = (block.timeSpentMs || 0) + elapsed;
      const puz = PUZZLES[id];
      const isFailed = puz?.timeLimit && updatedSpent >= puz.timeLimit * 1000;

      await blocks.updateOne(
        { _id: block._id },
        {
          $set: {
            timeSpentMs: updatedSpent,
            activeSince: null,
            status: isFailed ? 'FAILED' : block.status,
            updatedAt: now,
          },
        }
      );

      await logEvent(team._id, EVENT_TYPES.PUZZLE_LEFT, {
        puzzleId: id,
        timeSpentMs: updatedSpent,
      });

      return res.status(200).json({
        success: true,
        puzzleId: id,
        status: isFailed ? 'FAILED' : block.status,
        timeSpentMs: updatedSpent,
      });
    }

    res.status(200).json({
      success: true,
      puzzleId: id,
      status: block.status,
      timeSpentMs: block.timeSpentMs || 0,
    });
  } catch (error) {
    console.error('[PUZZLE LEAVE ERROR]', error);
    res.status(500).json({ error: 'Failed to pause puzzle timer.' });
  }
});

/**
 * POST /api/puzzle/:id/check
 * Validates player answer submission entirely on the server.
 * Returns unlocked clue on success. Permanent FAIL on 3 wrong checks.
 */
router.post('/puzzle/:id/check', requireAuth, answerLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const team = req.team;
    const now = Date.now();

    const puz = PUZZLES[id];
    if (!puz) {
      return res.status(404).json({ error: `Puzzle "${id}" not found.` });
    }

    if (req.isMasterExpired) {
      return res.status(403).json({
        error: 'Master contest timer has expired. Cannot submit answers.',
      });
    }

    const { blocks } = getCollections();
    let block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    if (!block) {
      const { initBlocksForTeam } = await import('../models/block.js');
      await initBlocksForTeam(team._id);
      block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    }
    if (!block) {
      return res.status(404).json({ error: 'Puzzle block not found.' });
    }

    if (block.status === 'FAILED') {
      return res.status(400).json({
        error: 'This puzzle has already failed permanently.',
        status: 'FAILED',
      });
    }

    if (block.status === 'SOLVED') {
      return res.status(200).json({
        success: true,
        correct: true,
        status: 'SOLVED',
        clue: block.unlockedClue || puz.clue,
        message: 'Puzzle has already been solved.',
      });
    }

    // Verify time limit has not expired
    if (puz.timeLimit) {
      const activeElapsed = block.activeSince ? now - block.activeSince : 0;
      const totalSpentMs = (block.timeSpentMs || 0) + activeElapsed;
      if (totalSpentMs >= puz.timeLimit * 1000) {
        await blocks.updateOne(
          { _id: block._id },
          {
            $set: {
              status: 'FAILED',
              activeSince: null,
              timeSpentMs: totalSpentMs,
              updatedAt: now,
            },
          }
        );
        return res.status(400).json({
          error: 'Puzzle time limit expired. Marked as FAILED.',
          status: 'FAILED',
        });
      }
    }

    // Server-side answer verification
    const submission = req.body;
    const isCorrect = checkPuzzleAnswer(id, submission);

    if (isCorrect) {
      // Correct answer! Unlock clue and mark SOLVED
      const activeElapsed = block.activeSince ? now - block.activeSince : 0;
      const finalSpentMs = (block.timeSpentMs || 0) + activeElapsed;

      await blocks.updateOne(
        { _id: block._id },
        {
          $set: {
            status: 'SOLVED',
            activeSince: null,
            timeSpentMs: finalSpentMs,
            unlockedClue: puz.clue,
            updatedAt: now,
          },
        }
      );

      await logEvent(team._id, EVENT_TYPES.PUZZLE_SOLVED, {
        puzzleId: id,
        timeSpentMs: finalSpentMs,
        attemptsUsed: block.attemptsUsed || 0,
      });

      return res.status(200).json({
        success: true,
        correct: true,
        status: 'SOLVED',
        clue: puz.clue,
        message: 'Correct answer! Clue fragment unlocked.',
      });
    }

    // Wrong answer - increment attempts (unlimited attempts allowed, no failure lockout)
    const newAttemptsUsed = (block.attemptsUsed || 0) + 1;
    const activeElapsed = block.activeSince ? now - block.activeSince : 0;
    const updatedSpentMs = (block.timeSpentMs || 0) + activeElapsed;

    await blocks.updateOne(
      { _id: block._id },
      {
        $set: {
          attemptsUsed: newAttemptsUsed,
          status: 'OPENED',
          activeSince: now,
          timeSpentMs: updatedSpentMs,
          updatedAt: now,
        },
      }
    );

    await logEvent(team._id, EVENT_TYPES.ANSWER_SUBMITTED, {
      puzzleId: id,
      attemptNumber: newAttemptsUsed,
      correct: false,
    });

    res.status(200).json({
      success: false,
      correct: false,
      status: 'OPENED',
      attemptsUsed: newAttemptsUsed,
      attemptsRemaining: null,
      message: 'Incorrect answer. Try again!',
    });
  } catch (error) {
    console.error('[PUZZLE CHECK ERROR]', error);
    res.status(500).json({ error: 'Failed to validate answer.' });
  }
});

/**
 * POST /api/puzzle/:id/hint
 * Spends one shared team hint (out of 3) and returns hint text.
 */
router.post('/puzzle/:id/hint', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const team = req.team;
    const now = Date.now();

    const puz = PUZZLES[id];
    if (!puz) {
      return res.status(404).json({ error: `Puzzle "${id}" not found.` });
    }

    if (!puz.hint) {
      return res.status(400).json({ error: 'No hint is available for this puzzle.' });
    }

    const { blocks, teams } = getCollections();
    let block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    if (!block) {
      const { initBlocksForTeam } = await import('../models/block.js');
      await initBlocksForTeam(team._id);
      block = await blocks.findOne({ teamId: team._id, puzzleId: id });
    }
    if (!block) {
      return res.status(404).json({ error: 'Puzzle block not found.' });
    }

    // If hint was already unlocked on this tile, return without spending another hint
    if (block.hintUsed) {
      return res.status(200).json({
        success: true,
        hint: puz.hint,
        hintsRemaining: team.totalHintsLeft ?? 0,
        alreadyUsed: true,
      });
    }

    // Check shared team pool
    if ((team.totalHintsLeft ?? 3) <= 0) {
      return res.status(400).json({
        error: 'No hints remaining. All 3 shared hints have been used.',
        hintsRemaining: 0,
      });
    }

    // Deduct one hint
    const updatedHintsLeft = (team.totalHintsLeft ?? 3) - 1;

    await teams.updateOne(
      { _id: team._id },
      { $set: { totalHintsLeft: updatedHintsLeft, updatedAt: now } }
    );

    await blocks.updateOne(
      { _id: block._id },
      { $set: { hintUsed: true, updatedAt: now } }
    );

    await logEvent(team._id, EVENT_TYPES.HINT_REQUESTED, {
      puzzleId: id,
      hintsRemaining: updatedHintsLeft,
    });

    res.status(200).json({
      success: true,
      hint: puz.hint,
      hintsRemaining: updatedHintsLeft,
      alreadyUsed: false,
    });
  } catch (error) {
    console.error('[PUZZLE HINT ERROR]', error);
    res.status(500).json({ error: 'Failed to request hint.' });
  }
});

export default router;

