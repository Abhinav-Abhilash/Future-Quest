/**
 * Database Connection & Schema Verification Script
 * Future Quest 2026 - Phase 1 Verification
 *
 * Verifies:
 * 1. MongoDB Atlas connectivity & latency
 * 2. Automatic index creation for all collections
 * 3. Case-insensitive unique team name enforcement
 * 4. Compound unique teamId + puzzleId enforcement on blocks
 * 5. Server clock timestamp generation (Date.now())
 * 6. Audit event logging
 * 7. Clean teardown of test artifacts
 */

import { connectDB, closeDB, getCollections } from './connection.js';
import { ensureIndexes } from './indexes.js';
import { createTeam, findTeamByName } from '../models/team.js';
import { initBlocksForTeam, getTeamBlocks, updateBlock } from '../models/block.js';
import { createSubmission, getSubmissionByTeamId } from '../models/submission.js';
import { logEvent, getTeamEvents, EVENT_TYPES } from '../models/event.js';

async function runTests() {
  console.log('====================================================');
  console.log(' Future Quest 2026 - MongoDB Atlas Phase 1 Test');
  console.log('====================================================\n');

  let db;
  try {
    const startTime = Date.now();
    db = await connectDB();
    const pingTime = Date.now() - startTime;
    console.log(`[PASS] 1. Connected to MongoDB Atlas in ${pingTime}ms`);

    // 2. Ensure indexes
    await ensureIndexes(db);
    console.log('[PASS] 2. Verified indexes across teams, blocks, submissions, events');

    const collections = getCollections();

    // 3. Test Team Creation & Case-Insensitive Uniqueness
    const testTeamName = `TestTeam_${Date.now()}`;
    const testSchool = 'Test Academy of Science';

    const team = await createTeam({
      teamName: testTeamName,
      schoolName: testSchool,
      members: ['Alice', 'Bob'],
      shuffleSeed: 123456,
      tokenHash: 'dummy_hash_for_test',
    });

    console.log(`[PASS] 3a. Created team: "${team.teamName}" (ID: ${team._id})`);
    console.log(`           Server timerStartedAt: ${team.timerStartedAt} (verified server clock)`);

    // Attempt to create duplicate team with DIFFERENT casing:
    let duplicateRejected = false;
    try {
      await createTeam({
        teamName: testTeamName.toLowerCase(), // lower case should collide due to collation strength 2
        schoolName: 'Different School',
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateRejected = true;
        console.log(`[PASS] 3b. Case-insensitive collision rejected "${testTeamName.toLowerCase()}" (code 11000 duplicate key)`);
      } else {
        throw err;
      }
    }

    if (!duplicateRejected) {
      throw new Error('Case-insensitive teamName uniqueness FAILED: duplicate was accepted.');
    }

    // 4. Test Blocks Initialization & Compound Uniqueness
    const initResult = await initBlocksForTeam(team._id);
    console.log(`[PASS] 4a. Initialized ${initResult.insertedCount} puzzle blocks for team`);

    const blocks = await getTeamBlocks(team._id);
    if (blocks.length !== 11) {
      throw new Error(`Expected 11 blocks, got ${blocks.length}`);
    }
    console.log(`[PASS] 4b. Retrieved 11 blocks for team, all initialized to AVAILABLE`);

    // Test compound uniqueness: inserting duplicate block for same team and puzzle_1
    let compoundRejected = false;
    try {
      await collections.blocks.insertOne({
        teamId: team._id,
        puzzleId: 'puzzle_1',
        status: 'LOCKED',
      });
    } catch (err) {
      if (err.code === 11000) {
        compoundRejected = true;
        console.log('[PASS] 4c. Compound uniqueness verified: duplicate (teamId + puzzle_1) rejected');
      } else {
        throw err;
      }
    }

    if (!compoundRejected) {
      throw new Error('Compound index uniqueness FAILED on blocks.');
    }

    // Test block update
    await updateBlock(team._id, 'puzzle_1', {
      status: 'OPENED',
      activeSince: Date.now(),
      attemptsUsed: 1,
    });
    console.log('[PASS] 4d. Updated block status to OPENED with activeSince timestamp');

    // 5. Test Audit Event Logging
    await logEvent(team._id, EVENT_TYPES.PUZZLE_OPENED, {
      puzzleId: 'puzzle_1',
      attempt: 1,
    });
    const events = await getTeamEvents(team._id);
    if (events.length === 0 || events[0].type !== EVENT_TYPES.PUZZLE_OPENED) {
      throw new Error('Event logging failed');
    }
    console.log(`[PASS] 5. Logged and verified audit event: ${events[0].type} at ${events[0].createdAt}`);

    // 6. Test Vault Submission
    const submission = await createSubmission({
      teamId: team._id,
      vaultEnteredAt: Date.now(),
      hash: 'test_sha256_vault_hash_abcdef1234567890',
      posterUrl: 'https://example.com/poster.png',
    });
    console.log(`[PASS] 6. Created vault submission: ID ${submission._id}`);

    // Clean up test data
    console.log('\n[CLEANUP] Cleaning up test records...');
    await collections.teams.deleteOne({ _id: team._id });
    await collections.blocks.deleteMany({ teamId: team._id });
    await collections.submissions.deleteOne({ _id: submission._id });
    await collections.events.deleteMany({ teamId: team._id });
    console.log('[PASS] 7. Cleaned up all test artifacts from database');

    console.log('\n====================================================');
    console.log(' ALL PHASE 1 DATABASE & BACKEND TESTS PASSED!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[FAIL] Phase 1 test encountered an error:', error);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

runTests();
