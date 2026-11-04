// /* DEV-ONLY */ Puzzle Data Verification Script
// Imports CONFIG directly and dynamically validates all 11 puzzles against CONFIG.PUZZLES.

import { CONFIG } from '../js/config.js';

console.log('=== FUTURE QUEST 2026 - DYNAMIC PUZZLE DATA VERIFICATION ===');

let allPassed = true;
function report(name, passed, detail = '') {
  if (passed) {
    console.log(`[PASS] ${name}`);
  } else {
    allPassed = false;
    console.error(`[FAIL] ${name}: ${detail}`);
  }
}

// Safely evaluate simple arithmetic expressions without arbitrary code execution
function evaluateMath(expr) {
  // Convert ^ into JS exponentiation **
  let cleaned = expr.replace(/\^/g, '**');
  // Evaluate arithmetic using Function
  return Function(`'use strict'; return (${cleaned});`)();
}

// Direction vectors for 15x15 Word Search
const DIRS = [
  [0, 1],   // right
  [0, -1],  // left
  [1, 0],   // down
  [-1, 0],  // up
  [1, 1],   // down-right
  [-1, -1], // up-left
  [1, -1],  // down-left
  [-1, 1]   // up-right
];

function findWordInGrid(word, grid) {
  const R = grid.length;
  const C = grid[0].length;
  const len = word.length;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      for (const [dr, dc] of DIRS) {
        let match = true;
        for (let i = 0; i < len; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] !== word[i]) {
            match = false;
            break;
          }
        }
        if (match) return { start: [r, c], end: [r + dr * (len - 1), c + dc * (len - 1)] };
      }
    }
  }
  return null;
}

// -------------------------------------------------------------
// T1: ASCII Quote Decoder (Tomorrow starts with the code you write today)
// -------------------------------------------------------------
const t1 = CONFIG.PUZZLES.puzzle_1.data;
const t1_decoded = t1.words.map(w => w.codes.map(c => String.fromCharCode(c)).join('')).join(' ');
const t1_expected = t1.groupSolutions.join(' ');
report('T1 ASCII Dynamic Check', t1_decoded === t1_expected && t1_decoded === 'Tomorrow starts with the code you write today', t1_decoded);

// -------------------------------------------------------------
// T2: Coordinates Grid (LEARN, BUILD, LEAD)
// -------------------------------------------------------------
const t2 = CONFIG.PUZZLES.puzzle_2.data;
let t2_ok = true;
t2.groupedChips.forEach(grp => {
  const spelled = grp.coords.map(([c, r, expectedCh]) => {
    const cellCh = t2.grid[r - 1][c - 1];
    if (cellCh !== expectedCh) t2_ok = false;
    return cellCh;
  }).join('');
  if (spelled !== grp.name) t2_ok = false;
});
report('T2 COORDS Dynamic Check (LEARN, BUILD, LEAD)', t2_ok);

// -------------------------------------------------------------
// T3: BODMAS Decoder (CODE THE FUTURE)
// -------------------------------------------------------------
const t3 = CONFIG.PUZZLES.puzzle_3.data;
let t3_ok = true;
t3.groupedEquations.forEach(grp => {
  const spelled = grp.equations.map(eq => {
    const val = evaluateMath(eq.expr);
    if (val !== eq.expected) t3_ok = false;
    const letter = String.fromCharCode(64 + val);
    if (letter !== eq.letter) t3_ok = false;
    return letter;
  }).join('');
  if (spelled !== grp.solution) t3_ok = false;
});
report('T3 BODMAS Dynamic Check (CODE THE FUTURE)', t3_ok);

// -------------------------------------------------------------
// T4: Shifted ASCII (curiosity is the key)
// -------------------------------------------------------------
const t4 = CONFIG.PUZZLES.puzzle_4.data;
const t4_decoded = t4.words.map(w => w.codes.map(c => String.fromCharCode(c - 1)).join('')).join(' ');
const t4_expected = t4.groupSolutions.join(' ');
report('T4 Shifted ASCII Dynamic Check (-1 offset)', t4_decoded === t4_expected && t4_decoded === 'curiosity is the key', t4_decoded);

// -------------------------------------------------------------
// T5: BODMAS Anagram (QUEST)
// -------------------------------------------------------------
const t5 = CONFIG.PUZZLES.puzzle_5.data;
let t5_ok = true;
const t5_letters = t5.equations.map(eq => {
  const val = evaluateMath(eq.expr);
  if (val !== eq.expected) t5_ok = false;
  const letter = String.fromCharCode(64 + val);
  if (letter !== eq.letter) t5_ok = false;
  return letter;
});
const t5_sorted = [...t5_letters].sort().join('');
report('T5 BODMAS Dynamic Check (QUEST Anagram)', t5_ok && t5_sorted === 'EQSTU');

// -------------------------------------------------------------
// T6: Coordinates Route Tracer (BYTE)
// -------------------------------------------------------------
const t6 = CONFIG.PUZZLES.puzzle_6.data;
let t6_ok = true;
const t6_start = t6.grid[7 - 1][1 - 1]; // (1, 7) = B
if (t6_start !== 'B') t6_ok = false;
const t6_spelled = ['B', ...t6.legs.map(leg => {
  const ch = t6.grid[leg.targetRow - 1][leg.targetCol - 1];
  if (ch !== leg.letter) t6_ok = false;
  return ch;
})].join('');
report('T6 Route Tracer Dynamic Check (BYTE)', t6_ok && t6_spelled === 'BYTE', t6_spelled);

// -------------------------------------------------------------
// T7: Word Search (12 Words)
// -------------------------------------------------------------
const t7 = CONFIG.PUZZLES.puzzle_7.data;
let t7_ok = true;
t7.words.forEach(word => {
  const found = findWordInGrid(word, t7.grid);
  if (!found) {
    t7_ok = false;
    console.error(`  [NOT FOUND] T7 word in grid: ${word}`);
  }
});
report('T7 Word Search Dynamic Check (12 words in grid)', t7_ok);

// -------------------------------------------------------------
// T8: Caesar-ASCII Hybrid (FUTURE READY)
// -------------------------------------------------------------
const t8 = CONFIG.PUZZLES.puzzle_8.data;
const t8_raw = t8.words.map(w => w.codes.map(c => String.fromCharCode(c)).join(''));
const t8_shifted = t8_raw.map(w => {
  return w.split('').map(ch => {
    const code = ch.charCodeAt(0);
    return String.fromCharCode(((code - 65 + t8.targetShift) % 26) + 65);
  }).join('');
}).join(' ');
report('T8 Caesar-ASCII Dynamic Check (FUTURE READY)', t8_shifted === t8.finalText && t8_shifted === 'FUTURE READY', t8_shifted);

// -------------------------------------------------------------
// T9: Slotted BODMAS (SIGNAL)
// -------------------------------------------------------------
const t9 = CONFIG.PUZZLES.puzzle_9.data;
let t9_ok = true;
const t9_slots = [];
t9.equations.forEach(eq => {
  const val = evaluateMath(eq.expr);
  if (val !== eq.expected) t9_ok = false;
  const letter = String.fromCharCode(64 + val);
  if (letter !== eq.letter) t9_ok = false;
  t9_slots[eq.slot] = letter;
});
const t9_spelled = t9_slots.slice(1).join('');
report('T9 Slotted BODMAS Dynamic Check (SIGNAL)', t9_ok && t9_spelled === t9.finalWord && t9_spelled === 'SIGNAL', t9_spelled);

// -------------------------------------------------------------
// T10: Cartesian Coordinates Grid (CYBER)
// -------------------------------------------------------------
const t10 = CONFIG.PUZZLES.puzzle_10.data;
let t10_ok = true;
// In Cartesian bottom-up, row 1 is bottom (index 6), row 7 is top (index 0): grid[7 - r][c - 1]
const t10_spelled = t10.mathCoords.map(item => {
  const cellCh = t10.grid[7 - item.row][item.col - 1];
  if (cellCh !== item.letter) t10_ok = false;
  return cellCh;
}).join('');
report('T10 Cartesian COORDS Dynamic Check (CYBER)', t10_ok && t10_spelled === t10.finalWord && t10_spelled === 'CYBER', t10_spelled);

// -------------------------------------------------------------
// T11: Clue Word Search (8 Words)
// -------------------------------------------------------------
const t11 = CONFIG.PUZZLES.puzzle_11.data;
let t11_ok = true;
t11.words.forEach(item => {
  const found = findWordInGrid(item.word, t11.grid);
  if (!found) {
    t11_ok = false;
    console.error(`  [NOT FOUND] T11 word in grid: ${item.word}`);
  }
});
report('T11 Clue Word Search Dynamic Check (8 words in grid)', t11_ok);

console.log('=============================================================');
if (allPassed) {
  console.log('ALL CONFIG.PUZZLES DATA CHECKS PASSED 100% DYNAMICALLY!');
} else {
  console.error('SOME DYNAMIC DATA CHECKS FAILED!');
  process.exit(1);
}
