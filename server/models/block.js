/**
 * Block Model & Queries
 * Future Quest 2026 - Server Backend
 *
 * Represents a team's progress on an individual puzzle tile.
 */

import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getCollections } from '../db/connection.js';

export const BLOCK_STATUS = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  OPENED: 'OPENED',
  SOLVED: 'SOLVED',
  FAILED: 'FAILED',
};

export const BlockUpdateSchema = z.object({
  status: z.enum(['LOCKED', 'AVAILABLE', 'OPENED', 'SOLVED', 'FAILED']).optional(),
  attemptsUsed: z.number().int().min(0).max(3).optional(),
  hintUsed: z.boolean().optional(),
  timeSpentMs: z.number().int().min(0).optional(),
  activeSince: z.number().int().nullable().optional(),
  unlockedClue: z.string().nullable().optional(),
  progress: z.record(z.any()).nullable().optional(),
});

/**
 * Initialize all 11 puzzle blocks for a newly registered team
 * @param {string|ObjectId} teamId
 * @param {string[]} [puzzleIds]
 */
export async function initBlocksForTeam(teamId, puzzleIds) {
  const { blocks } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;

  const defaultIds = puzzleIds || [
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
    'puzzle_11',
  ];

  const now = Date.now();
  const docs = defaultIds.map((puzzleId) => ({
    teamId: id,
    puzzleId,
    status: BLOCK_STATUS.AVAILABLE,
    attemptsUsed: 0,
    hintUsed: false,
    timeSpentMs: 0,
    activeSince: null,
    unlockedClue: null,
    progress: null,
    createdAt: now,
    updatedAt: now,
  }));

  return blocks.insertMany(docs);
}

/**
 * Get all blocks for a team
 */
export async function getTeamBlocks(teamId) {
  const { blocks } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  return blocks.find({ teamId: id }).toArray();
}

/**
 * Get a single block by teamId and puzzleId
 */
export async function getBlock(teamId, puzzleId) {
  const { blocks } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  return blocks.findOne({ teamId: id, puzzleId });
}

/**
 * Update block state for a team
 */
export async function updateBlock(teamId, puzzleId, updates) {
  const { blocks } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;

  return blocks.findOneAndUpdate(
    { teamId: id, puzzleId },
    {
      $set: {
        ...updates,
        updatedAt: Date.now(),
      },
    },
    { returnDocument: 'after' }
  );
}
