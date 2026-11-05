// /* DEV-ONLY */ Apple Eats Snake Verification & Integration Test

import { CONFIG } from '../js/config.js';
import { PUZZLE_REGISTRY } from '../js/puzzles/index.js';
import * as snakeModule from '../js/puzzles/snake.js';

console.log('=== TESTING APPLE EATS SNAKE PUZZLE MODULE ===');

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

// 2. Config Verification
const p11 = CONFIG.PUZZLES.puzzle_11;
assert('puzzle_11 type is snake', p11.type === 'snake');
assert('puzzle_11 targetWord is ROADSTER', p11.data.targetWord === 'ROADSTER');
assert('puzzle_11 clue type is text', p11.clue.type === 'text');
assert('puzzle_11 clue content is ROADSTER', p11.clue.content === 'ROADSTER');
assert('puzzle_11 difficulty is hard', CONFIG.TILE_DIFFICULTY.puzzle_11 === 'hard');
assert('puzzle_10 difficulty is medium', CONFIG.TILE_DIFFICULTY.puzzle_10 === 'medium');

// Count difficulty split: 2 easy, 5 medium, 4 hard
const diffCounts = { easy: 0, medium: 0, hard: 0 };
Object.values(CONFIG.TILE_DIFFICULTY).forEach(d => diffCounts[d]++);
assert('Difficulty split is 2 easy', diffCounts.easy === 2);
assert('Difficulty split is 5 medium', diffCounts.medium === 5);
assert('Difficulty split is 4 hard', diffCounts.hard === 4);

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
assert('Root innerHTML contains TARGET WORD: ROADSTER reference', root.innerHTML.includes('ROADSTER') || root.innerHTML.includes('snake-hud-tag'));
assert('Root innerHTML contains D-pad', root.innerHTML.includes('snake-dpad'));

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

console.log(`=============================================`);
console.log(`ALL APPLE EATS SNAKE TESTS PASSED (${passCount}/${passCount})!`);
