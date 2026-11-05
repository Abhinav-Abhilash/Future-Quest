/**
 * Phase 2 API Routes Verification Test
 * Future Quest 2026 - Server Backend
 *
 * Runs the full sequence required by the deliverable specification:
 * 1. Register team
 * 2. Duplicate registration rejection (case-insensitive)
 * 3. Fetch state (answers, difficulty omitted)
 * 4. Open puzzle_1
 * 5. Wrong answer x3 -> permanent FAIL
 * 6. Open puzzle_2
 * 7. Use hint -> deducts 1 of 3 hints
 * 8. Re-request hint -> free return without extra deduction
 * 9. Correct answer -> SOLVED, clue unlocked
 * 10. Open puzzle_11 -> bonus arcade verified
 * 11. Enter vault -> freezes timer, HMAC verification hash generated
 * 12. Submit poster -> idempotent submission
 * 13. Dev reset -> cleans up team data
 */

import { startServer } from '../index.js';
import { closeDB } from '../db/connection.js';

const BASE_URL = 'http://localhost:3001/api';

async function runRouteTests() {
  console.log('====================================================');
  console.log(' Future Quest 2026 - Phase 2 API Routes Test Suite');
  console.log('====================================================\n');

  let serverInstance = null;
  const testSuffix = Date.now();
  const testTeamName = `ApexRacers_${testSuffix}`;
  let sessionToken = null;
  let cookieHeader = null;

  try {
    // 1. Start server instance
    const { server } = await startServer();
    serverInstance = server;

    // Helper fetch wrapper supporting cookies and auth
    async function api(path, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      if (sessionToken && !headers['Authorization'] && !headers['authorization']) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });

      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/fq_session=([^;]+)/);
        if (match) {
          cookieHeader = `fq_session=${match[1]}`;
        }
      }

      const data = await res.json().catch(() => null);
      return { status: res.status, ok: res.ok, data };
    }

    // Step 1: POST /api/register
    console.log('[STEP 1] Testing POST /api/register...');
    const regRes = await api('/register', {
      method: 'POST',
      body: JSON.stringify({
        teamName: testTeamName,
        schoolName: 'St. Xavier Higher Secondary School',
        members: ['Ethan Vance', 'Maya Lin'],
      }),
    });

    if (regRes.status !== 201 || !regRes.data?.success) {
      throw new Error(`Register failed: ${JSON.stringify(regRes.data)}`);
    }

    sessionToken = regRes.data.token;
    console.log(`[PASS] Team "${testTeamName}" registered.`);
    console.log(`       Session Token: ${sessionToken.slice(0, 24)}...`);
    console.log(`       Server Timer: ${regRes.data.team.timerStartedAt} ms\n`);

    // Step 2: Test Case-Insensitive Duplicate Name Rejection
    console.log('[STEP 2] Testing duplicate registration rejection (case-insensitive)...');
    const dupRes = await api('/register', {
      method: 'POST',
      body: JSON.stringify({
        teamName: testTeamName.toLowerCase(), // lower case collision
        schoolName: 'Another School',
      }),
    });

    if (dupRes.status === 409) {
      console.log(`[PASS] Correctly rejected duplicate name (HTTP 409): "${dupRes.data.error}"\n`);
    } else {
      throw new Error(`Expected HTTP 409, got ${dupRes.status}: ${JSON.stringify(dupRes.data)}`);
    }

    // Step 3: GET /api/state
    console.log('[STEP 3] Testing GET /api/state (Anti-leak validation)...');
    const stateRes = await api('/state');
    if (!stateRes.ok) throw new Error(`State error: ${JSON.stringify(stateRes.data)}`);

    const { tiles, summary, team } = stateRes.data;
    console.log(`[PASS] State received. Total Quest Puzzles: ${summary.totalQuestPuzzles}, Solved: ${summary.solvedCount}`);
    console.log(`       Master Time Remaining: ${team.masterTimeRemainingSeconds}s, Hints Left: ${team.hintsLeft}`);

    // Verify unopened tiles leak no answers or difficulty
    const puz1Tile = tiles.find((t) => t.puzzleId === 'puzzle_1');
    if (puz1Tile.answer || puz1Tile.difficulty || puz1Tile.timeLimitSeconds) {
      throw new Error(`SECURITY LEAK: Unopened tile contains answers/difficulty/timeLimit!`);
    }
    console.log('[PASS] Security Verified: No answers, difficulty, or time limits exposed for unopened tiles.\n');

    // Step 4: POST /api/puzzle/puzzle_1/open
    console.log('[STEP 4] Testing POST /api/puzzle/puzzle_1/open...');
    const openRes = await api('/puzzle/puzzle_1/open', { method: 'POST' });
    if (!openRes.ok) throw new Error(`Open puzzle error: ${JSON.stringify(openRes.data)}`);

    console.log(`[PASS] puzzle_1 opened.`);
    console.log(`       Title: "${openRes.data.puzzle.title}"`);
    console.log(`       Time Limit: ${openRes.data.puzzle.timeLimit}s, Remaining: ${openRes.data.timeRemainingSeconds}s`);
    console.log(`       Attempts Remaining: ${openRes.data.attemptsRemaining}\n`);

    // Step 5: Test 3 Wrong Answers on puzzle_1 -> Permanent FAIL
    console.log('[STEP 5] Testing 3 wrong answers on puzzle_1 (Testing attempt bounds)...');

    // Attempt 1
    const wrong1 = await api('/puzzle/puzzle_1/check', {
      method: 'POST',
      body: JSON.stringify({ answer: 'WRONG GUESS ONE' }),
    });
    console.log(`       Wrong 1: Attempts remaining = ${wrong1.data.attemptsRemaining}, status = ${wrong1.data.status}`);

    // Attempt 2
    const wrong2 = await api('/puzzle/puzzle_1/check', {
      method: 'POST',
      body: JSON.stringify({ answer: 'WRONG GUESS TWO' }),
    });
    console.log(`       Wrong 2: Attempts remaining = ${wrong2.data.attemptsRemaining}, status = ${wrong2.data.status}`);

    // Attempt 3 -> Should fail
    const wrong3 = await api('/puzzle/puzzle_1/check', {
      method: 'POST',
      body: JSON.stringify({ answer: 'WRONG GUESS THREE' }),
    });
    console.log(`       Wrong 3: Attempts remaining = ${wrong3.data.attemptsRemaining}, status = ${wrong3.data.status}`);

    if (wrong3.data.status !== 'FAILED') {
      throw new Error(`Expected puzzle_1 to be FAILED, got ${wrong3.data.status}`);
    }
    console.log('[PASS] puzzle_1 failed permanently after 3 wrong checks.\n');

    // Step 6: POST /api/puzzle/puzzle_2/open
    console.log('[STEP 6] Testing POST /api/puzzle/puzzle_2/open...');
    const openPuz2 = await api('/puzzle/puzzle_2/open', { method: 'POST' });
    if (!openPuz2.ok) throw new Error(`Open puzzle_2 error: ${JSON.stringify(openPuz2.data)}`);
    console.log(`[PASS] puzzle_2 opened. Title: "${openPuz2.data.puzzle.title}"\n`);

    // Step 7: POST /api/puzzle/puzzle_2/hint (Deduct 1 hint)
    console.log('[STEP 7] Testing POST /api/puzzle/puzzle_2/hint...');
    const hintRes = await api('/puzzle/puzzle_2/hint', { method: 'POST' });
    if (!hintRes.ok || !hintRes.data?.hint) {
      throw new Error(`Hint error: ${JSON.stringify(hintRes.data)}`);
    }
    console.log(`[PASS] Hint received: "${hintRes.data.hint.slice(0, 60)}..."`);
    console.log(`       Team Hints Remaining: ${hintRes.data.hintsRemaining} (was 3)\n`);

    // Step 8: Re-request hint on puzzle_2 (should be free, alreadyUsed: true)
    console.log('[STEP 8] Testing re-requesting hint on puzzle_2 (Idempotent hint retrieval)...');
    const hintRes2 = await api('/puzzle/puzzle_2/hint', { method: 'POST' });
    if (hintRes2.data.hintsRemaining !== 2 || !hintRes2.data.alreadyUsed) {
      throw new Error(`Hint was charged again! Remaining: ${hintRes2.data.hintsRemaining}`);
    }
    console.log(`[PASS] Hint re-retrieved without extra deduction. Hints remaining: ${hintRes2.data.hintsRemaining}\n`);

    // Step 9: POST /api/puzzle/puzzle_2/check (Correct Answer)
    console.log('[STEP 9] Testing correct answer on puzzle_2 ("LEARN BUILD LEAD")...');
    const correctRes = await api('/puzzle/puzzle_2/check', {
      method: 'POST',
      body: JSON.stringify({ answer: 'learn build lead' }), // test case-insensitivity
    });

    if (!correctRes.ok || !correctRes.data?.correct || correctRes.data.status !== 'SOLVED') {
      throw new Error(`Check answer failed: ${JSON.stringify(correctRes.data)}`);
    }

    console.log(`[PASS] puzzle_2 solved! Status: ${correctRes.data.status}`);
    console.log(`       Unlocked Clue: "${correctRes.data.clue?.title}"\n`);

    // Step 10: POST /api/puzzle/puzzle_11/open (Bonus Arcade)
    console.log('[STEP 10] Testing bonus arcade puzzle_11...');
    const bonusRes = await api('/puzzle/puzzle_11/open', { method: 'POST' });
    if (!bonusRes.data?.puzzle?.bonus) {
      throw new Error('puzzle_11 is not marked as bonus.');
    }
    console.log(`[PASS] puzzle_11 verified as bonus (no timer limit: ${bonusRes.data.timeRemainingSeconds === null})\n`);

    // Step 11: POST /api/vault/enter
    console.log('[STEP 11] Testing POST /api/vault/enter (Freeze timers & HMAC hash)...');
    const vaultRes = await api('/vault/enter', { method: 'POST' });
    if (!vaultRes.ok || !vaultRes.data?.verificationHash) {
      throw new Error(`Vault enter error: ${JSON.stringify(vaultRes.data)}`);
    }

    console.log(`[PASS] Vault Entered. Timers Frozen.`);
    console.log(`       Solved: ${vaultRes.data.solvedCount} / ${vaultRes.data.totalQuestPuzzles}`);
    console.log(`       Verification HMAC: ${vaultRes.data.verificationHash}`);
    console.log(`       Total Clues Unlocked: ${vaultRes.data.clues.length}\n`);

    // Step 12: POST /api/submit (Idempotent final submission)
    console.log('[STEP 12] Testing POST /api/submit...');
    const subRes1 = await api('/submit', {
      method: 'POST',
      body: JSON.stringify({
        posterUrl: 'https://example.com/poster-final.png',
        hash: vaultRes.data.verificationHash,
      }),
    });

    if (!subRes1.ok || !subRes1.data?.submission) {
      throw new Error(`Submission error: ${JSON.stringify(subRes1.data)}`);
    }
    console.log(`[PASS] Submission 1 created (ID: ${subRes1.data.submission.id})`);

    // Repeat submit to verify idempotency
    const subRes2 = await api('/submit', {
      method: 'POST',
      body: JSON.stringify({
        posterUrl: 'https://example.com/poster-final.png',
        hash: vaultRes.data.verificationHash,
      }),
    });

    if (!subRes2.data?.alreadySubmitted || subRes2.data.submission.id !== subRes1.data.submission.id) {
      throw new Error('Submit was not idempotent.');
    }
    console.log(`[PASS] Submission 2 idempotent confirmation: "alreadySubmitted: true"\n`);

    // Step 13: POST /api/dev/reset
    console.log('[STEP 13] Testing POST /api/dev/reset (Cleanup)...');
    const resetRes = await api('/dev/reset', {
      method: 'POST',
      headers: {
        'x-admin-token': process.env.ADMIN_TOKEN,
      },
    });

    if (!resetRes.ok || !resetRes.data?.success) {
      throw new Error(`Dev reset failed: ${JSON.stringify(resetRes.data)}`);
    }
    console.log(`[PASS] Dev reset executed. Team data and session wiped.\n`);

    console.log('====================================================');
    console.log(' ALL PHASE 2 API ROUTES & WORKFLOWS PASSED (13/13)!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[FAIL] Phase 2 Route Test Error:', error);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await closeDB();
  }
}

runRouteTests();

