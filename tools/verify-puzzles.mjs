// /* DEV-ONLY */ Puzzle Data Verification Script
// Verifies all puzzle mathematical expressions, coordinates, ASCII decoders, and wordsearch grids.

import fs from 'fs';

console.log('=== FUTURE QUEST 2026 - PUZZLE VERIFICATION ===');

let allPassed = true;
function report(name, passed, detail = '') {
  if (passed) {
    console.log(`[PASS] ${name}`);
  } else {
    allPassed = false;
    console.error(`[FAIL] ${name}: ${detail}`);
  }
}

// -------------------------------------------------------------
// T1 ASCII: "Tomorrow starts with the code you write today"
// -------------------------------------------------------------
const t1_words = [
  [84, 111, 109, 111, 114, 114, 111, 119],
  [115, 116, 97, 114, 116, 115],
  [119, 105, 116, 104],
  [116, 104, 101],
  [99, 111, 100, 101],
  [121, 111, 117],
  [119, 114, 105, 116, 101],
  [116, 111, 100, 97, 121]
];
const t1_decoded = t1_words.map(w => String.fromCharCode(...w)).join(' ');
report('T1 ASCII', t1_decoded === 'Tomorrow starts with the code you write today', t1_decoded);

// -------------------------------------------------------------
// T2 COORDS: LEARN (2,1)(7,3)(3,2)(1,5)(2,4); BUILD (4,3)(6,1)(7,5)(6,4)(3,5); LEAD (2,6)(4,7)(6,6)(7,7)
// Grid (7x7, row 1 at top):
// -------------------------------------------------------------
const t2_grid = [
  ['Q', 'L', 'V', 'J', 'C', 'U', 'N'], // row 1
  ['C', 'S', 'A', 'P', 'P', 'K', 'F'], // row 2
  ['H', 'M', 'T', 'B', 'O', 'J', 'E'], // row 3
  ['Q', 'N', 'X', 'B', 'Z', 'L', 'Z'], // row 4
  ['R', 'H', 'D', 'X', 'M', 'K', 'I'], // row 5
  ['M', 'L', 'F', 'O', 'O', 'A', 'Z'], // row 6
  ['Z', 'S', 'N', 'E', 'R', 'X', 'D']  // row 7
];
function getT2Cell(col, row) {
  return t2_grid[row - 1][col - 1];
}
// Note: tuple syntax in JS is array [c, r]
const t2_w1 = [[2,1],[7,3],[3,2],[1,5],[2,4]].map(([c,r]) => getT2Cell(c,r)).join('');
const t2_w2 = [[4,3],[6,1],[7,5],[6,4],[3,5]].map(([c,r]) => getT2Cell(c,r)).join('');
const t2_w3 = [[2,6],[4,7],[6,6],[7,7]].map(([c,r]) => getT2Cell(c,r)).join('');
report('T2 COORDS LEARN', t2_w1 === 'LEARN', t2_w1);
report('T2 COORDS BUILD', t2_w2 === 'BUILD', t2_w2);
report('T2 COORDS LEAD', t2_w3 === 'LEAD', t2_w3);

// -------------------------------------------------------------
// T3 BODMAS: CODE THE FUTURE
// -------------------------------------------------------------
const t3_eqs = [
  { expr: 20 - 4 * 5 + 3, expected: 3, letter: 'C' },
  { expr: Math.pow(3, 2) + 18 / 3, expected: 15, letter: 'O' },
  { expr: 24 / (2 * 3), expected: 4, letter: 'D' },
  { expr: 2 + 3 * (9 - 7) - 3, expected: 5, letter: 'E' },
  { expr: Math.pow(4, 2) + 12 / 3, expected: 20, letter: 'T' },
  { expr: Math.pow(2, 3) + 6 - 3 * 2, expected: 8, letter: 'H' },
  { expr: (10 - 4) * 2 - 7, expected: 5, letter: 'E' },
  { expr: 3 * (4 + 4) / 4, expected: 6, letter: 'F' },
  { expr: Math.pow(5, 2) - 12 / 3, expected: 21, letter: 'U' },
  { expr: 100 / (2 * 5) * 2, expected: 20, letter: 'T' },
  { expr: 6 + 3 * 5, expected: 21, letter: 'U' },
  { expr: (12 - 3) * 4 / 2, expected: 18, letter: 'R' },
  { expr: Math.pow(4, 2) / 2 - 3, expected: 5, letter: 'E' }
];
const t3_letters = t3_eqs.map(e => String.fromCharCode(64 + e.expr)).join('');
const t3_pass = t3_eqs.every(e => e.expr === e.expected);
report('T3 BODMAS CODE THE FUTURE', t3_pass && t3_letters === 'CODETHEFUTURE', t3_letters);

// -------------------------------------------------------------
// T4 ASCII: curiosity is the key (displayed codes +1, shift -1)
// -------------------------------------------------------------
const t4_words = [
  [100, 118, 115, 106, 112, 116, 106, 117, 122],
  [106, 116],
  [117, 105, 102],
  [108, 102, 122]
];
const t4_decoded = t4_words.map(w => w.map(c => String.fromCharCode(c - 1)).join('')).join(' ');
report('T4 ASCII curiosity is the key', t4_decoded === 'curiosity is the key', t4_decoded);

// -------------------------------------------------------------
// T5 BODMAS: QUEST
// -------------------------------------------------------------
const t5_eqs = [
  { expr: 15 - 2 * 5, letter: 'E' }, // 5
  { expr: 5 * (7 - 3), letter: 'T' }, // 20
  { expr: 2 + 3 * 5, letter: 'Q' },   // 17
  { expr: Math.pow(4, 2) + 9 / 3, letter: 'S' }, // 19
  { expr: (4 + 3) * 3, letter: 'U' }  // 21
];
const t5_solved = t5_eqs.map(e => String.fromCharCode(64 + e.expr));
const t5_pass = t5_solved.sort().join('') === ['Q','U','E','S','T'].sort().join('');
report('T5 BODMAS QUEST', t5_pass, t5_solved.join(','));

// -------------------------------------------------------------
// T6 COORDS: BYTE
// -------------------------------------------------------------
const t6_grid = [
  ['S', 'K', 'A', 'T', 'E', 'R', 'X'], // r1
  ['M', 'N', 'O', 'P', 'Q', 'U', 'H'], // r2
  ['F', 'L', 'D', 'G', 'B', 'I', 'W'], // r3
  ['C', 'Y', 'Z', 'V', 'J', 'E', 'R'], // r4
  ['A', 'T', 'H', 'S', 'N', 'O', 'K'], // r5
  ['P', 'Q', 'U', 'D', 'M', 'L', 'F'], // r6
  ['B', 'G', 'X', 'I', 'Z', 'V', 'Y']  // r7
];
function getT6Cell(col, row) {
  return t6_grid[row - 1][col - 1];
}
const t6_b = getT6Cell(1, 7); // (1,7) = B
// Leg 1: right 6 from (1,7) -> (7,7) = Y
const t6_y = getT6Cell(7, 7);
// Leg 2: up 2, left 5 from (7,7) -> col 7-5=2, row 7-2=5 -> (2,5) = T
const t6_t = getT6Cell(2, 5);
// Leg 3: up 1, right 4 from (2,5) -> col 2+4=6, row 5-1=4 -> (6,4) = E
const t6_e = getT6Cell(6, 4);
const t6_word = `${t6_b}${t6_y}${t6_t}${t6_e}`;
report('T6 COORDS BYTE', t6_word === 'BYTE', t6_word);

// -------------------------------------------------------------
// T7 & T11 WORDSEARCH: 15x15 Grid with 20 Words
// -------------------------------------------------------------
const ws_grid_raw = [
  "DPYMAFAARSPVOMJ",
  "NXGENSLREUMEFIL",
  "UKODENKTSSAKYKM",
  "OALDCOGIHTWAXCJ",
  "RTOENIIFAALCYEM",
  "AANGETMIPISRTNC",
  "LDHDIANCENGOITQ",
  "YICECVBIFANBLEU",
  "IDEBSOVAUBIOARA",
  "JUTEHNILTLTTEEN",
  "DIPARNNQUEUIRDT",
  "DAILYIKGRYPCLZU",
  "VIRTUALNEAMSZYM",
  "UINTEGRATIONMRR",
  "GXCBXNOTYECUJPB"
];
const ws_grid = ws_grid_raw.map(row => row.split(''));
const R = 15;
const C = 15;
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

function findWordInGrid(word) {
  const len = word.length;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      for (const [dr, dc] of DIRS) {
        let match = true;
        for (let i = 0; i < len; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C || ws_grid[nr][nc] !== word[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          return { start: [r, c], end: [r + dr * (len - 1), c + dc * (len - 1)] };
        }
      }
    }
  }
  return null;
}

const t7_words = [
  "AROUND", "ARTIFICIAL", "CENTERED", "COMPUTING", "DAILY",
  "DATA", "EDGE", "FUTURE", "INNOVATIONS", "INTEGRATION",
  "LIFE", "RESHAPE"
];

const t11_words = [
  "QUANTUM", "ROBOTICS", "VIRTUAL", "SCIENCE",
  "SUSTAINABLE", "TECHNOLOGY", "REALITY", "RAPID"
];

console.log('--- Checking T7 Words in Grid ---');
let t7_all_found = true;
t7_words.forEach(w => {
  const found = findWordInGrid(w);
  if (!found) {
    t7_all_found = false;
    console.error(`  [NOT FOUND] T7 word: ${w}`);
  } else {
    console.log(`  [FOUND] ${w.padEnd(14)} from [${found.start}] to [${found.end}]`);
  }
});
report('T7 Word Search (12 words)', t7_all_found);

console.log('--- Checking T11 Words in Grid ---');
let t11_all_found = true;
t11_words.forEach(w => {
  const found = findWordInGrid(w);
  if (!found) {
    t11_all_found = false;
    console.error(`  [NOT FOUND] T11 word: ${w}`);
  } else {
    console.log(`  [FOUND] ${w.padEnd(14)} from [${found.start}] to [${found.end}]`);
  }
});
report('T11 Word Search (8 words)', t11_all_found);

// -------------------------------------------------------------
// T8 ASCII: FUTURE READY (shift -3)
// -------------------------------------------------------------
const t8_g1 = [73, 88, 87, 88, 85, 72];
const t8_g2 = [85, 72, 68, 71, 66];
const t8_g1_raw = t8_g1.map(c => String.fromCharCode(c)).join(''); // IXWXUH
const t8_g2_raw = t8_g2.map(c => String.fromCharCode(c)).join(''); // UHDGB
function caesarShift(charCode, shift) {
  // A=65..Z=90
  return String.fromCharCode(((charCode - 65 + shift + 26) % 26) + 65);
}
const t8_g1_shifted = t8_g1.map(c => caesarShift(c, -3)).join(''); // FUTURE
const t8_g2_shifted = t8_g2.map(c => caesarShift(c, -3)).join(''); // READY
report('T8 ASCII Raw Groups', t8_g1_raw === 'IXWXUH' && t8_g2_raw === 'UHDGB');
report('T8 ASCII Shifted (-3 with wrap)', `${t8_g1_shifted} ${t8_g2_shifted}` === 'FUTURE READY', `${t8_g1_shifted} ${t8_g2_shifted}`);

// -------------------------------------------------------------
// T9 BODMAS: SIGNAL
// -------------------------------------------------------------
const t9_eqs = [
  { slot: 3, val: 2 * (Math.pow(3, 2) - 2 * 3) + 1, expected: 7, char: 'G' },
  { slot: 6, val: 3 * Math.pow(2 + 2, 2) / 4, expected: 12, char: 'L' },
  { slot: 1, val: Math.pow(3 + 2, 2) - 12 / 2, expected: 19, char: 'S' },
  { slot: 5, val: Math.pow(5, 2) - 4 * (3 + 3), expected: 1, char: 'A' },
  { slot: 2, val: 100 / (2 * 5) - Math.pow(2, 3) + 7, expected: 9, char: 'I' },
  { slot: 4, val: (18 - 4) / 2 * 2, expected: 14, char: 'N' }
];
const t9_pass = t9_eqs.every(e => e.val === e.expected && String.fromCharCode(64 + e.val) === e.char);
const t9_slots = [];
t9_eqs.forEach(e => { t9_slots[e.slot] = e.char; });
const t9_word = t9_slots.slice(1).join('');
report('T9 BODMAS SIGNAL', t9_pass && t9_word === 'SIGNAL', t9_word);

// -------------------------------------------------------------
// T10 COORDS: CYBER (Row 1 at bottom, row 7 at top)
// -------------------------------------------------------------
const t10_grid_bottom_up = [
  // row 1 (bottom)
  ['Z', 'H', 'P', 'L', 'V', 'J', 'G'],
  // row 2
  ['R', 'X', 'K', 'Q', 'E', 'W', 'N'],
  // row 3
  ['D', 'B', 'S', 'I', 'M', 'F', 'U'],
  // row 4
  ['T', 'G', 'O', 'Y', 'Z', 'A', 'L'],
  // row 5
  ['V', 'N', 'H', 'R', 'C', 'P', 'I'],
  // row 6
  ['J', 'L', 'W', 'D', 'S', 'K', 'E'],
  // row 7 (top)
  ['M', 'Q', 'F', 'U', 'X', 'B', 'A']
];
function getT10Cell(col, row) {
  // col 1..7, row 1..7 (row 1 is index 0 in bottom_up array)
  return t10_grid_bottom_up[row - 1][col - 1];
}
const t10_coords = [
  { c: 10 / 2, r: Math.pow(3, 2) - 4 }, // (5, 5) -> C
  { c: Math.pow(2, 2), r: 12 / 3 },     // (4, 4) -> Y
  { c: 8 - 6, r: 9 / 3 },               // (2, 3) -> B
  { c: 3 + 2, r: 6 / 3 },               // (5, 2) -> E
  { c: 2 * 2, r: 15 / 3 }               // (4, 5) -> R
];
const t10_word = t10_coords.map(({c, r}) => getT10Cell(c, r)).join('');
report('T10 COORDS CYBER', t10_word === 'CYBER', t10_word);

console.log('===============================================');
if (allPassed) {
  console.log('ALL 11 PUZZLE DATA & MATH CHECKS PASSED 100%!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}
