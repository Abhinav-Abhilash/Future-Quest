/**
 * Audit Event Log Model
 * Future Quest 2026 - Server Backend
 *
 * Implements tamper-evident event auditing for every state change.
 * Server timestamp Date.now() is always used.
 */

import { ObjectId } from 'mongodb';
import { getCollections } from '../db/connection.js';

export const EVENT_TYPES = {
  TEAM_REGISTERED: 'TEAM_REGISTERED',
  PUZZLE_OPENED: 'PUZZLE_OPENED',
  PUZZLE_LEFT: 'PUZZLE_LEFT',
  HINT_REQUESTED: 'HINT_REQUESTED',
  ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
  PUZZLE_SOLVED: 'PUZZLE_SOLVED',
  PUZZLE_EXPIRED: 'PUZZLE_EXPIRED',
  VAULT_SUBMITTED: 'VAULT_SUBMITTED',
  DEV_RESET: 'DEV_RESET',
};

/**
 * Log an audit event to the database
 * @param {string|ObjectId|null} teamId
 * @param {string} type - Event type constant
 * @param {object} [details={}] - Context metadata
 */
export async function logEvent(teamId, type, details = {}) {
  const { events } = getCollections();
  const id = teamId ? (typeof teamId === 'string' ? new ObjectId(teamId) : teamId) : null;
  const now = Date.now();

  const doc = {
    teamId: id,
    type,
    details,
    createdAt: now,
  };

  await events.insertOne(doc);
  return doc;
}

/**
 * Get audit logs for a team
 */
export async function getTeamEvents(teamId, limit = 100) {
  const { events } = getCollections();
  const id = typeof teamId === 'string' ? new ObjectId(teamId) : teamId;
  return events.find({ teamId: id }).sort({ createdAt: -1 }).limit(limit).toArray();
}

