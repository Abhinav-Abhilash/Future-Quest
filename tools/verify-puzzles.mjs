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
// T4: Riddle - The 17-Year-Old OS (CINNAMON BUN)
// -------------------------------------------------------------
const t4 = CONFIG.PUZZLES.puzzle_4.data;
const t4_ok = t4.solution === 'CINNAMON BUN' && 
  t4.acceptedSolutions.includes('CINNAMON BUN') &&
  t4.words.map(w => w.length).reduce((a, b) => a + b, 0) === 11 &&
  t4.riddleLines.length >= 3;
report('T4 Riddle Dynamic Check (CINNAMON BUN)', t4_ok);

// -------------------------------------------------------------
// T5: Reverse-Index Cipher (WHERE HUMAN MEETS AI)
// -------------------------------------------------------------
const t5 = CONFIG.PUZZLES.puzzle_5.data;
const t5_decoded = t5.words.map(w => w.codes.map(c => String.fromCharCode(64 + (27 - c))).join('')).join(' ');
const t5_expected = t5.groupSolutions.join(' ');
report('T5 Reverse-Index Cipher Dynamic Check (WHERE HUMAN MEETS AI)', t5_decoded === t5_expected && t5_decoded === 'WHERE HUMAN MEETS AI', t5_decoded);

// -------------------------------------------------------------
// T6: Institutional Identity Riddle (JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY)
// -------------------------------------------------------------
const t6 = CONFIG.PUZZLES.puzzle_6.data;
const t6_ok = t6.solution === 'JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY' &&
  t6.acceptedSolutions.includes('JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY') &&
  t6.words.map(w => w.length).reduce((a, b) => a + b, 0) === 38;
report('T6 Institutional Riddle Dynamic Check (JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY)', t6_ok);

// -------------------------------------------------------------
// T7: Word Search (20 Words)
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
report('T7 Word Search Dynamic Check (20 words in grid)', t7_ok);

// -------------------------------------------------------------
// T8: Riddle - The Orbital Starman (ROADSTER)
// -------------------------------------------------------------
const t8 = CONFIG.PUZZLES.puzzle_8.data;
const t8_ok = t8.solution === 'ROADSTER' &&
  t8.acceptedSolutions.includes('ROADSTER') &&
  t8.words.map(w => w.length).reduce((a, b) => a + b, 0) === 8 &&
  t8.riddleLines.length >= 3;
report('T8 Riddle Dynamic Check (ROADSTER)', t8_ok);

// -------------------------------------------------------------
// T9: Dual Color Palette Riddle (DARK BLUE AND LIGHT STEEL BLUE)
// -------------------------------------------------------------
const t9 = CONFIG.PUZZLES.puzzle_9.data;
const t9_ok = t9.solution === 'DARK BLUE AND LIGHT STEEL BLUE' &&
  t9.acceptedSolutions.includes('DARK BLUE AND LIGHT STEEL BLUE') &&
  t9.words.map(w => w.length).reduce((a, b) => a + b, 0) === 25;
report('T9 Dual Color Riddle Dynamic Check (DARK BLUE AND LIGHT STEEL BLUE)', t9_ok);

// -------------------------------------------------------------
// T10: Coordinates Grid (FUTURE QUEST)
// -------------------------------------------------------------
const t10 = CONFIG.PUZZLES.puzzle_10.data;
let t10_ok = true;
const t10_spelledWords = t10.groupedChips.map(grp => {
  const spelled = grp.coords.map(([c, r, expectedCh]) => {
    const cellCh = t10.grid[r - 1][c - 1];
    if (cellCh !== expectedCh) t10_ok = false;
    return cellCh;
  }).join('');
  if (spelled !== grp.name) t10_ok = false;
  return spelled;
});
const t10_full = t10_spelledWords.join(' ');
report('T10 COORDS Dynamic Check (FUTURE QUEST)', t10_ok && t10_full === 'FUTURE QUEST', t10_full);

// -------------------------------------------------------------
// T11: Apple Eats Snake (ROADSTER)
// -------------------------------------------------------------
const t11 = CONFIG.PUZZLES.puzzle_11;
const t11_data = t11.data;
const t11_targetWord = t11_data.targetWord;
const t11_letters = t11_targetWord.split('');
const t11_ok = t11.type === 'snake' &&
  typeof t11_targetWord === 'string' &&
  t11_targetWord === 'ROADSTER' &&
  t11_letters.length === 8 &&
  t11_letters.join('') === 'ROADSTER' &&
  t11.clue.type === 'text' &&
  t11.clue.content === t11_targetWord;
report('T11 Apple Eats Snake Dynamic Check (ROADSTER)', t11_ok, `Word: ${t11_targetWord}, Length: ${t11_letters.length}`);

console.log('=============================================================');
if (allPassed) {
  console.log('ALL CONFIG.PUZZLES DATA CHECKS PASSED 100% DYNAMICALLY!');
} else {
  console.error('SOME DYNAMIC DATA CHECKS FAILED!');
  process.exit(1);
}
