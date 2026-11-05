// /* DEV-ONLY */ Puzzle Data Verification Script
// Validates all 10 puzzles against the server-side source of truth (server/puzzles/definitions.js).

import { PUZZLES, checkPuzzleAnswer } from '../server/puzzles/definitions.js';

console.log('=== FUTURE QUEST 2026 - SERVER PUZZLE DATA & ANSWER VERIFICATION ===');

let allPassed = true;
function report(name, passed, detail = '') {
  if (passed) {
    console.log(`[PASS] ${name}`);
  } else {
    allPassed = false;
    console.error(`[FAIL] ${name}: ${detail}`);
  }
}

// Safely evaluate simple arithmetic expressions
function evaluateMath(expr) {
  let cleaned = expr.replace(/\^/g, '**');
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
const t1 = PUZZLES.puzzle_1;
const t1_decoded = t1.clientData.words.map(w => w.codes.map(c => String.fromCharCode(c)).join('')).join(' ');
const t1_ok = checkPuzzleAnswer('puzzle_1', t1_decoded) && t1_decoded === 'Tomorrow starts with the code you write today';
report('T1 ASCII Dynamic Check (Tomorrow starts with the code you write today)', t1_ok, t1_decoded);

// -------------------------------------------------------------
// T2: Coordinates Grid (LEARN, BUILD, LEAD)
// -------------------------------------------------------------
const t2 = PUZZLES.puzzle_2;
let t2_ok = true;
const t2_words = t2.clientData.groupedChips.map(grp => {
  return grp.coords.map(([c, r]) => t2.clientData.grid[r - 1][c - 1]).join('');
}).join(' ');
t2_ok = checkPuzzleAnswer('puzzle_2', t2_words) && t2_words === 'LEARN BUILD LEAD';
report('T2 COORDS Dynamic Check (LEARN BUILD LEAD)', t2_ok, t2_words);

// -------------------------------------------------------------
// T3: BODMAS Decoder (CODE THE FUTURE)
// -------------------------------------------------------------
const t3 = PUZZLES.puzzle_3;
const t3_words = t3.clientData.groupedEquations.map(grp => {
  return grp.equations.map(eq => {
    const val = evaluateMath(eq.expr);
    return String.fromCharCode(64 + val);
  }).join('');
}).join(' ');
const t3_ok = checkPuzzleAnswer('puzzle_3', t3_words) && t3_words === 'CODE THE FUTURE';
report('T3 BODMAS Dynamic Check (CODE THE FUTURE)', t3_ok, t3_words);

// -------------------------------------------------------------
// T4: Riddle - The 17-Year-Old OS (CINNAMON BUN)
// -------------------------------------------------------------
const t4 = PUZZLES.puzzle_4;
const t4_ok = checkPuzzleAnswer('puzzle_4', 'CINNAMON BUN') && 
  checkPuzzleAnswer('puzzle_4', 'cinnamon roll') &&
  t4.difficulty === 'medium' &&
  t4.timeLimit === 900;
report('T4 Riddle Dynamic Check (CINNAMON BUN)', t4_ok);

// -------------------------------------------------------------
// T5: Reverse-Index Cipher (WHERE HUMAN MEETS AI)
// -------------------------------------------------------------
const t5 = PUZZLES.puzzle_5;
const t5_decoded = t5.clientData.words.map(w => w.codes.map(c => String.fromCharCode(64 + (27 - c))).join('')).join(' ');
const t5_ok = checkPuzzleAnswer('puzzle_5', t5_decoded) && t5_decoded === 'WHERE HUMAN MEETS AI';
report('T5 Reverse-Index Cipher Dynamic Check (WHERE HUMAN MEETS AI)', t5_ok, t5_decoded);

// -------------------------------------------------------------
// T6: Institutional Identity Riddle (JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY)
// -------------------------------------------------------------
const t6 = PUZZLES.puzzle_6;
const t6_ok = checkPuzzleAnswer('puzzle_6', 'JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY') &&
  checkPuzzleAnswer('puzzle_6', 'SCHOOL OF FUTURE TECHNOLOGY');
report('T6 Institutional Riddle Dynamic Check (JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY)', t6_ok);

// -------------------------------------------------------------
// T7: Word Search (20 Words)
// -------------------------------------------------------------
const t7 = PUZZLES.puzzle_7;
let t7_allFound = true;
t7.targetWordList.forEach(word => {
  const found = findWordInGrid(word, t7.clientData.grid);
  if (!found) {
    t7_allFound = false;
    console.error(`  [NOT FOUND] T7 word in grid: ${word}`);
  }
});
const t7_ok = t7_allFound && checkPuzzleAnswer('puzzle_7', { foundWords: t7.targetWordList });
report('T7 Word Search Dynamic Check (20 words in grid)', t7_ok);

// -------------------------------------------------------------
// T8: Riddle - The Orbital Starman (ROADSTER)
// -------------------------------------------------------------
const t8 = PUZZLES.puzzle_8;
const t8_ok = checkPuzzleAnswer('puzzle_8', 'ROADSTER') &&
  checkPuzzleAnswer('puzzle_8', 'roadster') &&
  t8.difficulty === 'hard' &&
  t8.timeLimit === 1200;
report('T8 Riddle Dynamic Check (ROADSTER)', t8_ok);

// -------------------------------------------------------------
// T9: Dual Color Palette Riddle (DARK BLUE AND LIGHT STEEL BLUE)
// -------------------------------------------------------------
const t9 = PUZZLES.puzzle_9;
const t9_ok = checkPuzzleAnswer('puzzle_9', 'DARK BLUE AND LIGHT STEEL BLUE') &&
  checkPuzzleAnswer('puzzle_9', 'DARK BLUE LIGHT STEEL BLUE');
report('T9 Dual Color Riddle Dynamic Check (DARK BLUE AND LIGHT STEEL BLUE)', t9_ok);

// -------------------------------------------------------------
// T10: Coordinates Grid (FUTURE QUEST)
// -------------------------------------------------------------
const t10 = PUZZLES.puzzle_10;
const t10_words = t10.clientData.groupedChips.map(grp => {
  return grp.coords.map(([c, r]) => t10.clientData.grid[r - 1][c - 1]).join('');
}).join(' ');
const t10_ok = checkPuzzleAnswer('puzzle_10', t10_words) && t10_words === 'FUTURE QUEST';
report('T10 COORDS Dynamic Check (FUTURE QUEST)', t10_ok, t10_words);

console.log('=============================================================');
if (allPassed) {
  console.log('ALL SERVER PUZZLE DEFINITIONS & ANSWERS VERIFIED 100%!');
} else {
  console.error('SOME SERVER PUZZLE VERIFICATIONS FAILED!');
  process.exit(1);
}
