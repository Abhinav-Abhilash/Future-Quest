/**
 * Submission Model & Queries
 * Future Quest 2026 - Server Backend
 *
 * Stores the final vault submission when a team completes the quest.
 */

import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db/connection.js';

export const SubmissionInputSchema = z.object({
  vaultEnteredAt: z.number().int().positive(),
  hash: z.string().min(8).max(128),
  posterUrl: z.string().url().max(512).optional().or(z.literal('')),
});

/**
 * Record a final team vault submission
 */
export async function createSubmission({ teamId, vaultEnteredAt, hash, posterUrl = null, extra = {} }) {
  const { submissions } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  const now = Date.now();

  const doc = {
    teamId: id,
    vaultEnteredAt,
    hash,
    posterUrl: posterUrl || null,
    extra,
    createdAt: now,
  };

  const result = await submissions.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get submission for a team
 */
export async function getSubmissionByTeamId(teamId) {
  const { submissions } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  return submissions.findOne({ teamId: id });
}

