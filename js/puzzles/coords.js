/**
 * Future Quest 2026 - Coordinates Grid Puzzle Module
 * 
 * Clean, neutral coordinates interaction:
 * - Touch targets >= 40-44px (min(44px, calc((100vw - 48px) / 8))).
 * - 7x7 grid with neutral hover and selection styling.
 * - Cartesian coordinates and standard top-down coordinates support.
 * - Per-group Clear buttons and export checkAnswer().
 */

import { PUZZLE_ART } from './art.js';
import { showRewardPopup, animateGroupLock, playWrongFeedback, isReducedMotion } from './popup.js';

let activeCleanup = null;
let activeModuleInstance = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during coords unmount:', e);
    }
    activeCleanup = null;
  }
  activeModuleInstance = null;
}

export function checkAnswer() {
  if (activeModuleInstance && typeof activeModuleInstance.checkAll === 'function') {
    activeModuleInstance.checkAll();
  }
}

export function mount(root, data, ctx) {
  unmount();

  const isLocked = ctx.isLocked();
  const saved = ctx.getProgress() || {};
  const entries = saved.entries || {}; // chip key -> letter
  const solvedGroups = new Set(saved.solvedGroups || []);
  let activeChipKey = saved.activeChipKey || null;
  let routeLegsCompleted = typeof saved.routeLegsCompleted === 'number' ? saved.routeLegsCompleted : 0;

  // Poster strip slots
  const posterGroups = data.groups || [];
  const posterSlotsHtml = posterGroups.map((grpName, idx) => {
    const isGrpSolved = solvedGroups.has(idx);
    const displayText = isGrpSolved ? (data.groupSolutions ? data.groupSolutions[idx] : grpName) : '';
    return `
      <div class="poster-slot ${isGrpSolved ? 'slot-filled slot-stamped' : ''}" id="poster-slot-${idx}" data-index="${idx}">
        <span class="slot-label">${grpName}</span>
        <span class="slot-content mono">${displayText}</span>
      </div>
    `;
  }).join('');

  // Determine row numbering:
  // Tile 10 uses Cartesian bottom-to-top 1..7, Tile 2 & 6 use top-to-bottom 1..7
  const isBottomUp = !!data.isBottomUp;
  const rowLabels = isBottomUp ? [7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7];
  const colLabels = [1, 2, 3, 4, 5, 6, 7];
  const gridMatrix = data.grid;

  let gridCellsHtml = '';
  for (let rIdx = 0; rIdx < 7; rIdx++) {
    const rowNum = rowLabels[rIdx];
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const colNum = colLabels[cIdx];
      const char = gridMatrix[rIdx][cIdx];
      gridCellsHtml += `
        <button 
          type="button" 
          class="coord-cell keycap mono" 
          data-col="${colNum}" 
          data-row="${rowNum}" 
          data-r-idx="${rIdx}" 
          data-c-idx="${cIdx}"
          data-char="${char}"
          id="coord-cell-${colNum}-${rowNum}"
          aria-label="Col ${colNum}, Row ${rowNum}: ${char}"
        >
          <span class="coord-cell-char">${char}</span>
        </button>
      `;
    }
  }

  // Crosshairs headers
  const colHeadersHtml = colLabels.map(c => `
    <div class="coord-header-col mono" data-col="${c}">${c}</div>
  `).join('');

  const rowHeadersHtml = rowLabels.map(r => `
    <div class="coord-header-row mono" data-row="${r}">${r}</div>
  `).join('');

  // Controls/Chips HTML
  let chipsAreaHtml = '';

  if (data.isRouteTracer) {
    // Route instructions & legs list (neutral, no target answers or progress reveals)
    chipsAreaHtml = `
      <div class="route-tracer-panel" role="region" aria-label="Route Legs">
        <div class="route-panel-header">
          <h3 class="route-panel-title">Trace the Path</h3>
          <span class="route-panel-badge mono">${(data.legs || []).length} legs</span>
        </div>
        <p class="route-hint-text">
          Start at (1, 7) and tap each destination point in sequence according to the legs below.
        </p>
        <ol class="route-legs-list">
          ${(data.legs || []).map((leg, idx) => `
            <li class="route-leg-item" id="route-leg-${idx}">
              <div class="leg-step-badge mono">Step ${idx + 1}</div>
              <div class="leg-desc-block">
                <span class="leg-desc">${leg.desc}</span>
              </div>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  } else if (data.groupedChips) {
    // Multi-word coordinate chips
    chipsAreaHtml = data.groupedChips.map((grp, gIdx) => {
      const chips = grp.coords.map((pair, cIdx) => {
        const key = `g${gIdx}_c${cIdx}`;
        const letter = entries[key] || '';
        const isPairActive = activeChipKey === key;
        return `
          <button 
            type="button" 
            class="coord-chip-btn keycap ${isPairActive ? 'chip-active' : ''} ${letter ? 'chip-filled' : ''}" 
            data-key="${key}"
            data-col="${pair[0]}"
            data-row="${pair[1]}"
            id="coord-chip-${key}"
            ${isLocked ? 'disabled' : ''}
            aria-label="Word ${gIdx + 1} letter ${cIdx + 1}, coordinate (${pair[0]}, ${pair[1]})"
          >
            <span class="chip-coords mono">(${pair[0]},${pair[1]})</span>
            <span class="chip-letter mono">${letter || '&bull;'}</span>
          </button>
        `;
      }).join('');

      return `
        <div class="coord-word-group" id="coord-group-${gIdx}">
          <div class="coord-group-header">
            <div class="coord-group-title">
              <span class="coord-group-name">Word ${gIdx + 1} (${grp.coords.length} letters)</span>
            </div>
            ${!isLocked ? `
              <button type="button" class="btn-group-clear" data-group="${gIdx}" aria-label="Clear Word ${gIdx + 1}">Clear</button>
            ` : ''}
          </div>
          <div class="coord-chips-row">${chips}</div>
        </div>
      `;
    }).join('');
  } else if (data.mathCoords) {
    // Cartesian Coordinate Hybrid
    const chips = data.mathCoords.map((item, idx) => {
      const key = `c${idx}`;
      const letter = entries[key] || '';
      const isPairActive = activeChipKey === key;
      return `
        <button 
          type="button" 
          class="coord-chip-btn keycap ${isPairActive ? 'chip-active' : ''} ${letter ? 'chip-filled' : ''}" 
          data-key="${key}"
          data-col="${item.col}"
          data-row="${item.row}"
          id="coord-chip-${key}"
          ${isLocked ? 'disabled' : ''}
          aria-label="Coordinate ${item.expr}, target (${item.col}, ${item.row})"
        >
          <span class="chip-math mono">${item.expr}</span>
          <span class="chip-coords mono">(${item.col},${item.row})</span>
          <span class="chip-letter mono">${letter || '&bull;'}</span>
        </button>
      `;
    }).join('');

    chipsAreaHtml = `
      <div class="coord-word-group" id="coord-group-0">
        <div class="coord-group-header">
          <div class="coord-group-title">
            <span class="coord-group-name">Word 1 (${data.mathCoords.length} letters)</span>
          </div>
          ${!isLocked ? `
            <button type="button" class="btn-group-clear" data-group="0" aria-label="Clear Word 1">Clear</button>
          ` : ''}
        </div>
        <div class="coord-chips-row">${chips}</div>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="puzzle-interactive-module puzzle-coords ${isBottomUp ? 'coords-cartesian' : ''}" id="coords-module-root">
      <!-- Poster Strip Slots -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Decoded Poster Fragments:</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Main Coordinates Interactive Area -->
      <div class="coords-layout">
        <div class="coords-grid-wrapper" role="region" aria-label="7 by 7 Coordinates Grid" id="coords-grid-wrapper">
          <div class="coord-axis-banner ${isBottomUp ? 'axis-banner-cartesian' : ''}">
            ${isBottomUp ? '<strong>CARTESIAN SYSTEM:</strong> Row 1 is the BOTTOM ↑ (Row 7 is top)' : '<strong>GRID SYSTEM:</strong> (Col, Row) starting from top-left'}
          </div>

          <div class="coords-table-container">
            <!-- Top Column Headers -->
            <div class="coords-col-headers" id="coords-col-headers">${colHeadersHtml}</div>
            
            <div class="coords-row-and-cells">
              <!-- Left Row Headers -->
              <div class="coords-row-headers" id="coords-row-headers">${rowHeadersHtml}</div>
              
              <!-- 7x7 Grid -->
              <div class="coords-grid-stage" id="coords-grid-stage">
                <div class="coords-grid" id="coords-cells-grid" role="grid">${gridCellsHtml}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chips & Controls Column -->
        <div class="coords-controls-column">
          ${chipsAreaHtml}

          ${!data.isRouteTracer ? `
            <div class="puzzle-action-bar-embedded">
              <button type="button" class="btn btn-primary keycap" id="btn-coords-check" ${isLocked ? 'disabled' : ''}>
                Check Coordinates
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const moduleRoot = root.querySelector('#coords-module-root');
  const gridStage = moduleRoot.querySelector('#coords-grid-stage');
  const cells = Array.from(moduleRoot.querySelectorAll('.coord-cell'));
  const colHeaders = Array.from(moduleRoot.querySelectorAll('.coord-header-col'));
  const rowHeaders = Array.from(moduleRoot.querySelectorAll('.coord-header-row'));
  const allChipBtns = Array.from(moduleRoot.querySelectorAll('.coord-chip-btn'));
  const routeSvgGroup = moduleRoot.querySelector('#route-segments-group');

  const persist = () => {
    ctx.saveProgress({
      entries,
      solvedGroups: Array.from(solvedGroups),
      activeChipKey,
      routeLegsCompleted
    });
  };

  // FLIP animation of letter from cell into chip
  const animateFlyLetter = (fromCell, toChip, letter, onComplete) => {
    if (isReducedMotion()) {
      onComplete();
      return;
    }

    const fromRect = fromCell.getBoundingClientRect();
    const toLetterBay = toChip.querySelector('.chip-letter');
    const toRect = (toLetterBay || toChip).getBoundingClientRect();

    const flyingGhost = document.createElement('div');
    flyingGhost.className = 'flying-coord-letter mono';
    flyingGhost.textContent = letter;
    flyingGhost.style.cssText = `
      position: fixed;
      top: ${fromRect.top}px;
      left: ${fromRect.left}px;
      width: ${fromRect.width}px;
      height: ${fromRect.height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: #FFFFFF;
      background: var(--module-accent, #14B8A6);
      border: 1px solid #2DD4BF;
      border-radius: 4px;
      z-index: 1000;
      pointer-events: none;
      transition: transform 240ms cubic-bezier(0.2, 0, 0, 1), opacity 240ms ease;
    `;
    document.body.appendChild(flyingGhost);

    requestAnimationFrame(() => {
      const deltaX = toRect.left + (toRect.width - fromRect.width) / 2 - fromRect.left;
      const deltaY = toRect.top + (toRect.height - fromRect.height) / 2 - fromRect.top;
      const scale = Math.max(0.7, toRect.width / fromRect.width);

      flyingGhost.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
      flyingGhost.style.opacity = '0.9';

      setTimeout(() => {
        flyingGhost.remove();
        onComplete();
      }, 250);
    });
  };

  // Attach cell interactions (neutral, no auto-assist highlighting)
  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => {
      if (isLocked) return;

      if (data.isRouteTracer) {
        handleRouteCellClick(cell);
      } else {
        handleCoordCellClick(cell);
      }
    });

    // Keyboard navigation in 7x7 grid (neutral focus only)
    cell.addEventListener('keydown', (e) => {
      let targetIdx = null;
      if (e.key === 'ArrowUp') targetIdx = idx - 7;
      else if (e.key === 'ArrowDown') targetIdx = idx + 7;
      else if (e.key === 'ArrowLeft') targetIdx = idx - 1;
      else if (e.key === 'ArrowRight') targetIdx = idx + 1;

      if (targetIdx !== null && targetIdx >= 0 && targetIdx < cells.length) {
        e.preventDefault();
        cells[targetIdx].focus();
      }
    });
  });

  // Route Tracer logic (player taps cells themselves; no auto-assist or route lines)
  const handleRouteCellClick = async (cell) => {
    cells.forEach(c => c.classList.remove('cell-selected'));
    cell.classList.add('cell-selected');

    const char = cell.dataset.char;
    entries[`step_${routeLegsCompleted}`] = char;
    routeLegsCompleted++;
    persist();

    if (routeLegsCompleted >= (data.legs || []).length) {
      const fullSentence = (data.legs || []).map((_, idx) => entries[`step_${idx}`] || '').join('');
      let res = null;
      if (typeof ctx.checkAnswer === 'function') {
        res = await ctx.checkAnswer(fullSentence);
      }
      if (res && res.correct) {
        solvedGroups.add(0);
        persist();
        if (ctx.onSolved) ctx.onSolved(res);
      } else {
        routeLegsCompleted = 0;
        persist();
        if (ctx.onWrongCheck) ctx.onWrongCheck(res);
      }
    }
  };

  // Chip buttons click (Tile 2 & 10) - player selects active chip
  allChipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      allChipBtns.forEach(b => b.classList.remove('chip-active'));
      btn.classList.add('chip-active');
      activeChipKey = btn.dataset.key;
      persist();
    });
  });

  // Handle cell click filling into player-selected active chip
  const handleCoordCellClick = (cell) => {
    // Neutral selection style on clicked cell
    cells.forEach(c => c.classList.remove('cell-selected'));
    cell.classList.add('cell-selected');

    if (!activeChipKey) return;
    const chip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${activeChipKey}"]`);

    if (chip && !chip.disabled) {
      const key = chip.dataset.key;
      const char = cell.dataset.char;

      animateFlyLetter(cell, chip, char, () => {
        entries[key] = char;
        const letterSpan = chip.querySelector('.chip-letter');
        if (letterSpan) letterSpan.textContent = char;
        chip.classList.add('chip-filled');
        // Player chooses which chip to fill next; no auto-advancing
        persist();
      });
    }
  };

  // Clear group buttons
  const clearBtns = Array.from(moduleRoot.querySelectorAll('.btn-group-clear'));
  clearBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const gIdx = parseInt(btn.dataset.group, 10);
      if (data.groupedChips) {
        const grp = data.groupedChips[gIdx];
        if (grp) {
          grp.coords.forEach((_, cIdx) => {
            const key = `g${gIdx}_c${cIdx}`;
            delete entries[key];
            const chip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${key}"]`);
            if (chip) {
              chip.classList.remove('chip-filled');
              const span = chip.querySelector('.chip-letter');
              if (span) span.innerHTML = '&bull;';
            }
          });
        }
      } else if (data.mathCoords) {
        data.mathCoords.forEach((_, idx) => {
          const key = `c${idx}`;
          delete entries[key];
          const chip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${key}"]`);
          if (chip) {
            chip.classList.remove('chip-filled');
            const span = chip.querySelector('.chip-letter');
            if (span) span.innerHTML = '&bull;';
          }
        });
      }
      persist();
    });
  });

  // Verification (Neutral feedback, no per-chip red/green)
  const checkCoordinates = async () => {
    if (ctx.isLocked && ctx.isLocked()) return;

    if (data.groupedChips) {
      const fullSentence = data.groupedChips.map((grp, gIdx) => {
        return grp.coords.map((_, cIdx) => entries[`g${gIdx}_c${cIdx}`] || '').join('');
      }).join(' ').trim();

      if (!fullSentence) return;

      let res = null;
      if (typeof ctx.checkAnswer === 'function') {
        res = await ctx.checkAnswer(fullSentence);
      }

      if (res && res.correct) {
        data.groupedChips.forEach((grp, gIdx) => {
          solvedGroups.add(gIdx);
        });
        allChipBtns.forEach(c => { if (c) c.disabled = true; });
        persist();
        if (ctx.onSolved) ctx.onSolved(res);
      } else {
        if (ctx.onWrongCheck) ctx.onWrongCheck(res);
      }
    } else {
      const fullSentence = allChipBtns.map(c => entries[c.dataset.key] || '').join('');
      if (!fullSentence) return;

      let res = null;
      if (typeof ctx.checkAnswer === 'function') {
        res = await ctx.checkAnswer(fullSentence);
      }

      if (res && res.correct) {
        allChipBtns.forEach(c => { if (c) c.disabled = true; });
        persist();
        if (ctx.onSolved) ctx.onSolved(res);
      } else {
        if (ctx.onWrongCheck) ctx.onWrongCheck(res);
      }
    }
  };

  const checkBtn = moduleRoot.querySelector('#btn-coords-check');
  if (checkBtn) {
    checkBtn.addEventListener('click', checkCoordinates);
  }

  // Active module instance for external header action bar checkAnswer()
  activeModuleInstance = {
    checkAll: checkCoordinates
  };

  activeCleanup = () => {
    cells.forEach(c => c.replaceWith(c.cloneNode(true)));
    allChipBtns.forEach(b => b.replaceWith(b.cloneNode(true)));
  };
}
