// /* DEV-ONLY */ Apple Eats Snake (Bonus Mini-Game) Verification & Integration Test

import { CONFIG } from '../js/config.js';
import { GameState } from '../js/state.js';
import { PUZZLE_REGISTRY } from '../js/puzzles/index.js';
import * as snakeModule from '../js/puzzles/snake.js';
import { PUZZLES as SERVER_PUZZLES } from '../server/puzzles/definitions.js';

console.log('=== TESTING APPLE EATS SNAKE BONUS MINI-GAME ===');

let passCount = 0;
function assert(name, condition) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${name}`);
    process.exit(1);
  }
}

// 1. Module Exports
assert('snakeModule exports mount', typeof snakeModule.mount === 'function');
assert('snakeModule exports unmount', typeof snakeModule.unmount === 'function');
assert('snakeModule exports checkAnswer', typeof snakeModule.checkAnswer === 'function');
assert('PUZZLE_REGISTRY.snake is registered', PUZZLE_REGISTRY.snake === snakeModule);

// 2. Bonus Config Verification
const p11 = CONFIG.PUZZLES.puzzle_11;
assert('puzzle_11 type is snake', p11.type === 'snake');
assert('puzzle_11 bonus is true', p11.bonus === true);
assert('puzzle_11 targetWord is CHOMP', p11.data.targetWord === 'CHOMP');
assert('puzzle_11 has no clue', !p11.clue && !p11.clueType);
assert('puzzle_11 has no hint', !p11.hint);
assert('puzzle_11 is not in CONFIG.TILE_DIFFICULTY', !CONFIG.TILE_DIFFICULTY);
assert('puzzle_11 is not in CONFIG.MOCK_ANSWERS', !CONFIG.MOCK_ANSWERS);

// Quest difficulty split on server: 10 items (exclude bonus)
const diffCounts = { easy: 0, medium: 0, hard: 0 };
let questTotal = 0;
Object.values(SERVER_PUZZLES).forEach(p => {
  if (!p.bonus) {
    questTotal++;
    diffCounts[p.difficulty]++;
  }
});
assert('Quest difficulty split has 10 total', questTotal === 10);
assert('Difficulty split has easy, medium, and hard', diffCounts.easy > 0 && diffCounts.medium > 0 && diffCounts.hard > 0);

// 3. Mock DOM environment for mounting
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.innerHTML = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) { this.classList._classes.delete(c); return false; }
          else { this.classList._classes.add(c); return true; }
        } else if (force) {
          this.classList._classes.add(c); return true;
        } else {
          this.classList._classes.delete(c); return false;
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.attributes = {};
    this.listeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  removeEventListener(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(f => f !== fn);
    }
  }
  querySelector(sel) {
    const el = new MockElement();
    if (sel === '#snake-canvas') {
      el.getContext = () => ({
        clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {},
        moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {},
        arc() {}, ellipse() {}, strokeRoundRect() {}, roundRect() {},
        fillText() {}, save() {}, restore() {}
      });
    }
    return el;
  }
  querySelectorAll(sel) {
    return [new MockElement(), new MockElement(), new MockElement(), new MockElement()];
  }
}

const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; }
};

global.window = {
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => ({ matches: false })
};
global.document = {
  body: new MockElement('body'),
  addEventListener() {},
  removeEventListener() {},
  createElement: (tag) => new MockElement(tag)
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const root = new MockElement('div');
let solvedCalled = false;
let wrongCheckCalled = 0;
let savedState = null;

const mockCtx = {
  isLocked: () => false,
  getProgress: () => savedState,
  saveProgress: (p) => { savedState = p; },
  onSolved: () => { solvedCalled = true; },
  onWrongCheck: () => { wrongCheckCalled++; }
};

// Mount in regular mode
snakeModule.mount(root, p11.data, mockCtx);
assert('Mount executed and populated innerHTML', root.innerHTML.includes('snake-canvas'));
assert('Root innerHTML contains TARGET WORD: CHOMP', root.innerHTML.includes('CHOMP'));
assert('Root innerHTML contains D-pad', root.innerHTML.includes('snake-dpad'));
assert('Root innerHTML contains start banner', root.innerHTML.includes('snake-start-banner'));
assert('Root innerHTML contains New Snake button', root.innerHTML.includes('New Snake'));

// Test checkAnswer export
snakeModule.checkAnswer();
assert('checkAnswer executes cleanly', true);

// Unmount cleanly
snakeModule.unmount();
assert('Unmount executes without throwing', true);

// 4. Lite-mode / reduced-motion test
global.document.body.classList.add('lite-mode');
snakeModule.mount(root, p11.data, mockCtx);
assert('Mounts cleanly with lite-mode class', true);
snakeModule.unmount();
global.document.body.classList.remove('lite-mode');

import { Api } from '../js/api.js';

// 5. State Bonus Exclusions Tests
async function runStateTests() {
  // Mock Api methods for standalone unit test
  let mockState = {
    teamName: 'Test Team',
    schoolName: 'Test School',
    timerStartedAt: Date.now(),
    timerLockedAt: null,
    vaultEntered: false,
    hintsRemaining: 3,
    gridOrder: ['puzzle_1', 'puzzle_2', 'puzzle_3', 'puzzle_4', 'puzzle_5', 'puzzle_6', 'puzzle_7', 'puzzle_8', 'puzzle_9', 'puzzle_10', 'puzzle_11', 'vault_12'],
    activeBlock: null,
    blocks: {}
  };
  for (let i = 1; i <= 11; i++) {
    mockState.blocks[`puzzle_${i}`] = { status: 'UNOPENED', attemptsUsed: 0, hintUsed: false, timeSpentMs: 0, activeSince: null, unlockedClue: null };
  }

  Api.register = async () => ({ team: { teamName: 'Test Team' } });
  Api.getState = async () => ({
    team: {
      teamName: 'Test Team',
      schoolName: 'Test School',
      hintsLeft: 3,
      timerStartedAt: Date.now(),
      timerLockedAt: null,
      isVaultLocked: false,
    },
    tiles: Array.from({ length: 11 }, (_, i) => ({
      tileNumber: i + 1,
      puzzleId: `puzzle_${i + 1}`,
      status: 'AVAILABLE',
      attemptsUsed: 0,
      hintUsed: false,
      unlockedClue: null,
      timeLimitSeconds: null,
      timeRemainingSeconds: null,
    })),
  });
  Api.openPuzzle = async (id) => ({
    puzzle: {
      id,
      status: id === 'puzzle_11' ? 'AVAILABLE' : 'OPENED',
      attemptsUsed: 0,
      timeLimitSeconds: 600,
      timeRemainingSeconds: 600,
    }
  });
  Api.useHint = async (id) => {
    if (id === 'puzzle_11') return { error: 'Bonus puzzle does not allow hints' };
    mockState.hintsRemaining--;
    return { hint: 'Test hint' };
  };

  await GameState.initSession('Test Team', 'Test School');
  assert('Initial contest summary total is 10', GameState.getSummary().total === 10);
  assert('Initial contest summary solved is 0', GameState.getSummary().solved === 0);

  // Open bonus puzzle
  await GameState.openPuzzle('puzzle_11');
  assert('puzzle_11 timer remaining is 0', GameState.getPuzzleRemainingSeconds('puzzle_11') === 0);
  assert('puzzle_11 does not set activeBlock in state', GameState.state.activeBlock === null);
  assert('puzzle_11 status remains AVAILABLE', GameState.state.blocks.puzzle_11.status === 'AVAILABLE');

  // Bonus puzzle ignores hint usage
  const hintRes = await GameState.useHint('puzzle_11');
  assert('GameState.useHint returns false for puzzle_11', hintRes === false);
  assert('GameState.state.hintsRemaining remains 3', GameState.state.hintsRemaining === 3);

  // Bonus puzzle ignores failPuzzle & markSolved
  GameState.failPuzzle('puzzle_11');
  assert('puzzle_11 status is NOT changed to FAILED by failPuzzle', GameState.state.blocks.puzzle_11.status === 'AVAILABLE');

  GameState.markSolved('puzzle_11');
  assert('puzzle_11 status is NOT changed to SOLVED by markSolved', GameState.state.blocks.puzzle_11.status === 'AVAILABLE');

  // Summary remains 0 / 10
  const summaryAfterBonus = GameState.getSummary();
  assert('Summary total remains 10', summaryAfterBonus.total === 10);
  assert('Summary solved remains 0', summaryAfterBonus.solved === 0);

  // Solve a real quest puzzle (puzzle_1) and verify summary is 1 / 10
  await GameState.openPuzzle('puzzle_1');
  GameState.markSolved('puzzle_1');
  const summaryAfterQ1 = GameState.getSummary();
  assert('Summary total remains 10 after Q1', summaryAfterQ1.total === 10);
  assert('Summary solved is 1 after Q1', summaryAfterQ1.solved === 1);

  console.log(`ALL APPLE EATS SNAKE BONUS TESTS PASSED (${passCount}/${passCount})!`);
}

runStateTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
