/**
 * MongoDB Atlas Index Initialization Module
 * Future Quest 2026 - Server Backend
 *
 * Enforces data integrity:
 * - Case-insensitive uniqueness on teamName
 * - Compound uniqueness on teamId + puzzleId
 * - Single submission per team
 * - Audit event indices
 */

/**
 * Ensure all required indices are created
 * @param {import('mongodb').Db} db
 */
export async function ensureIndexes(db) {
  const teams = db.collection('teams');
  const blocks = db.collection('blocks');
  const submissions = db.collection('submissions');
  const events = db.collection('events');

  console.log('[DB] Ensuring database indexes...');

  // 1. TEAMS collection
  // Case-insensitive unique index on teamName (strength 2 ignores case and diacritics)
  await teams.createIndex(
    { teamName: 1 },
    {
      unique: true,
      collation: { locale: 'en', strength: 2 },
      name: 'uniq_team_name_ci',
    }
  );

  // Sparse index on tokenHash
  await teams.createIndex(
    { tokenHash: 1 },
    {
      unique: true,
      sparse: true,
      name: 'uniq_token_hash',
    }
  );

  // Index on creation timestamp
  await teams.createIndex({ createdAt: -1 }, { name: 'idx_team_created_at' });

  // 2. BLOCKS collection
  // Compound unique index: A team can only have one block entry per puzzle
  await blocks.createIndex(
    { teamId: 1, puzzleId: 1 },
    {
      unique: true,
      name: 'uniq_team_puzzle',
    }
  );

  // Query index for team status lookups
  await blocks.createIndex(
    { teamId: 1, status: 1 },
    { name: 'idx_team_status' }
  );

  // 3. SUBMISSIONS collection
  // One final submission per team
  await submissions.createIndex(
    { teamId: 1 },
    {
      unique: true,
      name: 'uniq_team_submission',
    }
  );

  await submissions.createIndex(
    { hash: 1 },
    { name: 'idx_submission_hash' }
  );

  // 4. EVENTS collection (Audit log)
  await events.createIndex(
    { teamId: 1, createdAt: -1 },
    { name: 'idx_events_team_created' }
  );

  await events.createIndex(
    { createdAt: -1 },
    { name: 'idx_events_created' }
  );

  console.log('[DB] Indexes verified successfully.');
}
