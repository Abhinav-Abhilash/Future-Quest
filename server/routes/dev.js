/**
 * Dev-Only Management Routes
 * Future Quest 2026 - Server Backend
 *
 * NON-NEGOTIABLE SAFETY:
 * Disabled in production environments (NODE_ENV === 'production').
 * Requires valid ADMIN_TOKEN header or body parameter.
 */

import { Router } from 'express';
import { getCollections } from '../db/connection.js';
import { verifyTeamToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = Router();

// Middleware: ensure non-production and valid ADMIN_TOKEN
function requireAdminDev(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev endpoints are disabled in production.' });
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return res.status(500).json({ error: 'ADMIN_TOKEN is not configured.' });
  }

  const providedToken = req.headers['x-admin-token'] || req.body?.adminToken;
  if (!providedToken || providedToken !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin token.' });
  }

  next();
}

/**
 * POST /api/dev/reset
 * Dev-only endpoint to wipe team data or adjust the master timer for testing.
 */
router.post('/dev/reset', requireAdminDev, async (req, res) => {
  try {
    // 1. Identify team from cookie, auth header, or body teamId
    let token = req.cookies?.fq_session;
    if (!token && req.headers.authorization) {
      const match = req.headers.authorization.match(/^Bearer\s+(.+)$/i);
      if (match) token = match[1];
    }

    let teamId = req.body?.teamId;
    if (!teamId && token) {
      const verified = verifyTeamToken(token);
      if (verified.valid) teamId = verified.teamId;
    }

    const { teams, blocks, submissions, events } = getCollections();

    // 2. Timer adjustment mode (for testing auto-lock or expiration)
    if (req.body?.setMasterTimeRemainingSeconds !== undefined) {
      if (!teamId) {
        return res.status(400).json({ error: 'Team ID or session token required for timer adjustment.' });
      }

      const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
      const targetRemainingSec = Math.max(0, Number(req.body.setMasterTimeRemainingSeconds));
      const simulatedElapsedMs = (7200 - targetRemainingSec) * 1000;
      const adjustedStartedAt = Date.now() - simulatedElapsedMs;

      await teams.updateOne(
        { _id: id },
        {
          $set: {
            timerStartedAt: adjustedStartedAt,
            timerLockedAt: targetRemainingSec === 0 ? Date.now() : null,
            updatedAt: Date.now(),
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `Simulated master timer adjusted to ${targetRemainingSec} seconds remaining.`,
        simulatedRemainingSeconds: targetRemainingSec,
      });
    }

    // 3. Full team wipe mode
    if (teamId) {
      const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
      await teams.deleteOne({ _id: id });
      await blocks.deleteMany({ teamId: id });
      await submissions.deleteMany({ teamId: id });
      await events.deleteMany({ teamId: id });
    }

    res.clearCookie('fq_session');
    res.status(200).json({
      success: true,
      message: 'Dev reset complete: team session and all database records cleared.',
    });
  } catch (error) {
    console.error('[DEV RESET ERROR]', error);
    res.status(500).json({ error: 'Dev reset failed.' });
  }
});

export default router;

