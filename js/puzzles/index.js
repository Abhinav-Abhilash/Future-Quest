/**
 * Future Quest 2026 - Puzzle Registry
 * 
 * Maps puzzle type keys ('ascii', 'bodmas', 'coords', 'wordsearch')
 * to their respective module implementations.
 */

import * as ascii from './ascii.js';
import * as bodmas from './bodmas.js';
import * as coords from './coords.js';
import * as wordsearch from './wordsearch.js';

export const PUZZLE_REGISTRY = {
  ascii,
  bodmas,
  coords,
  wordsearch
};
