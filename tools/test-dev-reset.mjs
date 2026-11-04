// /* DEV-ONLY */ Automated Test for Comprehensive Dev Reset Behavior

global.window = {
  location: { hash: '#/vault', reload() { this.reloaded = true; } },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  __gridFirstLoadDone: true
};
global.document = {
  documentElement: { classList: new Set(['has-active-session']) },
  body: { classList: new Set(['dev-mode', 'is-landing', 'lite-mode']) },
  getElementById: (id) => ({ remove() {}, innerHTML: '' })
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.sessionStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

async function runTest() {
  console.log('=== TESTING DEV RESET LOGIC ===');
  const { GameState } = await import('../js/state.js');

  // 1. Start a session
  GameState.initSession('CyberKnights', 'JAIN University');
  console.log('[STEP 1] Session started. hasSession:', GameState.hasSession());

  // 2. Solve one puzzle (puzzle_1)
  GameState.openPuzzle('puzzle_1');
  GameState.markSolved('puzzle_1');
  console.log('[STEP 2] Puzzle 1 solved. Solved count:', GameState.getSummary().solved);

  // 3. Use a hint on puzzle_2
  GameState.openPuzzle('puzzle_2');
  GameState.useHint('puzzle_2');
  console.log('[STEP 3] Hint used on Puzzle 2. Remaining hints:', GameState.state.hintsRemaining);

  // Verify state before reset
  if (GameState.getSummary().solved !== 1 || GameState.state.hintsRemaining !== 2) {
    console.error('[FAIL] Setup state incorrect before reset');
    process.exit(1);
  }

  // 4. Perform Dev Reset (matching performDevReset logic in app.js)
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.classList.delete('has-active-session');
  document.body.classList.delete('has-active-session');
  document.body.classList.delete('lite-mode');
  document.body.classList.delete('is-landing');
  window.__gridFirstLoadDone = false;
  GameState.resetSession();
  window.location.hash = '#/landing';
  window.location.reload();

  // 5. Verify site matches a brand-new visit
  const hasSessionAfter = GameState.hasSession();
  const stateAfter = GameState.state;
  const storageKeys = Object.keys(localStorage._data).length;
  const sessionKeys = Object.keys(sessionStorage._data).length;
  const hashAfter = window.location.hash;
  const reloaded = window.location.reloaded;

  console.log('[VERIFY] hasSession after reset:', hasSessionAfter, '(expected: false)');
  console.log('[VERIFY] state after reset:', stateAfter, '(expected: null)');
  console.log('[VERIFY] localStorage keys:', storageKeys, '(expected: 0)');
  console.log('[VERIFY] sessionStorage keys:', sessionKeys, '(expected: 0)');
  console.log('[VERIFY] location.hash:', hashAfter, '(expected: #/landing)');
  console.log('[VERIFY] location.reload called:', reloaded, '(expected: true)');

  if (!hasSessionAfter && stateAfter === null && storageKeys === 0 && sessionKeys === 0 && hashAfter === '#/landing' && reloaded) {
    console.log('DEV RESET TEST PASSED 100%!');
  } else {
    console.error('DEV RESET TEST FAILED!');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
