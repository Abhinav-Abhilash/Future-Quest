/**
 * Puzzle Tile Order Utility
 * Future Quest 2026 - Server Backend
 *
 * Provides sequential, consistent tile ordering matching Task 1 to Task 10.
 */

/**
 * Returns ordered array of 10 puzzle IDs matching Task 1 to Task 10.
 *
 * @param {number} [_seed]
 * @returns {string[]} Ordered array of 10 puzzle IDs
 */
export function getTeamPuzzleOrder(_seed) {
  return [
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
}

