/**
 * Seeded PRNG and Tile Shuffling Utility
 * Future Quest 2026 - Server Backend
 *
 * Provides deterministic pseudo-random shuffling per team using team.shuffleSeed.
 */

/**
 * Mulberry32 32-bit PRNG generator
 * @param {number} seed
 * @returns {() => number} Returns float in [0, 1)
 */
export function createPRNG(seed) {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffle an array of puzzle IDs using Fisher-Yates and the team's seed.
 * Puzzle 11 (bonus) remains at index 10 (tile 11).
 *
 * @param {number} seed
 * @returns {string[]} Ordered array of 11 puzzle IDs
 */
export function getTeamPuzzleOrder(seed) {
  const prng = createPRNG(seed);
  const questPuzzles = [
    'puzzle_1',
    'puzzle_2',
    'puzzle_3',
    'puzzle_4',
    'puzzle_5',
    'puzzle_6',
    'puzzle_7',
    'puzzle_8',
    'puzzle_9',
    'puzzle_10',
  ];

  // Fisher-Yates shuffle on the 10 quest puzzles
  for (let i = questPuzzles.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = questPuzzles[i];
    questPuzzles[i] = questPuzzles[j];
    questPuzzles[j] = temp;
  }

  // Puzzle 11 is always the 11th tile (bonus arcade)
  return [...questPuzzles, 'puzzle_11'];
}
