/**
 * Session Authentication & Master Timer Enforcement Middleware
 * Future Quest 2026 - Server Backend
 *
 * Verifies HMAC session tokens from httpOnly cookies or Authorization headers.
 * Automatically enforces the 2-hour master contest timer on every request.
 */

import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db/connection.js';
import { logEvent, EVENT_TYPES } from '../models/event.js';
import { MASTER_TIME_LIMIT_MS } from '../puzzles/definitions.js';

const HMAC_SECRET = process.env.HMAC_SECRET || 'fallback_secret_for_dev_mode_only_123456';

/**
 * Generate a signed session token for a team
 * @param {string|ObjectId} teamId
 * @returns {{ token: string, tokenHash: string }}
 */
export function generateTeamToken(teamId) {
  const idStr = teamId.toString();
  const issuedAt = Date.now();
  const payload = `${idStr}.${issuedAt}`;
  const sig = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  const token = `${idStr}.${issuedAt}.${sig}`;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  return { token, tokenHash };
}

/**
 * Verify a session token cryptographically
 * @param {string} token
 * @returns {{ valid: boolean, teamId?: string }}
 */
export function verifyTeamToken(token) {
  if (!token || typeof token !== 'string') return { valid: false };

  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };

  const [idStr, issuedAt, sig] = parts;
  const payload = `${idStr}.${issuedAt}`;
  const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');

  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expectedSig, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false };
  }

  return { valid: true, teamId: idStr };
}

/**
 * Express middleware to authenticate team requests and enforce the master timer
 */
export async function requireAuth(req, res, next) {
  try {
    // 1. Extract token from Cookie, Authorization header, or custom header
    let token = req.cookies?.fq_session;
    if (!token && req.headers.authorization) {
      const match = req.headers.authorization.match(/^Bearer\s+(.+)$/i);
      if (match) token = match[1];
    }
    if (!token && req.headers['x-team-token']) {
      token = req.headers['x-team-token'];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please register or provide session token.',
      });
    }

    // 2. Cryptographic signature check
    const verification = verifyTeamToken(token);
    if (!verification.valid || !verification.teamId) {
      return res.status(401).json({ error: 'Invalid or tampered session token.' });
    }

    // 3. Database lookup
    const { teams, blocks } = getCollections();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const team = await teams.findOne({
      _id: new ObjectId(verification.teamId),
      tokenHash,
    });

    if (!team) {
      return res.status(401).json({ error: 'Session expired or team not found.' });
    }

    // 4. Master timer enforcement (2 hours = 7200s from server clock)
    const now = Date.now();
    let isMasterExpired = false;

    if (!team.timerLockedAt) {
      const elapsed = now - team.timerStartedAt;
      if (elapsed >= MASTER_TIME_LIMIT_MS) {
        // Master timer has just expired!
        isMasterExpired = true;
        const lockedAt = team.timerStartedAt + MASTER_TIME_LIMIT_MS;

        // Auto-freeze team
        await teams.updateOne(
          { _id: team._id },
          { $set: { timerLockedAt: lockedAt, updatedAt: now } }
        );
        team.timerLockedAt = lockedAt;

        // Pause and close any currently active blocks
        await blocks.updateMany(
          { teamId: team._id, activeSince: { $ne: null } },
          {
            $set: {
              activeSince: null,
              updatedAt: now,
            },
          }
        );

        await logEvent(team._id, 'MASTER_TIMER_EXPIRED', {
          serverTime: now,
          timerStartedAt: team.timerStartedAt,
          timerLockedAt: lockedAt,
        });
      }
    }

    // Calculate remaining master time in milliseconds
    const remainingMs = team.timerLockedAt
      ? 0
      : Math.max(0, MASTER_TIME_LIMIT_MS - (now - team.timerStartedAt));

    req.team = team;
    req.teamId = team._id;
    req.masterTimeRemainingMs = remainingMs;
    req.isMasterExpired = isMasterExpired || !!team.timerLockedAt;

    next();
  } catch (err) {
    console.error('[AUTH MIDDLEWARE ERROR]', err);
    res.status(500).json({ error: 'Failed to authenticate session.' });
  }
}
