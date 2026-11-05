/**
 * Team Model & Validation
 * Future Quest 2026 - Server Backend
 */

import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db/connection.js';

// Input validation schema with strict length bounds
export const TeamRegistrationSchema = z.object({
  teamName: z
    .string({ required_error: 'Team name is required' })
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(32, 'Team name cannot exceed 32 characters')
    .regex(/^[a-zA-Z0-9 _\-]+$/, 'Team name can only contain letters, numbers, spaces, underscores, and hyphens'),
  schoolName: z
    .string({ required_error: 'School/Institution name is required' })
    .trim()
    .min(2, 'School name must be at least 2 characters')
    .max(64, 'School name cannot exceed 64 characters'),
  members: z
    .array(
      z.string().trim().min(2, 'Member name must be at least 2 characters').max(32, 'Member name cannot exceed 32 characters')
    )
    .max(5, 'A team can have at most 5 members')
    .optional()
    .default([]),
});

/**
 * Create a new team in MongoDB
 * Server clock is the source of truth for timestamps.
 */
export async function createTeam({ teamName, schoolName, members = [], shuffleSeed, tokenHash }) {
  const { teams } = getCollections();
  const now = Date.now();

  const doc = {
    teamName: teamName.trim(),
    schoolName: schoolName.trim(),
    members: members.map((m) => m.trim()),
    shuffleSeed: shuffleSeed || Math.floor(Math.random() * 1000000),
    tokenHash: tokenHash || null,
    timerStartedAt: now,
    timerLockedAt: null,
    totalHintsLeft: 3,
    createdAt: now,
    updatedAt: now,
  };

  const result = await teams.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Find team by MongoDB ObjectId
 */
export async function findTeamById(teamId) {
  const { teams } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  return teams.findOne({ _id: id });
}

/**
 * Find team by session token hash
 */
export async function findTeamByTokenHash(tokenHash) {
  const { teams } = getCollections();
  return teams.findOne({ tokenHash });
}

/**
 * Find team by teamName (case-insensitive)
 */
export async function findTeamByName(teamName) {
  const { teams } = getCollections();
  return teams.findOne(
    { teamName: teamName.trim() },
    { collation: { locale: 'en', strength: 2 } }
  );
}

/**
 * Update team session token
 */
export async function updateTeamToken(teamId, tokenHash) {
  const { teams } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  return teams.updateOne(
    { _id: id },
    { $set: { tokenHash, updatedAt: Date.now() } }
  );
}

