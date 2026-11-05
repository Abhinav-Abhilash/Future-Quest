// /* DEV-ONLY */ Automated Test Suite for Future Quest Interactive Puzzles

import { PUZZLE_REGISTRY } from '../js/puzzles/index.js';
import { PUZZLE_ART, ART_KEYS } from '../js/puzzles/art.js';
import { CONFIG } from '../js/config.js';

import { PUZZLES as SERVER_PUZZLES } from '../server/puzzles/definitions.js';

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
['ascii', 'bodmas', 'coords', 'wordsearch', 'riddle'].forEach(type => {
  assert(`Registry contains ${type}`, !!PUZZLE_REGISTRY[type]);
  assert(`${type} exports mount`, typeof PUZZLE_REGISTRY[type].mount === 'function');
  assert(`${type} exports unmount`, typeof PUZZLE_REGISTRY[type].unmount === 'function');
});

// 2. Art Icons Verification
assert('PUZZLE_ART has 6 keys', ART_KEYS.length === 6);
['gem', 'key', 'scroll', 'compass', 'chest', 'padlock'].forEach(key => {
  assert(`PUZZLE_ART contains ${key}`, typeof PUZZLE_ART[key] === 'string' && PUZZLE_ART[key].includes('<svg'));
});

// 3. Client Puzzle Configurations Verification (Puzzles 1..10) - Client is fully sanitized
for (let i = 1; i <= 10; i++) {
  const pid = `puzzle_${i}`;
  const p = CONFIG.PUZZLES[pid];
  const sp = SERVER_PUZZLES[pid];
  assert(`${pid} is defined in client`, !!p);
  assert(`${pid} has valid type in client`, ['ascii', 'bodmas', 'coords', 'wordsearch', 'riddle'].includes(p.type));
  assert(`${pid} client has no embedded answers/solutions`, !p.solution && !p.solutions && !p.mockAnswer);
  assert(`${pid} client has no unsealed hints or clues`, !p.hint && !p.clue);

  // Server definitions check
  assert(`${pid} exists in server definitions`, !!sp);
  assert(`${pid} server has hint`, typeof sp.hint === 'string' && sp.hint.length > 0);
  assert(`${pid} server has clue`, typeof sp.clue === 'object' && !!sp.clue.title);
  assert(`${pid} server difficulty is mapped`, ['easy', 'medium', 'hard'].includes(sp.difficulty));
}

console.log('=============================================');
if (pass) {
  console.log('ALL PUZZLE INTEGRATION TESTS PASSED 100%!');
} else {
  console.error('SOME PUZZLE INTEGRATION TESTS FAILED!');
  process.exit(1);
}

