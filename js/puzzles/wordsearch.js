/**
 * Future Quest 2026 - Word Search Puzzle Module
 * 
 * Handles Tile 7 (12 Tech Words) and Tile 11 (8 Tech Clues).
 * Implements 15x15 dense letter grid, 8-direction snapping, pointer drag,
 * tap-start + tap-end mobile touch support, keyboard navigation,
 * real-time validation, permanent line highlights, and poster strip rewards.
 */

import { showRewardPopup } from './popup.js';

let activeCleanup = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during wordsearch unmount:', e);
    }
    activeCleanup = null;
  }
}

/**
 * Snap arbitrary (r0, c0) -> (r1, c1) to nearest of 8 directions.
 */
function snapTo8Directions(r0, c0, r1, c1) {
  const dr = r1 - r0;
  const dc = c1 - c0;
  if (dr === 0 && dc === 0) return { r1: r0, c1: c0, valid: true };

  const absR = Math.abs(dr);
  const absC = Math.abs(dc);

  let snapDr = 0;
  let snapDc = 0;
  let length = 0;

  if (absR >= 2 * absC) {
    // Pure vertical
    snapDr = Math.sign(dr);
    snapDc = 0;
    length = absR;
  } else if (absC >= 2 * absR) {
    // Pure horizontal
    snapDr = 0;
    snapDc = Math.sign(dc);
    length = absC;
  } else {
    // Diagonal
    snapDr = Math.sign(dr);
    snapDc = Math.sign(dc);
    length = Math.max(absR, absC);
  }

  let finalR = r0 + snapDr * length;
  let finalC = c0 + snapDc * length;

  // Clamp within grid 0..14
  while ((finalR < 0 || finalR >= 15 || finalC < 0 || finalC >= 15) && length > 0) {
    length--;
    finalR = r0 + snapDr * length;
    finalC = c0 + snapDc * length;
  }

  return { r1: finalR, c1: finalC, snapDr, snapDc, length };
}

/**
 * Get all cell coordinates along line from (r0, c0) to (r1, c1).
 */
function getLineCells(r0, c0, r1, c1) {
  const cells = [];
  const dr = r1 - r0;
  const dc = c1 - c0;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (steps === 0) return [[r0, c0]];

  const stepR = dr === 0 ? 0 : Math.sign(dr);
  const stepC = dc === 0 ? 0 : Math.sign(dc);

  for (let i = 0; i <= steps; i++) {
    cells.push([r0 + stepR * i, c0 + stepC * i]);
  }
  return cells;
}

export function mount(root, data, ctx) {
  unmount();

  const isLocked = ctx.isLocked();
  const saved = ctx.getProgress() || {};
  const foundWords = new Set(saved.foundWords || []); // set of word uppercase strings
  const foundLines = saved.foundLines || []; // list of { word, start: [r,c], end: [r,c] }

  // Target word list & lookup
  // data.words is either array of string words (Tile 7) or array of { word, clue } (Tile 11)
  const isClueMode = !!data.isClueMode;
  const wordEntries = data.words.map(w => {
    if (typeof w === 'string') {
      return { word: w.toUpperCase(), clue: null };
    }
    return { word: w.word.toUpperCase(), clue: w.clue };
  });

  const targetWords = wordEntries.map(e => e.word);

  // Poster strip slots: one per target word
  const posterSlotsHtml = wordEntries.map((item, idx) => {
    const isFound = foundWords.has(item.word);
    return `
      <div class="poster-slot ${isFound ? 'slot-filled' : ''}" id="ws-slot-${idx}" data-word="${item.word}">
        <span class="slot-label">${isClueMode ? `Clue ${idx + 1}` : item.word}</span>
        <span class="slot-content mono">${isFound ? item.word : ''}</span>
      </div>
    `;
  }).join('');

  // 15x15 Grid of cells
  const grid = data.grid; // 15 rows of 15 chars
  let cellsHtml = '';
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const ch = grid[r][c];
      cellsHtml += `
        <button 
          type="button" 
          class="ws-cell mono" 
          data-r="${r}" 
          data-c="${c}" 
          id="ws-c-${r}-${c}"
          tabindex="0"
          aria-label="Row ${r + 1}, Column ${c + 1}: ${ch}"
        >
          ${ch}
        </button>
      `;
    }
  }

  // Word/Clue checklist HTML
  const listItemsHtml = wordEntries.map((item, idx) => {
    const isFound = foundWords.has(item.word);
    if (isClueMode) {
      return `
        <li class="ws-list-item ${isFound ? 'item-found' : ''}" id="ws-item-${idx}" data-word="${item.word}">
          <span class="ws-check-box mono">${isFound ? '✓' : idx + 1}</span>
          <div class="ws-clue-content">
            <span class="ws-clue-text">${item.clue}</span>
            <span class="ws-revealed-word mono">${isFound ? item.word : '-------'}</span>
          </div>
        </li>
      `;
    }
    return `
      <li class="ws-list-item ${isFound ? 'item-found' : ''}" id="ws-item-${idx}" data-word="${item.word}">
        <span class="ws-check-box mono">${isFound ? '✓' : '&bull;'}</span>
        <span class="ws-word-text mono">${item.word}</span>
      </li>
    `;
  }).join('');

  root.innerHTML = `
    <div class="puzzle-interactive-module puzzle-wordsearch" id="ws-module-root">
      <!-- Poster Slot Strip -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Found Words (${foundWords.size} of ${targetWords.length}):</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Main Wordsearch Workspace -->
      <div class="ws-layout">
        <!-- 15x15 Matrix Card -->
        <div class="ws-grid-card" role="region" aria-label="15 by 15 Wordsearch Grid">
          <div class="ws-grid-scroll-pane">
            <div class="ws-grid-inner" id="ws-grid-inner">
              <!-- SVG Permanent/Active Highlight Overlay -->
              <svg class="ws-lines-overlay" id="ws-lines-overlay" viewBox="0 0 15 15" preserveAspectRatio="none" aria-hidden="true">
                <!-- Line paths injected here -->
              </svg>
              <!-- 15x15 button elements -->
              <div class="ws-matrix" id="ws-matrix">${cellsHtml}</div>
            </div>
          </div>
          <div class="ws-touch-tip text-muted">
            Tip: Drag across letters or tap the start letter and then tap the end letter to select.
          </div>
        </div>

        <!-- Word / Clue Sidebar Checklist -->
        <div class="ws-sidebar" role="region" aria-label="Word Checklist">
          <div class="ws-sidebar-header">
            <h3 class="ws-sidebar-title">${isClueMode ? 'Target Clues' : 'Target Words'}</h3>
            <span class="ws-progress-count mono" id="ws-count">${foundWords.size}/${targetWords.length}</span>
          </div>
          <ul class="ws-checklist">${listItemsHtml}</ul>
        </div>
      </div>
    </div>
  `;

  const moduleRoot = root.querySelector('#ws-module-root');
  const matrix = moduleRoot.querySelector('#ws-matrix');
  const svgOverlay = moduleRoot.querySelector('#ws-lines-overlay');
  const cells = Array.from(moduleRoot.querySelectorAll('.ws-cell'));

  const persist = () => {
    ctx.saveProgress({
      foundWords: Array.from(foundWords),
      foundLines
    });
  };

  // Redraw SVG permanent highlight lines
  const renderSvgLines = () => {
    if (!svgOverlay) return;
    svgOverlay.innerHTML = '';

    foundLines.forEach(line => {
      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      // Coordinates in 15x15 cell units: center of cell is (c + 0.5, r + 0.5)
      lineEl.setAttribute('x1', String(line.start[1] + 0.5));
      lineEl.setAttribute('y1', String(line.start[0] + 0.5));
      lineEl.setAttribute('x2', String(line.end[1] + 0.5));
      lineEl.setAttribute('y2', String(line.end[0] + 0.5));
      lineEl.setAttribute('class', 'ws-locked-line');
      svgOverlay.appendChild(lineEl);
    });

    // Mark cells with .cell-found
    foundLines.forEach(line => {
      const coords = getLineCells(line.start[0], line.start[1], line.end[0], line.end[1]);
      coords.forEach(([r, c]) => {
        const cell = moduleRoot.querySelector(`#ws-c-${r}-${c}`);
        if (cell) cell.classList.add('cell-word-found');
      });
    });
  };

  renderSvgLines();

  // Selection state
  let isSelecting = false;
  let startCell = null; // [r, c]
  let currentEnd = null; // [r, c]
  let activePreviewLine = null;

  const clearSelectionHighlight = () => {
    cells.forEach(c => c.classList.remove('cell-selecting', 'cell-start'));
    if (activePreviewLine) {
      activePreviewLine.remove();
      activePreviewLine = null;
    }
  };

  const updateSelectionHighlight = (r0, c0, r1, c1) => {
    cells.forEach(c => c.classList.remove('cell-selecting'));
    const lineCoords = getLineCells(r0, c0, r1, c1);
    lineCoords.forEach(([r, c]) => {
      const cell = moduleRoot.querySelector(`#ws-c-${r}-${c}`);
      if (cell) cell.classList.add('cell-selecting');
    });

    // Draw active SVG line
    if (!activePreviewLine) {
      activePreviewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      activePreviewLine.setAttribute('class', 'ws-active-line');
      svgOverlay.appendChild(activePreviewLine);
    }
    activePreviewLine.setAttribute('x1', String(c0 + 0.5));
    activePreviewLine.setAttribute('y1', String(r0 + 0.5));
    activePreviewLine.setAttribute('x2', String(c1 + 0.5));
    activePreviewLine.setAttribute('y2', String(r1 + 0.5));
  };

  // Validate line selection
  const testSelection = (r0, c0, r1, c1) => {
    const lineCoords = getLineCells(r0, c0, r1, c1);
    const forwardChars = lineCoords.map(([r, c]) => grid[r][c]).join('');
    const backwardChars = [...forwardChars].reverse().join('');

    let matchedWord = null;
    let actualStart = [r0, c0];
    let actualEnd = [r1, c1];

    if (targetWords.includes(forwardChars) && !foundWords.has(forwardChars)) {
      matchedWord = forwardChars;
    } else if (targetWords.includes(backwardChars) && !foundWords.has(backwardChars)) {
      matchedWord = backwardChars;
      actualStart = [r1, c1];
      actualEnd = [r0, c0];
    }

    if (matchedWord) {
      // Word Found!
      foundWords.add(matchedWord);
      foundLines.push({ word: matchedWord, start: actualStart, end: actualEnd });

      // Update sidebar checklist
      const itemEl = moduleRoot.querySelector(`.ws-list-item[data-word="${matchedWord}"]`);
      if (itemEl) {
        itemEl.classList.add('item-found');
        const box = itemEl.querySelector('.ws-check-box');
        if (box) box.textContent = '✓';
        const rev = itemEl.querySelector('.ws-revealed-word');
        if (rev) rev.textContent = matchedWord;
      }

      // Update count
      const countEl = moduleRoot.querySelector('#ws-count');
      if (countEl) countEl.textContent = `${foundWords.size}/${targetWords.length}`;

      // Update poster strip slot
      const slotEl = moduleRoot.querySelector(`.poster-slot[data-word="${matchedWord}"]`);
      if (slotEl) {
        slotEl.classList.add('slot-filled');
        const content = slotEl.querySelector('.slot-content');
        if (content) content.textContent = matchedWord;
      }

      renderSvgLines();
      showRewardPopup(root, matchedWord);
      persist();

      // Check if all words found
      if (foundWords.size === targetWords.length) {
        ctx.onSolved();
      }
      return true;
    }
    return false;
  };

  // Pointer Events (drag across cells or tap-start then tap-end)
  cells.forEach(cell => {
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);

    cell.addEventListener('pointerdown', (e) => {
      if (isLocked) return;

      if (!isSelecting) {
        // Start selection
        isSelecting = true;
        startCell = [r, c];
        currentEnd = [r, c];
        cell.classList.add('cell-start');
        updateSelectionHighlight(r, c, r, c);
      } else {
        // Second tap (tap-end on mobile / tap mode)
        const snap = snapTo8Directions(startCell[0], startCell[1], r, c);
        testSelection(startCell[0], startCell[1], snap.r1, snap.c1);
        isSelecting = false;
        startCell = null;
        currentEnd = null;
        clearSelectionHighlight();
      }
    });

    cell.addEventListener('pointerenter', () => {
      if (isSelecting && startCell) {
        const snap = snapTo8Directions(startCell[0], startCell[1], r, c);
        currentEnd = [snap.r1, snap.c1];
        updateSelectionHighlight(startCell[0], startCell[1], snap.r1, snap.c1);
      }
    });
  });

  const handlePointerUp = () => {
    if (isSelecting && startCell && currentEnd) {
      if (startCell[0] !== currentEnd[0] || startCell[1] !== currentEnd[1]) {
        // Pointer drag release
        testSelection(startCell[0], startCell[1], currentEnd[0], currentEnd[1]);
        isSelecting = false;
        startCell = null;
        currentEnd = null;
        clearSelectionHighlight();
      }
      // If startCell === currentEnd, keep selecting mode open for 2nd tap!
    }
  };

  window.addEventListener('pointerup', handlePointerUp);

  // Keyboard navigation
  let kbFocus = [0, 0];
  let kbAnchor = null;

  cells.forEach(cell => {
    cell.addEventListener('keydown', (e) => {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);

      let nr = r;
      let nc = c;

      if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
      else if (e.key === 'ArrowDown') nr = Math.min(14, r + 1);
      else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
      else if (e.key === 'ArrowRight') nc = Math.min(14, c + 1);
      else if (e.key === ' ') {
        e.preventDefault();
        // Start or toggle selection anchor
        if (!kbAnchor) {
          kbAnchor = [r, c];
          cell.classList.add('cell-start');
          updateSelectionHighlight(r, c, r, c);
        } else {
          testSelection(kbAnchor[0], kbAnchor[1], r, c);
          kbAnchor = null;
          clearSelectionHighlight();
        }
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (kbAnchor) {
          testSelection(kbAnchor[0], kbAnchor[1], r, c);
          kbAnchor = null;
          clearSelectionHighlight();
        }
        return;
      } else {
        return;
      }

      e.preventDefault();
      const nextCell = moduleRoot.querySelector(`#ws-c-${nr}-${nc}`);
      if (nextCell) {
        nextCell.focus();
        if (kbAnchor) {
          const snap = snapTo8Directions(kbAnchor[0], kbAnchor[1], nr, nc);
          updateSelectionHighlight(kbAnchor[0], kbAnchor[1], snap.r1, snap.c1);
        }
      }
    });
  });

  activeCleanup = () => {
    window.removeEventListener('pointerup', handlePointerUp);
    cells.forEach(c => c.replaceWith(c.cloneNode(true)));
  };
}
