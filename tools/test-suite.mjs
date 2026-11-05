// /* DEV-ONLY */ Automated Test Suite for Future Quest Interactive Puzzles

import { PUZZLE_REGISTRY } from '../js/puzzles/index.js';
import { PUZZLE_ART, ART_KEYS } from '../js/puzzles/art.js';
import { CONFIG } from '../js/config.js';

console.log('=== RUNNING INTERACTIVE PUZZLE TEST SUITE ===');

let pass = true;
function assert(name, condition, extra = '') {
  if (condition) {
    console.log(`[PASS] ${name}`);
  } else {
    pass = false;
    console.error(`[FAIL] ${name} ${extra}`);
  }
}

// 1. Module Registry Verification
assert('PUZZLE_REGISTRY exists', typeof PUZZLE_REGISTRY === 'object');
['ascii', 'bodmas', 'coords', 'wordsearch', 'riddle', 'snake'].forEach(type => {
  assert(`Registry contains ${type}`, !!PUZZLE_REGISTRY[type]);
  assert(`${type} exports mount`, typeof PUZZLE_REGISTRY[type].mount === 'function');
  assert(`${type} exports unmount`, typeof PUZZLE_REGISTRY[type].unmount === 'function');
});

// 2. Art Icons Verification
assert('PUZZLE_ART has 6 keys', ART_KEYS.length === 6);
['gem', 'key', 'scroll', 'compass', 'chest', 'padlock'].forEach(key => {
  assert(`PUZZLE_ART contains ${key}`, typeof PUZZLE_ART[key] === 'string' && PUZZLE_ART[key].includes('<svg'));
});

// 3. Puzzle Configurations Verification (Puzzles 1..11)
for (let i = 1; i <= 11; i++) {
  const pid = `puzzle_${i}`;
  const p = CONFIG.PUZZLES[pid];
  assert(`${pid} is defined`, !!p);
  assert(`${pid} has valid type`, ['ascii', 'bodmas', 'coords', 'wordsearch', 'riddle', 'snake'].includes(p.type));
  assert(`${pid} has data object`, typeof p.data === 'object');
  assert(`${pid} has prompt`, typeof p.prompt === 'string' && p.prompt.length > 0);
  assert(`${pid} has whatToDo`, typeof p.whatToDo === 'string' && p.whatToDo.length > 0);
  if (p.bonus) {
    assert(`${pid} bonus is true`, p.bonus === true);
    assert(`${pid} has no hint`, !p.hint);
    assert(`${pid} has no clue`, !p.clue);
    assert(`${pid} is not in TILE_DIFFICULTY`, !CONFIG.TILE_DIFFICULTY[pid]);
  } else {
    assert(`${pid} has hint`, typeof p.hint === 'string' && p.hint.length > 0);
    assert(`${pid} has clue`, typeof p.clue === 'object' && !!p.clue.title);
    assert(`${pid} difficulty is mapped`, ['easy', 'medium', 'hard'].includes(CONFIG.TILE_DIFFICULTY[pid]));
  }
}

console.log('=============================================');
if (pass) {
  console.log('ALL PUZZLE INTEGRATION TESTS PASSED 100%!');
} else {
  console.error('SOME PUZZLE INTEGRATION TESTS FAILED!');
  process.exit(1);
}

