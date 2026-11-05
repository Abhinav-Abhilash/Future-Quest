/**
 * Vault & Final Submission Routes
 * Future Quest 2026 - Server Backend
 *
 * Freezes master timers, computes HMAC-SHA256 verification hashes,
 * and records idempotent contest submissions.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { getCollections } from '../db/connection.js';
import { createSubmission, getSubmissionByTeamId } from '../models/submission.js';
import { logEvent } from '../models/event.js';
import { PUZZLES } from '../puzzles/definitions.js';

const router = Router();
const HMAC_SECRET = process.env.HMAC_SECRET || 'fallback_secret_for_dev_mode_only_123456';

/**
 * POST /api/vault/enter
 * Freezes master timer, locks all active blocks, and generates HMAC-SHA256 verification hash.
 */
router.post('/vault/enter', requireAuth, async (req, res) => {
  try {
    const team = req.team;
    const now = Date.now();
    const { teams, blocks } = getCollections();

    // 1. Freeze master timer if not already locked
    const lockedAt = team.timerLockedAt || now;
    if (!team.timerLockedAt) {
      await teams.updateOne(
        { _id: team._id },
        { $set: { timerLockedAt: lockedAt, updatedAt: now } }
      );
      team.timerLockedAt = lockedAt;
    }

    // 2. Pause any currently active puzzle blocks
    await blocks.updateMany(
      { teamId: team._id, activeSince: { $ne: null } },
      { $set: { activeSince: null, updatedAt: now } }
    );

    // 3. Collect blocks and compute solved tally (excluding bonus puzzle_11)
    const allBlocks = await blocks.find({ teamId: team._id }).toArray();
    const solvedQuestBlocks = [];
    const failedQuestBlocks = [];
    const unlockedClues = [];
    let hintsUsedCount = 0;

    for (const b of allBlocks) {
      const isBonus = PUZZLES[b.puzzleId]?.bonus;
      if (b.hintUsed) hintsUsedCount++;

      if (!isBonus) {
        if (b.status === 'SOLVED') {
          solvedQuestBlocks.push(b.puzzleId);
          if (b.unlockedClue) unlockedClues.push(b.unlockedClue);
        } else if (b.status === 'FAILED') {
          failedQuestBlocks.push(b.puzzleId);
        }
      }
    }

    const solvedIdsSorted = solvedQuestBlocks.sort();

    // 4. Compute cryptographically tamper-evident HMAC-SHA256 verification hash
    const hashPayload = [
      team._id.toString(),
      team.teamName,
      solvedIdsSorted.join(','),
      hintsUsedCount,
      team.timerStartedAt,
      lockedAt,
    ].join(':');

    const verificationHash = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(hashPayload)
      .digest('hex');

    // 5. Audit event
    await logEvent(team._id, 'VAULT_ENTERED', {
      solvedCount: solvedQuestBlocks.length,
      failedCount: failedQuestBlocks.length,
      verificationHash,
      timerLockedAt: lockedAt,
    });

    const totalTimeSpentSeconds = Math.max(
      0,
      Math.floor((lockedAt - team.timerStartedAt) / 1000)
    );

    res.status(200).json({
      success: true,
      vaultLocked: true,
      teamId: team._id.toString(),
      teamName: team.teamName,
      schoolName: team.schoolName,
      solvedCount: solvedQuestBlocks.length,
      totalQuestPuzzles: 10,
      solvedPuzzleIds: solvedIdsSorted,
      failedPuzzleIds: failedQuestBlocks.sort(),
      hintsUsed: hintsUsedCount,
      hintsRemaining: team.totalHintsLeft ?? 0,
      timerStartedAt: team.timerStartedAt,
      timerLockedAt: lockedAt,
      totalTimeSpentSeconds,
      verificationHash,
      clues: unlockedClues,
    });
  } catch (error) {
    console.error('[VAULT ENTER ERROR]', error);
    res.status(500).json({ error: 'Failed to process vault entry.' });
  }
});

/**
 * POST /api/submit
 * Idempotently records the team's final submission
 */
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const team = req.team;
    const now = Date.now();

    // 1. Check if submission already exists (idempotency)
    const existing = await getSubmissionByTeamId(team._id);
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadySubmitted: true,
        message: 'Submission already recorded.',
        submission: {
          id: existing._id.toString(),
          vaultEnteredAt: existing.vaultEnteredAt,
          hash: existing.hash,
          posterUrl: existing.posterUrl,
          createdAt: existing.createdAt,
        },
      });
    }

    // 2. Prepare submission data
    const { posterUrl, hash } = req.body;
    const vaultEnteredAt = team.timerLockedAt || now;

    const submission = await createSubmission({
      teamId: team._id,
      vaultEnteredAt,
      hash: hash || 'not_provided',
      posterUrl: posterUrl || null,
      extra: {
        submittedAt: now,
      },
    });

    await logEvent(team._id, 'FINAL_SUBMITTED', {
      submissionId: submission._id.toString(),
      posterUrl: posterUrl || null,
    });

    res.status(201).json({
      success: true,
      alreadySubmitted: false,
      message: 'Submission successfully recorded.',
      submission: {
        id: submission._id.toString(),
        vaultEnteredAt: submission.vaultEnteredAt,
        hash: submission.hash,
        posterUrl: submission.posterUrl,
        createdAt: submission.createdAt,
      },
    });
  } catch (error) {
    console.error('[SUBMIT ERROR]', error);
    res.status(500).json({ error: 'Failed to record contest submission.' });
  }
});

export default router;
