/**
 * Verification Test for ADDENDUM:
 * 1. Task solved -> clue card (label, clue, tip) appears directly below puzzle area.
 * 2. Sticky bar shows "Solved. Clue unlocked below." and inputs disabled.
 * 3. Reopening solved task from grid shows same clue and tip, stage locked.
 * 4. Failed task shows no clue and no tip, only failed message.
 * 5. Grid tile opens normally, and clue pouch slot shows same clue and tip in modal.
 * 6. Vault shows the same clue and tip wording.
 */

import { startServer } from '../server/index.js';
import { closeDB } from '../server/db/connection.js';

let passed = 0;
let total = 0;

function assert(desc, condition) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

// Lightweight DOM mock for Node environment
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.id = '';
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c) => {
        if (this.classList._classes.has(c)) {
          this.classList._classes.delete(c);
          return false;
        } else {
          this.classList._classes.add(c);
          return true;
        }
      }
    };
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
    this.disabled = false;
    this.style = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    this._parseChildren(val);
  }

  get textContent() {
    return this._innerHTML.replace(/<[^>]*>/g, '').trim();
  }

  set textContent(val) {
    this._innerHTML = val;
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === 'id') this.id = v;
    if (k === 'class') {
      this.className = v;
      v.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
    if (k === 'disabled') this.disabled = true;
  }

  getAttribute(k) {
    return this.attributes.get(k) || null;
  }

  removeAttribute(k) {
    this.attributes.delete(k);
    if (k === 'disabled') this.disabled = false;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  addEventListener() {}
  removeEventListener() {}
  scrollIntoView() {}
  focus() {}
  select() {}

  querySelector(sel) {
    return this._query(sel, false);
  }

  querySelectorAll(sel) {
    const results = [];
    this._query(sel, true, results);
    return results;
  }

  get nextElementSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.children;
    const idx = siblings.indexOf(this);
    return idx !== -1 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  }

  closest(sel) {
    let cur = this;
    while (cur) {
      if (cur._matches(sel)) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  _matches(sel) {
    if (sel.startsWith('#')) return this.id === sel.slice(1);
    if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
    if (sel.includes('[')) {
      const match = sel.match(/\[([a-zA-Z0-9_-]+)(?:=["']?(.*?)["']?)?\]/);
      if (match) {
        const [, attr, val] = match;
        return val !== undefined ? this.getAttribute(attr) === val : this.attributes.has(attr);
      }
    }
    return this.tagName.toLowerCase() === sel.toLowerCase();
  }

  _query(sel, multi = false, results = []) {
    for (const child of this.children) {
      if (child._matches(sel)) {
        if (!multi) return child;
        results.push(child);
      }
      const found = child._query(sel, multi, results);
      if (!multi && found) return found;
    }
    return multi ? results : null;
  }

  _parseChildren(html) {
    this.children = [];
    const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'circle', 'line', 'rect', 'path']);
    const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>(?:([\s\S]*?)<\/\1>)?/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1];
      const attrStr = match[2] || '';
      const isVoid = VOID_TAGS.has(tag.toLowerCase()) || attrStr.endsWith('/');
      const inner = isVoid ? '' : (match[3] || '');
      const el = new MockElement(tag);

      const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(attrStr)) !== null) {
        const k = aMatch[1];
        const v = aMatch[2] !== undefined ? aMatch[2] : (aMatch[3] !== undefined ? aMatch[3] : (aMatch[4] !== undefined ? aMatch[4] : ''));
        el.setAttribute(k, v);
      }

      if (inner) {
        el.innerHTML = inner;
      }
      this.appendChild(el);
    }
  }
}

// Setup global document & window mocks before imports
const mockBody = new MockElement('body');
mockBody.innerHTML = `
  <div id="nav-team-name"></div>
  <div id="nav-hud-timer"></div>
  <div id="nav-hints-pips"></div>
  <div id="nav-avatar-circle"></div>
  <div id="nav-brand-text"></div>
  <div id="nav-link-grid"></div>
  <div id="nav-link-rules"></div>
  <div id="nav-link-vault"></div>
  <div id="notice-banner-root"></div>
  <div id="app-content"></div>
  <div id="modal-root"></div>
`;

globalThis.document = {
  readyState: 'complete',
  body: mockBody,
  createElement: (tag) => new MockElement(tag),
  getElementById: (id) => globalThis.document.body.querySelector(`#${id}`),
  querySelector: (sel) => globalThis.document.body.querySelector(sel),
  querySelectorAll: (sel) => globalThis.document.body.querySelectorAll(sel),
  addEventListener: () => {},
  removeEventListener: () => {}
};

globalThis.window = {
  location: { hostname: 'localhost', origin: 'http://localhost:3001', hash: '#/grid' },
  matchMedia: () => ({ matches: false }),
  scrollTo: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  isSecureContext: false
};

const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
};

globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Now dynamically import modules that require browser globals
const { GameState } = await import('../js/state.js');
const { Screens } = await import('../js/screens.js');
const { Modal } = await import('../js/modal.js');

async function runClueAndTipSuite() {
  console.log('========================================================');
  console.log(' Future Quest 2026 - Clue & Tip Across Screens Test Suite');
  console.log('========================================================\n');

  const serverInstance = await startServer();

  try {
    const mockRouter = {
      navigate: (path) => { mockRouter.currentPath = path; },
      currentPath: '/'
    };

    // --- STEP 1: Register Team & Open Task 1 ---
    console.log('--- 1. Register Team & Open Task 1 ---');
    const teamName = `ClueTestTeam_${Date.now()}`;
    await GameState.initSession(teamName, 'Test School');
    assert('Session initialized', GameState.hasSession());

    await GameState.openPuzzle('puzzle_1');
    assert('Task 1 is OPENED', GameState.state.blocks.puzzle_1.status === 'OPENED');

    // --- STEP 2: Solve Task 1 & Verify Clue Object ---
    console.log('\n--- 2. Solve Task 1 & Check Clue Object ---');
    const solveRes = await GameState.submitAnswer('puzzle_1', {
      answer: 'Tomorrow starts with the code you write today'
    });
    assert('Task 1 solve succeeded', solveRes.correct === true);
    assert('Task 1 state status is SOLVED', GameState.state.blocks.puzzle_1.status === 'SOLVED');

    const clue = GameState.state.blocks.puzzle_1.unlockedClue;
    assert('Unlocked clue returned from server', !!clue);
    assert('Clue contains answerText matching "tomorrow start with the code"', clue.answerText && clue.answerText.toLowerCase().includes('tomorrow start with the code'));
    assert('Clue contains textSize: 32', String(clue.textSize) === '32');
    assert('Clue contains placementTip with "Center, directly below FUTURE"', clue.placementTip && clue.placementTip.includes('Center, directly below FUTURE'));

    // --- STEP 3: Render Task 1 Screen & Verify Instant Reveal ---
    console.log('\n--- 3. Render Task 1 Screen & Verify Instant Reveal (Requirement 1, 2, 3) ---');
    const taskContainer = new MockElement('div');
    document.body.appendChild(taskContainer);

    Screens.renderPuzzle(taskContainer, mockRouter, 'puzzle_1');

    const stageEl = taskContainer.querySelector('#puzzle-stage');
    const clueContainerEl = taskContainer.querySelector('#puzzle-clue-container');
    const solvedIndicator = taskContainer.querySelector('#action-solved-state-indicator');

    assert('Puzzle stage exists', !!stageEl);
    assert('Clue container exists', !!clueContainerEl);
    assert('Clue container is directly below puzzle stage', stageEl.nextElementSibling === clueContainerEl);
    assert('Clue container is visible', clueContainerEl.classList.contains('clue-visible'));

    // Check Clue Card content
    const clueHtml = clueContainerEl.innerHTML;
    assert('Clue card has label: TASK 01 SOLVED', clueHtml.includes('TASK 01 SOLVED'));
    assert('Clue card has TEXT SIZE: 32 badge', clueHtml.includes('TEXT SIZE: 32'));
    assert('Clue card has answer text: Tomorrow start with the code', clueHtml.toLowerCase().includes('tomorrow start with the code'));
    assert('Clue card has WHERE TO USE IT banner', clueHtml.includes('WHERE TO USE IT'));
    assert('Clue card has placement tip: Center, directly below FUTURE', clueHtml.includes('Center, directly below FUTURE'));

    // Check sticky action bar
    assert('Sticky bar displays "Solved. Clue unlocked below."', !!solvedIndicator && solvedIndicator.innerHTML.includes('Solved. Clue unlocked below.'));
    const checkBtnMain = taskContainer.querySelector('#btn-check-main');
    assert('Check Answer button is replaced by success indicator', !checkBtnMain);

    // Check inputs disabled
    assert('Puzzle stage has locked class', stageEl.classList.contains('puzzle-stage-solved-locked'));

    // --- STEP 4: Simulate Page Reload & Reopen Task 1 (Requirement 4) ---
    console.log('\n--- 4. Reload & Reopen Task 1 (Requirement 4) ---');
    const reloadContainer = new MockElement('div');
    document.body.appendChild(reloadContainer);

    Screens.renderPuzzle(reloadContainer, mockRouter, 'puzzle_1');

    const reloadedStage = reloadContainer.querySelector('#puzzle-stage');
    const reloadedClue = reloadContainer.querySelector('#puzzle-clue-container');
    const reloadedSolvedIndicator = reloadContainer.querySelector('#action-solved-state-indicator');

    assert('Reloaded stage is locked', reloadedStage.classList.contains('puzzle-stage-solved-locked'));
    assert('Reloaded clue container is visible directly below stage', reloadedStage.nextElementSibling === reloadedClue);
    assert('Reloaded clue has same answer text', reloadedClue.innerHTML.toLowerCase().includes('tomorrow start with the code'));
    assert('Reloaded clue has same placement tip', reloadedClue.innerHTML.includes('Center, directly below FUTURE'));
    assert('Reloaded sticky bar shows "Solved. Clue unlocked below."', !!reloadedSolvedIndicator && reloadedSolvedIndicator.innerHTML.includes('Solved. Clue unlocked below.'));

    // --- STEP 5: Failed Task Shows No Clue and No Tip (Requirement 5) ---
    console.log('\n--- 5. Failed Task Shows No Clue & No Tip (Requirement 5) ---');
    GameState.state.blocks['puzzle_2'] = {
      status: 'FAILED',
      attemptsUsed: 1,
      hintUsed: false
    };
    const failedContainer = new MockElement('div');
    document.body.appendChild(failedContainer);

    Screens.renderPuzzle(failedContainer, mockRouter, 'puzzle_2');
    const failedClueContainer = failedContainer.querySelector('#puzzle-clue-container');
    assert('Failed task clue container is empty', failedClueContainer.innerHTML === '');
    assert('Failed task does NOT contain placement tip', !failedContainer.innerHTML.includes('WHERE TO USE IT'));
    const statusBanner = failedContainer.querySelector('#puzzle-status-banner');
    assert('Failed task shows failed message in banner', statusBanner.innerHTML.includes('Puzzle Failed'));

    // --- STEP 6: Clue Pouch Slot Shows Same Clue & Tip in Modal (Requirement 6) ---
    console.log('\n--- 6. Clue Pouch Slot Shows Same Clue & Tip (Requirement 6 & 7) ---');
    const gridContainer = new MockElement('div');
    document.body.appendChild(gridContainer);
    Screens.renderGrid(gridContainer, mockRouter);

    // Call unified renderClueCardHtml directly to test pouch context output
    const pouchClueHtml = Screens.renderClueCardHtml(clue, 1, { context: 'pouch', puzzleId: 'puzzle_1' });
    assert('Pouch clue HTML contains TASK 01 SOLVED', pouchClueHtml.includes('TASK 01 SOLVED'));
    assert('Pouch clue HTML contains "Tomorrow start with the code"', pouchClueHtml.toLowerCase().includes('tomorrow start with the code'));
    assert('Pouch clue HTML contains "Center, directly below FUTURE"', pouchClueHtml.includes('Center, directly below FUTURE'));
    assert('Pouch clue HTML contains "TEXT SIZE: 32"', pouchClueHtml.includes('TEXT SIZE: 32'));

    // Show modal and verify modal content
    Modal.showClueModal('Task 01: ' + clue.title, pouchClueHtml, () => {});
    const modalRoot = Modal.modalRoot;
    assert('Modal root contains clue card', modalRoot.innerHTML.toLowerCase().includes('tomorrow start with the code'));
    assert('Modal root contains placement tip: Center, directly below FUTURE', modalRoot.innerHTML.includes('Center, directly below FUTURE'));
    Modal.close();

    // --- STEP 7: Vault Screen Displays Identical Clue & Tip (Requirement 7) ---
    console.log('\n--- 7. Vault Displays Identical Clue & Tip (Requirement 7) ---');
    await GameState.enterVault();
    const vaultContainer = new MockElement('div');
    document.body.appendChild(vaultContainer);

    Screens.renderVault(vaultContainer, mockRouter);
    const vaultHtml = vaultContainer.innerHTML;
    assert('Vault displays Task 1 clue', vaultHtml.includes('TASK 01 SOLVED'));
    assert('Vault displays exact answer text: "Tomorrow start with the code"', vaultHtml.toLowerCase().includes('tomorrow start with the code'));
    assert('Vault displays exact placement tip: "Center, directly below FUTURE"', vaultHtml.includes('Center, directly below FUTURE'));
    assert('Vault displays exact text size: 32', vaultHtml.includes('TEXT SIZE: 32'));

    console.log('\n========================================================');
    console.log(`ALL CLUE & TIP VERIFICATION TESTS PASSED (${passed}/${total})!`);
    console.log('========================================================\n');
    process.exit(0);
  } finally {
    if (serverInstance && serverInstance.close) {
      serverInstance.close();
    }
    await closeDB();
  }
}

runClueAndTipSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
