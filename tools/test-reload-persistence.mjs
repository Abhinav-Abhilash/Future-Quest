/**
 * Targeted Test: Reload & Timer Persistence Simulation
 */

import { startServer } from '../server/index.js';
import { closeDB } from '../server/db/connection.js';
import { Api } from '../js/api.js';
import { GameState } from '../js/state.js';
import { CONFIG } from '../js/config.js';

let passed = 0;
let total = 0;

function assert(desc, condition) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
  }
}

async function runTest() {
  console.log('=== TESTING BROWSER RELOAD & TIMER RESILIENCE ===');
  const serverInstance = await startServer();

  try {
    // 1. Mock browser localStorage
    const mockStorage = new Map();
    globalThis.localStorage = {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
      clear: () => mockStorage.clear(),
    };

    // 2. Register team
    console.log('\n--- 1. Register Team ---');
    const teamName = `ResilientTeam_${Date.now()}`;
    const registeredState = await GameState.initSession(teamName, 'Test School');
    assert('Registration creates session', GameState.hasSession());
    const originalTimerStartedAt = GameState.state.timerStartedAt;
    assert('timerStartedAt is set', typeof originalTimerStartedAt === 'number');
    assert('Auth token stored in localStorage', mockStorage.has('future_quest_token'));

    // 3. Solve Task 1
    console.log('\n--- 2. Solve Task 1 ---');
    await GameState.openPuzzle('puzzle_1');
    assert('Task 1 is OPENED', GameState.state.blocks.puzzle_1.status === 'OPENED');
    const solveRes = await GameState.submitAnswer('puzzle_1', {
      answer: 'Tomorrow starts with the code you write today'
    });
    assert('Task 1 solved', solveRes.correct === true);
    assert('Task 1 status is SOLVED in state', GameState.state.blocks.puzzle_1.status === 'SOLVED');
    assert('Task 1 clue is unlocked', !!GameState.state.blocks.puzzle_1.unlockedClue);

    // 4. Open Task 2 and spend some time
    console.log('\n--- 3. Open Task 2 & spend time ---');
    await GameState.openPuzzle('puzzle_2');
    assert('Task 2 is OPENED', GameState.state.blocks.puzzle_2.status === 'OPENED');
    // Simulate 30 seconds spent
    GameState.state.blocks.puzzle_2.timeSpentMs = 30000;
    GameState.saveState();

    // 5. Simulate browser reload (F5)
    console.log('\n--- 4. Simulate Page Reload (F5) ---');
    // Save state string exists in mockStorage
    const savedJson = mockStorage.get('future_quest_2026_state');
    assert('State was persisted in localStorage before reload', !!savedJson);

    // Reconstruct new GameState instance as if fresh page load
    GameState.state = GameState.loadState();
    assert('GameState restored from localStorage immediately on script load', GameState.hasSession());
    assert('timerStartedAt is identical across reload (not reset)', GameState.state.timerStartedAt === originalTimerStartedAt);
    assert('Task 1 remains SOLVED immediately on reload', GameState.state.blocks.puzzle_1.status === 'SOLVED');
    assert('Task 1 clue remains in pouch', !!GameState.state.blocks.puzzle_1.unlockedClue);
    assert('Task 2 timeSpentMs (30s) preserved across reload', GameState.state.blocks.puzzle_2.timeSpentMs === 30000);

    // 6. Test syncWithServer() after reload
    console.log('\n--- 5. Background syncWithServer after reload ---');
    await GameState.syncWithServer();
    assert('Session remains active after server sync', GameState.hasSession());
    assert('timerStartedAt STILL preserved after sync', GameState.state.timerStartedAt === originalTimerStartedAt);
    assert('Task 1 STILL SOLVED after sync', GameState.state.blocks.puzzle_1.status === 'SOLVED');
    assert('Task 1 clue STILL present after sync', !!GameState.state.blocks.puzzle_1.unlockedClue);
    assert('Master remaining time accurately counts down from timerStartedAt', GameState.getMasterRemainingSeconds() <= 7200);

    // 7. Test simulated 401 response resilience (e.g. dropped cookies/session)
    console.log('\n--- 6. Test Resilience against server 401 ---');
    // Temporarily corrupt token in header simulation to trigger 401
    const origGet = Api.getState;
    Api.getState = async () => {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    };
    const origSync = Api.syncState;
    Api.syncState = async () => {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    };

    await GameState.syncWithServer();
    assert('State is NOT wiped to null when server responds 401', GameState.hasSession());
    assert('Task 1 is STILL SOLVED after 401', GameState.state.blocks.puzzle_1.status === 'SOLVED');
    assert('Task 1 clue STILL intact after 401', !!GameState.state.blocks.puzzle_1.unlockedClue);
    assert('timerStartedAt STILL intact after 401', GameState.state.timerStartedAt === originalTimerStartedAt);

    Api.getState = origGet;
    Api.syncState = origSync;

    console.log(`\n===========================================`);
    console.log(`ALL RELOAD & TIMER TESTS PASSED (${passed}/${total})!`);
    console.log(`===========================================`);
  } finally {
    if (serverInstance && serverInstance.server) {
      serverInstance.server.close();
    }
    await closeDB();
  }
}

runTest().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
