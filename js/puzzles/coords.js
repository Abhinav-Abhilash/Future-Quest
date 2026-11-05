/**
 * Future Quest 2026 - Coordinates Grid Puzzle Module
 * 
 * Upgraded UX:
 * - Touch targets >= 40-44px (min(44px, calc((100vw - 48px) / 8))).
 * - Sweeping crosshair bars on hover/focus (thin horizontal and vertical bars moving via transform, 120ms).
 * - Axis headers turning blue when hovered/focused.
 * - Reticle mark (SVG from art.js) on selected cell; FLIP animation from cell to active chip slot.
 * - T6 (Route Tracer): start cell (1, 7) renders pawn SVG. Dashed route segments drawn on SVG overlay.
 *   On solve, pawn animates along route (350ms per leg) and spells BYTE.
 * - T10 (CYBER): Cartesian row label "Row 1 is the BOTTOM ↑". For active coordinate chip,
 *   live X/Y input coordinate tracking.
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
      const isStartCell = data.isRouteTracer && colNum === 1 && rowNum === 7;
      gridCellsHtml += `
        <button 
          type="button" 
          class="coord-cell keycap mono ${isStartCell ? 'cell-route-start' : ''}" 
          data-col="${colNum}" 
          data-row="${rowNum}" 
          data-r-idx="${rIdx}" 
          data-c-idx="${cIdx}"
          data-char="${char}"
          id="coord-cell-${colNum}-${rowNum}"
          aria-label="Col ${colNum}, Row ${rowNum}: ${char}"
        >
          <span class="coord-cell-char">${char}</span>
          ${isStartCell ? `<span class="cell-pawn-token" id="route-pawn-token">${PUZZLE_ART.pawn}</span>` : ''}
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
    // Tile 6: Route instructions & legs list
    chipsAreaHtml = `
      <div class="route-tracer-panel" role="region" aria-label="Route Legs">
        <div class="route-panel-header">
          <h3 class="route-panel-title">Trace the Secret Path</h3>
          <span class="route-panel-badge mono">${routeLegsCompleted} of ${(data.legs || []).length} legs</span>
        </div>
        <p class="route-hint-text">
          Start at <strong>(1, 7) [B]</strong> and click each destination point in order.
        </p>
        <ol class="route-legs-list">
          ${(data.legs || []).map((leg, idx) => `
            <li class="route-leg-item ${routeLegsCompleted > idx ? 'leg-done' : (routeLegsCompleted === idx ? 'leg-active' : '')}" id="route-leg-${idx}">
              <div class="leg-step-badge mono">Step ${idx + 1}</div>
              <div class="leg-desc-block">
                <span class="leg-desc">${leg.desc}</span>
                <span class="leg-target-hint mono">Target letter: [${leg.letter}]</span>
              </div>
              <span class="leg-status mono">${routeLegsCompleted > idx ? 'REACHED' : (routeLegsCompleted === idx ? 'NEXT' : 'LOCKED')}</span>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  } else if (data.groupedChips) {
    // Tile 2: Multi-word coordinate chips (LEARN, BUILD, LEAD)
    chipsAreaHtml = data.groupedChips.map((grp, gIdx) => {
      const isGrpSolved = solvedGroups.has(gIdx);
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
            ${isGrpSolved || isLocked ? 'disabled' : ''}
            aria-label="Word ${gIdx + 1} letter ${cIdx + 1}, coordinate (${pair[0]}, ${pair[1]})"
          >
            <span class="chip-coords mono">(${pair[0]},${pair[1]})</span>
            <span class="chip-letter mono">${letter || '&bull;'}</span>
          </button>
        `;
      }).join('');

      return `
        <div class="coord-word-group ${isGrpSolved ? 'group-solved' : ''}" id="coord-group-${gIdx}">
          <div class="coord-group-header">
            <div class="coord-group-title">
              <span class="coord-group-name">Word ${gIdx + 1} (${grp.coords.length} letters)</span>
              <span class="coord-group-status mono">${isGrpSolved ? 'SOLVED' : `${grp.coords.length} letters`}</span>
            </div>
            ${!isGrpSolved && !isLocked ? `
              <button type="button" class="btn-group-clear" data-group="${gIdx}" aria-label="Clear Word ${gIdx + 1}">Clear</button>
            ` : ''}
          </div>
          <div class="coord-chips-row">${chips}</div>
        </div>
      `;
    }).join('');
  } else if (data.mathCoords) {
    // Tile 10: Cartesian BODMAS Hybrid (CYBER)
    const isGrpSolved = solvedGroups.has(0);
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
          ${isGrpSolved || isLocked ? 'disabled' : ''}
          aria-label="Coordinate ${item.expr}, target (${item.col}, ${item.row})"
        >
          <span class="chip-math mono">${item.expr}</span>
          <span class="chip-coords mono">(${item.col},${item.row})</span>
          <span class="chip-letter mono">${letter || '&bull;'}</span>
        </button>
      `;
    }).join('');

    chipsAreaHtml = `
      <div class="coord-word-group ${isGrpSolved ? 'group-solved' : ''}" id="coord-group-0">
        <div class="coord-group-header">
          <div class="coord-group-title">
            <span class="coord-group-name">Target Word (${data.mathCoords.length} letters)</span>
            <span class="coord-group-status mono">${isGrpSolved ? 'SOLVED' : 'IN PROGRESS'}</span>
          </div>
          ${!isGrpSolved && !isLocked ? `
            <button type="button" class="btn-group-clear" data-group="0" aria-label="Clear Target Word">Clear</button>
          ` : ''}
        </div>
        <div class="coord-chips-row">${chips}</div>
        <div class="coord-cartesian-helper">
          <span class="helper-label mono">Live Coordinate Selector:</span>
          <div class="helper-inputs">
            <label class="helper-field">
              <span class="mono">Col (X):</span>
              <input type="number" min="1" max="7" id="cartesian-input-x" class="keycap mono helper-input" value="1" />
            </label>
            <label class="helper-field">
              <span class="mono">Row (Y):</span>
              <input type="number" min="1" max="7" id="cartesian-input-y" class="keycap mono helper-input" value="1" />
            </label>
            <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-helper-jump">Select Cell</button>
          </div>
        </div>
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
              
              <!-- 7x7 Grid with route overlay -->
              <div class="coords-grid-stage" id="coords-grid-stage">
                ${data.isRouteTracer ? `
                  <svg class="coords-route-svg-overlay" id="coords-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <marker id="route-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--module-accent, #14B8A6)"/>
                      </marker>
                    </defs>
                    <g id="route-segments-group"></g>
                  </svg>
                ` : ''}

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

  // Route tracer line rendering
  const renderRouteSegments = () => {
    if (!data.isRouteTracer || !routeSvgGroup) return;
    routeSvgGroup.innerHTML = '';

    const waypoints = [
      { col: 1, row: 7 } // start
    ];

    for (let i = 0; i < routeLegsCompleted; i++) {
      const leg = data.legs[i];
      waypoints.push({ col: leg.targetCol, row: leg.targetRow });
    }

    // Helper: convert (col 1..7, row 1..7) to SVG % (0..100)
    const toSvgCoords = (col, row) => {
      // 7 columns: centers are at (col - 0.5) / 7 * 100%
      // In top-to-bottom grid (Tile 6): row 1 is top, row 7 is bottom
      const x = ((col - 0.5) / 7) * 100;
      const y = ((row - 0.5) / 7) * 100;
      return { x, y };
    };

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = toSvgCoords(waypoints[i].col, waypoints[i].row);
      const p2 = toSvgCoords(waypoints[i + 1].col, waypoints[i + 1].row);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
      line.setAttribute('stroke', 'var(--module-accent, #14B8A6)');
      line.setAttribute('stroke-width', '2.5');
      line.setAttribute('stroke-dasharray', '4 2');
      line.setAttribute('marker-end', 'url(#route-arrow)');
      routeSvgGroup.appendChild(line);
    }
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

    // Keyboard navigation in 7x7 grid
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

  // Tile 6: Route Tracer logic
  const handleRouteCellClick = (cell) => {
    const targetLeg = data.legs[routeLegsCompleted];
    if (!targetLeg) return;

    const clickedCol = parseInt(cell.dataset.col, 10);
    const clickedRow = parseInt(cell.dataset.row, 10);

    if (clickedCol === targetLeg.targetCol && clickedRow === targetLeg.targetRow) {
      // Correct leg reached!
      routeLegsCompleted++;
      cell.classList.add('cell-path-hit');

      // Update leg item in list
      const legEl = moduleRoot.querySelector(`#route-leg-${routeLegsCompleted - 1}`);
      if (legEl) {
        legEl.classList.remove('leg-active');
        legEl.classList.add('leg-done');
        legEl.querySelector('.leg-status').textContent = 'REACHED';
      }

      if (routeLegsCompleted < data.legs.length) {
        const nextLegEl = moduleRoot.querySelector(`#route-leg-${routeLegsCompleted}`);
        if (nextLegEl) {
          nextLegEl.classList.add('leg-active');
          nextLegEl.querySelector('.leg-status').textContent = 'NEXT';
        }
      }

      renderRouteSegments();
      persist();

      // Check if all legs complete
      if (routeLegsCompleted === data.legs.length) {
        // Animate pawn traversing route (350ms per leg)
        animateRoutePawnSolve(() => {
          solvedGroups.add(0);
          const slotEl = moduleRoot.querySelector('#poster-slot-0');
          if (slotEl) {
            slotEl.classList.add('slot-filled', 'slot-stamped');
            const content = slotEl.querySelector('.slot-content');
            if (content) content.textContent = 'BYTE';
          }
          showRewardPopup(root, 'BYTE');
          persist();
          ctx.onSolved();
        });
      }
    } else {
      // Wrong cell clicked
      cell.classList.add('cell-wrong-shake');
      playWrongFeedback(cell);
      setTimeout(() => cell.classList.remove('cell-wrong-shake'), 400);
      ctx.onWrongCheck();
    }
  };

  // Solve animation for Tile 6: Pawn glides along waypoints
  const animateRoutePawnSolve = (onComplete) => {
    const pawnToken = moduleRoot.querySelector('#route-pawn-token');
    if (!pawnToken || isReducedMotion()) {
      onComplete();
      return;
    }

    const waypoints = [
      { col: 1, row: 7 },
      ...data.legs.map(l => ({ col: l.targetCol, row: l.targetRow }))
    ];

    let currentStep = 0;
    const moveNext = () => {
      if (currentStep >= waypoints.length - 1) {
        onComplete();
        return;
      }

      const fromWp = waypoints[currentStep];
      const toWp = waypoints[currentStep + 1];
      const fromCell = moduleRoot.querySelector(`#coord-cell-${fromWp.col}-${fromWp.row}`);
      const toCell = moduleRoot.querySelector(`#coord-cell-${toWp.col}-${toWp.row}`);

      if (fromCell && toCell) {
        const fromRect = fromCell.getBoundingClientRect();
        const toRect = toCell.getBoundingClientRect();
        const deltaX = toRect.left - fromRect.left;
        const deltaY = toRect.top - fromRect.top;

        pawnToken.style.transition = 'transform 350ms cubic-bezier(0.2, 0, 0, 1)';
        pawnToken.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        setTimeout(() => {
          toCell.appendChild(pawnToken);
          pawnToken.style.transition = 'none';
          pawnToken.style.transform = 'none';
          currentStep++;
          setTimeout(moveNext, 50);
        }, 360);
      } else {
        currentStep++;
        moveNext();
      }
    };

    moveNext();
  };

  // Chip buttons click (Tile 2 & 10)
  allChipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      allChipBtns.forEach(b => b.classList.remove('chip-active'));
      btn.classList.add('chip-active');
      activeChipKey = btn.dataset.key;
      persist();
    });
  });

  // Handle cell click filling into active chip
  const handleCoordCellClick = (cell) => {
    let chip = null;
    if (activeChipKey) {
      chip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${activeChipKey}"]`);
    }

    if (!chip) {
      chip = allChipBtns.find(b => b.dataset.col === cell.dataset.col && b.dataset.row === cell.dataset.row && !entries[b.dataset.key]) ||
             allChipBtns.find(b => !entries[b.dataset.key]);
    }

    if (chip && !chip.disabled) {
      const key = chip.dataset.key;
      const char = cell.dataset.char;

      animateFlyLetter(cell, chip, char, () => {
        entries[key] = char;
        const letterSpan = chip.querySelector('.chip-letter');
        if (letterSpan) letterSpan.textContent = char;
        chip.classList.add('chip-filled');

        // Auto advance to next chip
        const currIdx = allChipBtns.indexOf(chip);
        allChipBtns.forEach(b => b.classList.remove('chip-active'));
        if (currIdx < allChipBtns.length - 1) {
          const nextChip = allChipBtns[currIdx + 1];
          nextChip.classList.add('chip-active');
          activeChipKey = nextChip.dataset.key;
        } else {
          activeChipKey = null;
        }

        persist();
      });
    }
  };

  // Tile 10 Cartesian helper Jump button
  const jumpBtn = moduleRoot.querySelector('#btn-helper-jump');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      const inputX = moduleRoot.querySelector('#cartesian-input-x');
      const inputY = moduleRoot.querySelector('#cartesian-input-y');
      const col = parseInt(inputX.value, 10);
      const row = parseInt(inputY.value, 10);
      if (col >= 1 && col <= 7 && row >= 1 && row <= 7) {
        const cell = moduleRoot.querySelector(`#coord-cell-${col}-${row}`);
        if (cell) cell.click();
      }
    });
  }

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

  // Verification
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
          const grpEl = moduleRoot.querySelector(`#coord-group-${gIdx}`);
          if (grpEl) {
            grpEl.classList.add('group-solved');
            const statusEl = grpEl.querySelector('.coord-group-status');
            if (statusEl) statusEl.textContent = 'SOLVED';
          }
        });
        allChipBtns.forEach(c => { if (c) c.disabled = true; });
        persist();
        if (ctx.onSolved) ctx.onSolved(res);
      } else {
        allChipBtns.forEach(c => {
          c.classList.add('chip-wrong');
          setTimeout(() => c.classList.remove('chip-wrong'), 500);
        });
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
        allChipBtns.forEach(c => {
          c.classList.add('chip-wrong');
          setTimeout(() => c.classList.remove('chip-wrong'), 500);
        });
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

  // Initial state restoration
  if (data.isRouteTracer) {
    renderRouteSegments();
    for (let i = 0; i < routeLegsCompleted; i++) {
      const leg = data.legs[i];
      const hitCell = cells.find(c => parseInt(c.dataset.col, 10) === leg.targetCol && parseInt(c.dataset.row, 10) === leg.targetRow);
      if (hitCell) hitCell.classList.add('cell-path-hit');
    }
  }

  activeCleanup = () => {
    cells.forEach(c => c.replaceWith(c.cloneNode(true)));
    allChipBtns.forEach(b => b.replaceWith(b.cloneNode(true)));
  };
}
