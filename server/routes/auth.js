/**
 * Authentication & Registration Routes
 * Future Quest 2026 - Server Backend
 */

import { Router } from 'express';
import { TeamRegistrationSchema, createTeam, findTeamByName } from '../models/team.js';
import { initBlocksForTeam } from '../models/block.js';
import { logEvent, EVENT_TYPES } from '../models/event.js';
import { generateTeamToken } from '../middleware/auth.js';
import { registerLimiter } from '../middleware/security.js';
import { MASTER_TIME_LIMIT_MS } from '../puzzles/definitions.js';

const router = Router();

/**
 * POST /api/register
 * Register a new team and initialize the contest session
 */
router.post('/register', registerLimiter, async (req, res) => {
  try {
    // 1. Strict input validation with length limits
    const parsed = TeamRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const { teamName, schoolName, members } = parsed.data;

    // 2. Case-insensitive unique check
    const existing = await findTeamByName(teamName);
    if (existing) {
      return res.status(409).json({
        error: `Team name "${teamName}" is already registered. Please choose a different name.`,
      });
    }

    // 3. Seed generation
    const shuffleSeed = Math.floor(Math.random() * 1000000);

    // 4. Create team with server timestamp
    const team = await createTeam({
      teamName,
      schoolName,
      members,
      shuffleSeed,
    });

    // 5. Generate HMAC session token & hash
    const { token, tokenHash } = generateTeamToken(team._id);

    // Update team document with tokenHash
    const { teams } = (await import('../db/connection.js')).getCollections();
    await teams.updateOne({ _id: team._id }, { $set: { tokenHash } });

    // 6. Initialize all 11 puzzle blocks for this team
    await initBlocksForTeam(team._id);

    // 7. Audit log event
    await logEvent(team._id, EVENT_TYPES.TEAM_REGISTERED, {
      teamName,
      schoolName,
      memberCount: members.length,
      shuffleSeed,
    });

    // 8. Set secure, httpOnly, SameSite cookie
    res.cookie('fq_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 4 * 60 * 60 * 1000, // 4 hours
    });

    // Return response with server-confirmed parameters and token
    res.status(201).json({
      success: true,
      message: 'Team registered successfully.',
      team: {
        id: team._id.toString(),
        teamName: team.teamName,
        schoolName: team.schoolName,
        timerStartedAt: team.timerStartedAt,
        masterTimeLimitSeconds: MASTER_TIME_LIMIT_MS / 1000,
        hintsLeft: 3,
      },
      token, // Also returned in JSON for Authorization header support in curl/scripts
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A team with that name already exists. Please choose a different name.',
      });
    }
    console.error('[REGISTER ERROR]', error);
    res.status(500).json({ error: 'Server error during team registration.' });
  }
});

export default router;
