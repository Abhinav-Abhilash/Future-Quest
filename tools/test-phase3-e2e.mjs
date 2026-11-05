/**
 * Phase 3 End-to-End Frontend Integration Verification Test
 * Future Quest 2026
 *
 * Verifies that the client API client (js/api.js) and GameState (js/state.js)
 * communicate end-to-end with the backend server and MongoDB Atlas:
 * 1. Team Registration & Session Cookie
 * 2. Duplicate Team Name rejection
 * 3. Client state secrecy (no answers/difficulty on unopened tiles)
 * 4. Puzzle Open & timer initialization
 * 5. Wrong Answer x 3 -> Permanent failure
 * 6. Puzzle 2 Open & Hint deduction
 * 7. Correct answer -> Solved & clue unsealed
 * 8. Bonus puzzle (Apple Eats Snake) excluded from totals
 * 9. Client Reload simulation -> Server sync restores full state
 * 10. Vault Entry -> Timer locked & HMAC verification hash generated
 * 11. Poster Submission -> Idempotent recording
 * 12. Dev Reset -> Cleanup
 */

import { startServer } from '../server/index.js';
import { closeDB } from '../server/db/connection.js';
import { Api } from '../js/api.js';
import { GameState } from '../js/state.js';
import { CONFIG } from '../js/config.js';

let passedTests = 0;
let totalTests = 0;

function assert(description, condition, extra = '') {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${description} ${extra}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

async function runE2ETest() {
  console.log('====================================================');
  console.log(' Future Quest 2026 - Phase 3 Frontend E2E Test Suite');
  console.log('====================================================\n');

  let serverInstance = null;
  const testId = Date.now();
  const testTeam = `E2E_Team_${testId}`;
  const testSchool = `SFT High School ${testId}`;

  try {
    // 1. Boot server
    const { server } = await startServer();
    serverInstance = server;

    // Cookie jar simulation for Node.js environment
    let cookieJar = '';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options = {}) => {
      const opts = { ...options };
      opts.headers = { ...(opts.headers || {}) };
      if (cookieJar) {
        opts.headers['Cookie'] = cookieJar;
      }
      const res = await originalFetch(url, opts);
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        cookieJar = setCookie.split(';')[0];
      }
      return res;
    };

    // --- TEST 1: Registration ---
    console.log('--- 1. Testing Team Registration ---');
    const regRes = await GameState.initSession(testTeam, testSchool);
    assert('Registration succeeds and returns state', !!regRes && regRes.teamName === testTeam);
    assert('Server set timerStartedAt timestamp', typeof regRes.timerStartedAt === 'number' && regRes.timerStartedAt > 0);
    assert('Initial hintsRemaining is 3', regRes.hintsRemaining === 3);
    assert('Grid order has 12 tiles', regRes.gridOrder && regRes.gridOrder.length === 12);

    // --- TEST 2: Duplicate Registration Rejection ---
    console.log('\n--- 2. Testing Duplicate Name Rejection ---');
    let dupFailed = false;
    try {
      await Api.register({ teamName: testTeam.toLowerCase(), schoolName: 'Another School' });
    } catch (e) {
      dupFailed = true;
      assert('Duplicate team name rejected with error', e.message.includes('already taken') || e.status === 409);
    }
    assert('Duplicate registration was blocked', dupFailed);

    // --- TEST 3: State Secrecy ---
    console.log('\n--- 3. Testing Client Data Secrecy ---');
    const state = await Api.getState();
    const unopenedTiles = state.tiles.filter(t => t.status === 'AVAILABLE');
    assert('Unopened tiles exist', unopenedTiles.length > 0);
    unopenedTiles.forEach(t => {
      assert(`Tile ${t.puzzleId} hides difficulty until opened`, !t.difficulty);
      assert(`Tile ${t.puzzleId} hides time limit until opened`, !t.timeLimitSeconds);
      assert(`Tile ${t.puzzleId} hides answer/solution`, !t.solution && !t.answers);
    });

    // --- TEST 4: Puzzle Open & Timer Start ---
    console.log('\n--- 4. Testing Puzzle Open ---');
    const p1Block = await GameState.openPuzzle('puzzle_1');
    assert('puzzle_1 open returns block data', !!p1Block);
    assert('puzzle_1 status becomes OPENED', p1Block.status === 'OPENED' || p1Block.status === 'OPENED_IN_PROGRESS');
    assert('puzzle_1 time limit is revealed', typeof p1Block.timeLimitSeconds === 'number' && p1Block.timeLimitSeconds > 0);
    assert('puzzle_1 countdown is active', GameState.getPuzzleRemainingSeconds('puzzle_1') > 0);

    // --- TEST 5: Wrong Check x3 -> Permanent Failure ---
    console.log('\n--- 5. Testing Wrong Answer x3 Permanent Failure ---');
    const w1 = await GameState.submitAnswer('puzzle_1', 'WRONG_ANSWER_1');
    assert('Attempt 1 rejected', !w1.correct && w1.attemptsLeft === 2);

    const w2 = await GameState.submitAnswer('puzzle_1', 'WRONG_ANSWER_2');
    assert('Attempt 2 rejected', !w2.correct && w2.attemptsLeft === 1);

    const w3 = await GameState.submitAnswer('puzzle_1', 'WRONG_ANSWER_3');
    assert('Attempt 3 rejected and puzzle failed', !w3.correct && w3.failed === true);
    assert('State marks puzzle_1 FAILED', GameState.state.blocks.puzzle_1.status === 'FAILED');

    // --- TEST 6: Puzzle 2 Open & Hint Deduction ---
    console.log('\n--- 6. Testing Puzzle 2 Open & Hint Usage ---');
    await GameState.openPuzzle('puzzle_2');
    const hintRes = await GameState.useHint('puzzle_2');
    assert('Hint returned from server', typeof hintRes.hint === 'string' && hintRes.hint.length > 0);
    assert('Hints remaining decremented to 2', GameState.state.hintsRemaining === 2);

    // Re-requesting hint should be free
    const hintRes2 = await GameState.useHint('puzzle_2');
    assert('Re-requesting same hint succeeds without extra deduction', hintRes2.hint === hintRes.hint);
    assert('Hints remaining stays 2', GameState.state.hintsRemaining === 2);

    // --- TEST 7: Correct Answer Solve & Clue Unsealed ---
    console.log('\n--- 7. Testing Correct Answer & Clue Unsealing ---');
    // Puzzle 2 answer is LEARN BUILD LEAD
    const correctRes = await GameState.submitAnswer('puzzle_2', 'LEARN BUILD LEAD');
    assert('Answer verified correct by server', correctRes.correct === true);
    assert('Clue unlocked and sealed object returned', !!correctRes.clue && typeof correctRes.clue.title === 'string');
    assert('puzzle_2 marked SOLVED', GameState.state.blocks.puzzle_2.status === 'SOLVED');

    // --- TEST 8: Bonus Puzzle Exclusions ---
    console.log('\n--- 8. Testing Apple Eats Snake Bonus Mini-Game ---');
    await GameState.openPuzzle('puzzle_11');
    assert('puzzle_11 bonus timer is 0', GameState.getPuzzleRemainingSeconds('puzzle_11') === 0);
    assert('puzzle_11 hint returns false', (await GameState.useHint('puzzle_11')) === false);
    const summary = GameState.getSummary();
    assert('Contest total is 10 (excludes bonus)', summary.total === 10);
    assert('Contest solved is 1 of 10', summary.solved === 1);

    // --- TEST 9: Reload / Server Sync State Restoration ---
    console.log('\n--- 9. Testing Client Reload Simulation ---');
    // Wipe client memory to simulate tab close/reopen
    GameState.state = null;
    await GameState.syncWithServer();
    assert('Session restored from server on reload', GameState.hasSession());
    assert('puzzle_1 remains FAILED after reload', GameState.state.blocks.puzzle_1.status === 'FAILED');
    assert('puzzle_2 remains SOLVED with clue after reload', GameState.state.blocks.puzzle_2.status === 'SOLVED' && !!GameState.state.blocks.puzzle_2.unlockedClue);
    assert('Hints remaining remains 2 after reload', GameState.state.hintsRemaining === 2);

    // --- TEST 10: Vault Entry ---
    console.log('\n--- 10. Testing Vault Entry & HMAC Hash ---');
    const vaultRes = await GameState.enterVault();
    assert('Vault entry succeeds', GameState.state.vaultEntered === true);
    assert('Timer locked timestamp returned', typeof vaultRes.timerLockedAt === 'number');
    assert('Cryptographic HMAC verification hash returned', typeof vaultRes.verificationHash === 'string' && vaultRes.verificationHash.length === 64);
    assert('HMAC hash saved to client state', GameState.state.verificationHash === vaultRes.verificationHash);

    // --- TEST 11: Final Poster Submission ---
    console.log('\n--- 11. Testing Poster Submission ---');
    const subRes = await GameState.submitVault('https://example.com/poster.png');
    assert('Poster submission accepted', !!subRes && (subRes.success === true || subRes.alreadySubmitted === true));

    // Duplicate submission should be idempotent
    const subResDup = await GameState.submitVault('https://example.com/poster.png');
    assert('Duplicate poster submission is idempotent', !!subResDup);

    // --- TEST 12: Dev Reset ---
    console.log('\n--- 12. Testing Dev Reset ---');
    const resetRes = await Api.devReset(process.env.ADMIN_TOKEN);
    assert('Dev reset cleared server state', resetRes.success === true);

    console.log('\n====================================================');
    console.log(` ALL PHASE 3 E2E TESTS PASSED (${passedTests}/${totalTests})!`);
    console.log('====================================================\n');
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await closeDB();
  }
}

runE2ETest().catch(err => {
  console.error('\n[FATAL] E2E Test Suite Error:', err);
  process.exit(1);
});
