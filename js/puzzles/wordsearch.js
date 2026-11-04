/**
 * Future Quest 2026 - Word Search Puzzle Module
 * 
 * Upgraded UX:
 * - Responsive 15x15 matrix sizing: min(30px, calc((100vw - 48px) / 15)) fitting 360px without horizontal scrolling.
 * - Pointer drag drawing rounded SVG capsule snapped to 8 directions; tap-start then tap-end fallback.
 * - Found words lock in one of 6 flat colors (violet, orange, teal, pink, blue, yellow at 40% opacity).
 * - Word chip in checklist gets matching color dot and strike-through (200ms transition).
 * - Animated progress bar with transform: scaleX(...) for 'Found X / N'.
 * - Tile 11: Clue cards flip (rotateY 180deg) to reveal found words.
 */

import { showRewardPopup, animateGroupLock, playWrongFeedback, isReducedMotion } from './popup.js';

let activeCleanup = null;
let activeModuleInstance = null;

const CAPSULE_PALETTE = [
  '#8b5cf6', // violet
  '#f59e0b', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
  '#3b82f6', // blue
  '#eab308'  // yellow
];

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during wordsearch unmount:', e);
    }
    activeCleanup = null;
  }
  activeModuleInstance = null;
}

export function checkAnswer() {
  // Wordsearch matches continuously on drag release / 2nd tap
  if (activeModuleInstance && typeof activeModuleInstance.checkAll === 'function') {
    activeModuleInstance.checkAll();
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
  const foundWords = new Set(saved.foundWords || []); // set of uppercase word strings
  const foundLines = saved.foundLines || []; // list of { word, start: [r,c], end: [r,c], color }

  // Target word list & lookup
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
      <div class="poster-slot ${isFound ? 'slot-filled slot-stamped' : ''}" id="ws-slot-${idx}" data-word="${item.word}">
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
    const existingLine = foundLines.find(l => l.word === item.word);
    const wordColor = existingLine ? existingLine.color : CAPSULE_PALETTE[idx % CAPSULE_PALETTE.length];

    if (isClueMode) {
      // Tile 11: 3D Flip Clue Card
      return `
        <li class="ws-clue-card ${isFound ? 'card-flipped' : ''}" id="ws-item-${idx}" data-word="${item.word}" data-index="${idx}">
          <div class="clue-card-flipper">
            <div class="clue-card-front keycap">
              <div class="clue-card-meta">
                <span class="clue-num-badge mono">Clue ${idx + 1}</span>
                <span class="clue-indicator-dot" style="background: ${wordColor};"></span>
              </div>
              <p class="clue-card-text">${item.clue}</p>
            </div>
            <div class="clue-card-back keycap" style="border-left: 3px solid ${wordColor};">
              <span class="clue-solved-tag mono">FOUND ✓</span>
              <span class="clue-revealed-word mono">${item.word}</span>
            </div>
          </div>
        </li>
      `;
    }

    // Tile 7: Standard Word Chip with color dot and strike-through
    return `
      <li class="ws-list-item keycap ${isFound ? 'item-found' : ''}" id="ws-item-${idx}" data-word="${item.word}">
        <span class="ws-color-dot" style="background: ${isFound ? wordColor : '#4A3578'};"></span>
        <span class="ws-word-text mono">${item.word}</span>
        <span class="ws-check-box mono">${isFound ? '✓' : ''}</span>
      </li>
    `;
  }).join('');

  const progressFraction = targetWords.length > 0 ? (foundWords.size / targetWords.length) : 0;

  root.innerHTML = `
    <div class="puzzle-interactive-module puzzle-wordsearch ${isClueMode ? 'ws-clue-mode' : ''}" id="ws-module-root">
      <!-- Poster Strip Slots -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Found Words (${foundWords.size} of ${targetWords.length}):</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Main Wordsearch Workspace -->
      <div class="ws-layout">
        <!-- 15x15 Matrix Card (Responsive, no scrollbar required) -->
        <div class="ws-grid-card" role="region" aria-label="15 by 15 Wordsearch Grid">
          <div class="ws-matrix-container" id="ws-matrix-container">
            <!-- SVG Rounded Capsule Overlay (viewBox 0 0 15 15 matches 15x15 grid) -->
            <svg class="ws-capsule-overlay" id="ws-capsule-overlay" viewBox="0 0 15 15" preserveAspectRatio="none" aria-hidden="true">
              <g id="ws-capsule-group"></g>
              <line id="ws-preview-capsule" class="ws-preview-capsule" stroke-linecap="round" stroke-width="0.82" stroke="var(--module-accent-signal, #FF9900)" stroke-opacity="0" x1="0" y1="0" x2="0" y2="0" />
            </svg>
            <!-- 15x15 button grid -->
            <div class="ws-matrix" id="ws-matrix">${cellsHtml}</div>
          </div>
          
          <div class="ws-touch-tip text-muted">
            Drag across letters or tap the start letter and then tap the end letter to select.
          </div>
        </div>

        <!-- Word / Clue Sidebar Checklist -->
        <div class="ws-sidebar" role="region" aria-label="Word Checklist">
          <div class="ws-sidebar-header">
            <div class="ws-header-title-row">
              <h3 class="ws-sidebar-title">${isClueMode ? 'Target Clues' : 'Target Words'}</h3>
              <span class="ws-progress-count mono" id="ws-count">${foundWords.size} / ${targetWords.length}</span>
            </div>
            <!-- Animated ScaleX Progress Bar -->
            <div class="ws-progress-track" aria-hidden="true">
              <div class="ws-progress-fill" id="ws-progress-fill" style="transform: scaleX(${progressFraction});"></div>
            </div>
          </div>
          <ul class="ws-checklist ${isClueMode ? 'ws-clue-cards-list' : ''}" id="ws-checklist-ul">${listItemsHtml}</ul>
        </div>
      </div>
    </div>
  `;

  const moduleRoot = root.querySelector('#ws-module-root');
  const capsuleGroup = moduleRoot.querySelector('#ws-capsule-group');
  const previewCapsule = moduleRoot.querySelector('#ws-preview-capsule');
  const cells = Array.from(moduleRoot.querySelectorAll('.ws-cell'));
  const progressFill = moduleRoot.querySelector('#ws-progress-fill');

  const persist = () => {
    ctx.saveProgress({
      foundWords: Array.from(foundWords),
      foundLines
    });
  };

  // Draw permanent SVG rounded capsules
  const renderSvgCapsules = () => {
    if (!capsuleGroup) return;
    capsuleGroup.innerHTML = '';

    foundLines.forEach(line => {
      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      // Cell center is (c + 0.5, r + 0.5) in 15x15 coordinates
      lineEl.setAttribute('x1', String(line.start[1] + 0.5));
      lineEl.setAttribute('y1', String(line.start[0] + 0.5));
      lineEl.setAttribute('x2', String(line.end[1] + 0.5));
      lineEl.setAttribute('y2', String(line.end[0] + 0.5));
      lineEl.setAttribute('stroke', line.color || '#FF9900');
      lineEl.setAttribute('stroke-width', '0.84');
      lineEl.setAttribute('stroke-linecap', 'round');
      lineEl.setAttribute('stroke-opacity', '0.40');
      lineEl.setAttribute('class', 'ws-locked-capsule');
      capsuleGroup.appendChild(lineEl);
    });

    // Mark cells with .cell-word-found
    foundLines.forEach(line => {
      const coords = getLineCells(line.start[0], line.start[1], line.end[0], line.end[1]);
      coords.forEach(([r, c]) => {
        const cell = moduleRoot.querySelector(`#ws-c-${r}-${c}`);
        if (cell) {
          cell.classList.add('cell-word-found');
        }
      });
    });
  };

  renderSvgCapsules();

  // Selection state
  let isSelecting = false;
  let startCell = null; // [r, c]
  let currentEnd = null; // [r, c]

  const clearSelection = () => {
    cells.forEach(c => c.classList.remove('cell-selecting', 'cell-start'));
    if (previewCapsule) {
      previewCapsule.setAttribute('stroke-opacity', '0');
    }
  };

  const updateSelection = (r0, c0, r1, c1) => {
    cells.forEach(c => c.classList.remove('cell-selecting'));
    const lineCoords = getLineCells(r0, c0, r1, c1);
    lineCoords.forEach(([r, c]) => {
      const cell = moduleRoot.querySelector(`#ws-c-${r}-${c}`);
      if (cell) cell.classList.add('cell-selecting');
    });

    if (previewCapsule) {
      previewCapsule.setAttribute('x1', String(c0 + 0.5));
      previewCapsule.setAttribute('y1', String(r0 + 0.5));
      previewCapsule.setAttribute('x2', String(c1 + 0.5));
      previewCapsule.setAttribute('y2', String(r1 + 0.5));
      previewCapsule.setAttribute('stroke-opacity', '0.45');
    }
  };

  // Check matched word on selection completion
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
      // Assign color from 6-color palette
      const colorIndex = foundWords.size % CAPSULE_PALETTE.length;
      const color = CAPSULE_PALETTE[colorIndex];

      foundWords.add(matchedWord);
      foundLines.push({ word: matchedWord, start: actualStart, end: actualEnd, color });

      // Update progress bar scaleX
      if (progressFill) {
        progressFill.style.transform = `scaleX(${foundWords.size / targetWords.length})`;
      }

      // Update checklist item
      const itemEl = moduleRoot.querySelector(`.ws-list-item[data-word="${matchedWord}"]`);
      if (itemEl) {
        itemEl.classList.add('item-found');
        const dot = itemEl.querySelector('.ws-color-dot');
        if (dot) dot.style.background = color;
        const box = itemEl.querySelector('.ws-check-box');
        if (box) box.textContent = '✓';
      }

      // Update clue card (Tile 11)
      const clueCard = moduleRoot.querySelector(`.ws-clue-card[data-word="${matchedWord}"]`);
      if (clueCard) {
        clueCard.classList.add('card-flipped');
        const cardBack = clueCard.querySelector('.clue-card-back');
        if (cardBack) cardBack.style.borderLeftColor = color;
      }

      // Update count
      const countEl = moduleRoot.querySelector('#ws-count');
      if (countEl) countEl.textContent = `${foundWords.size} / ${targetWords.length}`;

      // Update poster strip slot
      const slotEl = moduleRoot.querySelector(`.poster-slot[data-word="${matchedWord}"]`);
      if (slotEl) {
        slotEl.classList.add('slot-filled', 'slot-stamped');
        const content = slotEl.querySelector('.slot-content');
        if (content) content.textContent = matchedWord;
      }

      renderSvgCapsules();
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

  // Pointer Events (Drag across cells or tap-start then tap-end)
  cells.forEach(cell => {
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);

    cell.addEventListener('pointerdown', (e) => {
      if (isLocked) return;

      if (!isSelecting) {
        // First tap / start drag
        isSelecting = true;
        startCell = [r, c];
        currentEnd = [r, c];
        cell.classList.add('cell-start');
        updateSelection(r, c, r, c);
      } else {
        // Second tap
        const snap = snapTo8Directions(startCell[0], startCell[1], r, c);
        const didMatch = testSelection(startCell[0], startCell[1], snap.r1, snap.c1);
        if (!didMatch && (startCell[0] !== r || startCell[1] !== c)) {
          playWrongFeedback(cell);
        }
        isSelecting = false;
        startCell = null;
        currentEnd = null;
        clearSelection();
      }
    });

    cell.addEventListener('pointerenter', () => {
      if (isSelecting && startCell) {
        const snap = snapTo8Directions(startCell[0], startCell[1], r, c);
        currentEnd = [snap.r1, snap.c1];
        updateSelection(startCell[0], startCell[1], snap.r1, snap.c1);
      }
    });
  });

  const handlePointerUp = () => {
    if (isSelecting && startCell && currentEnd) {
      if (startCell[0] !== currentEnd[0] || startCell[1] !== currentEnd[1]) {
        // Drag release across different cells
        testSelection(startCell[0], startCell[1], currentEnd[0], currentEnd[1]);
        isSelecting = false;
        startCell = null;
        currentEnd = null;
        clearSelection();
      }
    }
  };

  window.addEventListener('pointerup', handlePointerUp);

  // Keyboard navigation
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
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        cell.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        return;
      } else {
        return;
      }

      e.preventDefault();
      const nextCell = moduleRoot.querySelector(`#ws-c-${nr}-${nc}`);
      if (nextCell) {
        nextCell.focus();
        if (isSelecting && startCell) {
          const snap = snapTo8Directions(startCell[0], startCell[1], nr, nc);
          currentEnd = [snap.r1, snap.c1];
          updateSelection(startCell[0], startCell[1], snap.r1, snap.c1);
        }
      }
    });
  });

  activeModuleInstance = {
    checkAll: () => {}
  };

  activeCleanup = () => {
    window.removeEventListener('pointerup', handlePointerUp);
    cells.forEach(c => c.replaceWith(c.cloneNode(true)));
  };
}
