/**
 * Future Quest 2026 - Coordinates Grid Puzzle Module
 * 
 * Handles Tile 2 (LEARN, BUILD, LEAD), Tile 6 (Route Tracer BYTE),
 * and Tile 10 (Cartesian BODMAS Hybrid CYBER).
 */

import { showRewardPopup } from './popup.js';

let activeCleanup = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during coords unmount:', e);
    }
    activeCleanup = null;
  }
}

export function mount(root, data, ctx) {
  unmount();

  const isLocked = ctx.isLocked();
  const saved = ctx.getProgress() || {};
  const entries = saved.entries || {}; // chip key -> letter
  const solvedGroups = new Set(saved.solvedGroups || []);
  let activeChipKey = saved.activeChipKey || null;
  let routeLegsCompleted = saved.routeLegsCompleted || 0; // for Tile 6

  // Poster strip
  const posterGroups = data.groups || [];
  const posterSlotsHtml = posterGroups.map((grpName, idx) => {
    const isGrpSolved = solvedGroups.has(idx);
    const displayText = isGrpSolved ? (data.groupSolutions ? data.groupSolutions[idx] : grpName) : '';
    return `
      <div class="poster-slot ${isGrpSolved ? 'slot-filled' : ''}" id="poster-slot-${idx}" data-index="${idx}">
        <span class="slot-label">${grpName}</span>
        <span class="slot-content mono">${displayText}</span>
      </div>
    `;
  }).join('');

  // Determine row numbering:
  // Tile 10 uses bottom-to-top rows 1..7 (Cartesian), Tile 2 & 6 use top-to-bottom 1..7
  const isBottomUp = !!data.isBottomUp;
  const rowLabels = isBottomUp ? [7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7];
  const colLabels = [1, 2, 3, 4, 5, 6, 7];

  // Grid letters matrix: 7x7
  // data.grid is array of 7 rows (top to bottom as displayed on screen)
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
          class="coord-cell mono" 
          data-col="${colNum}" 
          data-row="${rowNum}" 
          data-r-idx="${rIdx}" 
          data-c-idx="${cIdx}"
          data-char="${char}"
          aria-label="Col ${colNum}, Row ${rowNum}: ${char}"
        >
          ${char}
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

  // Words/Chips Area
  let chipsAreaHtml = '';

  if (data.isRouteTracer) {
    // Tile 6: Route instructions & Legs list
    chipsAreaHtml = `
      <div class="route-tracer-panel" role="region" aria-label="Route Legs">
        <h3 class="route-panel-title">Trace the Secret Path:</h3>
        <p class="route-hint-text">Start at <strong>(1, 7) [B]</strong> and click each destination point in order.</p>
        <ol class="route-legs-list">
          ${(data.legs || []).map((leg, idx) => `
            <li class="route-leg-item ${routeLegsCompleted > idx ? 'leg-done' : (routeLegsCompleted === idx ? 'leg-active' : '')}" id="route-leg-${idx}">
              <span class="leg-step mono">Step ${idx + 1}</span>
              <span class="leg-desc">${leg.desc}</span>
              <span class="leg-status mono">${routeLegsCompleted > idx ? 'REACHED' : 'PENDING'}</span>
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
            class="coord-chip-btn ${isPairActive ? 'chip-active' : ''} ${letter ? 'chip-filled' : ''}" 
            data-key="${key}"
            data-col="${pair[0]}"
            data-row="${pair[1]}"
            data-expected-char="${pair[2]}"
            ${isGrpSolved || isLocked ? 'disabled' : ''}
          >
            <span class="chip-coords mono">(${pair[0]},${pair[1]})</span>
            <span class="chip-letter mono">${letter || '&bull;'}</span>
          </button>
        `;
      }).join('');

      return `
        <div class="coord-word-group ${isGrpSolved ? 'group-solved' : ''}" id="coord-group-${gIdx}">
          <div class="coord-group-header">
            <span class="coord-group-name">Word ${gIdx + 1}: ${grp.name}</span>
            <span class="coord-group-status mono">${isGrpSolved ? 'SOLVED' : `${grp.coords.length} letters`}</span>
          </div>
          <div class="coord-chips-row">${chips}</div>
        </div>
      `;
    }).join('');
  } else if (data.mathCoords) {
    // Tile 10: Math expression coordinates (CYBER)
    const isGrpSolved = solvedGroups.has(0);
    const chips = data.mathCoords.map((item, idx) => {
      const key = `c${idx}`;
      const letter = entries[key] || '';
      const isPairActive = activeChipKey === key;
      return `
        <button 
          type="button" 
          class="coord-chip-btn ${isPairActive ? 'chip-active' : ''} ${letter ? 'chip-filled' : ''}" 
          data-key="${key}"
          data-col="${item.col}"
          data-row="${item.row}"
          data-expected-char="${item.letter}"
          ${isGrpSolved || isLocked ? 'disabled' : ''}
        >
          <span class="chip-math mono">${item.expr}</span>
          <span class="chip-coords mono">(${item.col},${item.row})</span>
          <span class="chip-letter mono">${letter || '&bull;'}</span>
        </button>
      `;
    }).join('');

    chipsAreaHtml = `
      <div class="coord-word-group ${isGrpSolved ? 'group-solved' : ''}">
        <div class="coord-group-header">
          <span class="coord-group-name">Target Word (${data.mathCoords.length} letters)</span>
          <span class="coord-group-status mono">${isGrpSolved ? 'SOLVED' : 'IN PROGRESS'}</span>
        </div>
        <div class="coord-chips-row">${chips}</div>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="puzzle-interactive-module puzzle-coords ${isBottomUp ? 'coords-cartesian' : ''}" id="coords-module-root">
      <!-- Poster Slot Strip -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Decoded Poster Fragments:</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Main Coordinates Interactive Area -->
      <div class="coords-layout">
        <div class="coords-grid-wrapper" role="region" aria-label="7 by 7 Coordinates Grid">
          <div class="coord-axis-note text-muted">
            ${isBottomUp ? 'Cartesian Grid: Row 1 is at the bottom, Row 7 is at the top.' : 'Grid Coordinates: (Column, Row) from top-left.'}
          </div>

          <div class="coords-table-container">
            <!-- Top Column Headers -->
            <div class="coords-col-headers">${colHeadersHtml}</div>
            
            <div class="coords-row-and-cells">
              <!-- Left Row Headers -->
              <div class="coords-row-headers">${rowHeadersHtml}</div>
              <!-- 7x7 Cells -->
              <div class="coords-grid" id="coords-cells-grid" role="grid">${gridCellsHtml}</div>
            </div>
          </div>
        </div>

        <!-- Chips / Clues Section -->
        <div class="coords-controls-column">
          ${chipsAreaHtml}

          ${!data.isRouteTracer ? `
            <div class="puzzle-action-bar">
              <button type="button" class="btn btn-primary" id="btn-coords-check" ${isLocked ? 'disabled' : ''}>
                Check Coordinates
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const moduleRoot = root.querySelector('#coords-module-root');
  const cells = Array.from(moduleRoot.querySelectorAll('.coord-cell'));
  const colHeaders = Array.from(moduleRoot.querySelectorAll('.coord-header-col'));
  const rowHeaders = Array.from(moduleRoot.querySelectorAll('.coord-header-row'));
  const allChipBtns = Array.from(moduleRoot.querySelectorAll('.coord-chip-btn'));

  const persist = () => {
    ctx.saveProgress({
      entries,
      solvedGroups: Array.from(solvedGroups),
      activeChipKey,
      routeLegsCompleted
    });
  };

  // Crosshair Highlight logic
  const highlightCrosshair = (col, row) => {
    colHeaders.forEach(ch => ch.classList.toggle('header-active', ch.dataset.col === String(col)));
    rowHeaders.forEach(rh => rh.classList.toggle('header-active', rh.dataset.row === String(row)));
    cells.forEach(cell => {
      const isCross = cell.dataset.col === String(col) || cell.dataset.row === String(row);
      const isTarget = cell.dataset.col === String(col) && cell.dataset.row === String(row);
      cell.classList.toggle('cell-crosshair', isCross);
      cell.classList.toggle('cell-focused', isTarget);
    });
  };

  const clearCrosshair = () => {
    colHeaders.forEach(ch => ch.classList.remove('header-active'));
    rowHeaders.forEach(rh => rh.classList.remove('header-active'));
    cells.forEach(cell => {
      cell.classList.remove('cell-crosshair');
      cell.classList.remove('cell-focused');
    });
  };

  cells.forEach((cell, idx) => {
    cell.addEventListener('mouseenter', () => {
      highlightCrosshair(cell.dataset.col, cell.dataset.row);
    });

    cell.addEventListener('mouseleave', () => {
      if (activeChipKey) {
        const activeChip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${activeChipKey}"]`);
        if (activeChip) {
          highlightCrosshair(activeChip.dataset.col, activeChip.dataset.row);
          return;
        }
      }
      clearCrosshair();
    });

    cell.addEventListener('focus', () => {
      highlightCrosshair(cell.dataset.col, cell.dataset.row);
    });

    // Cell Click
    cell.addEventListener('click', () => {
      if (isLocked) return;

      if (data.isRouteTracer) {
        // Tile 6 Route tracer click logic
        handleRouteCellClick(cell);
      } else {
        // Tile 2 or Tile 10: Fill into active chip or matching chip
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

  // Tile 6 Route Tracer handling
  const handleRouteCellClick = (cell) => {
    const targetLeg = data.legs[routeLegsCompleted];
    if (!targetLeg) return;

    const clickedCol = parseInt(cell.dataset.col, 10);
    const clickedRow = parseInt(cell.dataset.row, 10);

    if (clickedCol === targetLeg.targetCol && clickedRow === targetLeg.targetRow) {
      // Correct leg reached!
      routeLegsCompleted++;
      cell.classList.add('cell-path-hit');

      // Update leg item
      const legEl = moduleRoot.querySelector(`#route-leg-${routeLegsCompleted - 1}`);
      if (legEl) {
        legEl.classList.remove('leg-active');
        legEl.classList.add('leg-done');
        legEl.querySelector('.leg-status').textContent = 'REACHED';
      }

      if (routeLegsCompleted < data.legs.length) {
        const nextLegEl = moduleRoot.querySelector(`#route-leg-${routeLegsCompleted}`);
        if (nextLegEl) nextLegEl.classList.add('leg-active');
      }

      persist();

      // Check if all legs completed
      if (routeLegsCompleted === data.legs.length) {
        // Solved BYTE!
        solvedGroups.add(0);
        const slotEl = moduleRoot.querySelector('#poster-slot-0');
        if (slotEl) {
          slotEl.classList.add('slot-filled');
          const content = slotEl.querySelector('.slot-content');
          if (content) content.textContent = 'BYTE';
        }
        showRewardPopup(root, 'BYTE');
        persist();
        ctx.onSolved();
      }
    } else {
      // Wrong cell clicked for route
      cell.classList.add('cell-wrong-shake');
      setTimeout(() => cell.classList.remove('cell-wrong-shake'), 400);
      ctx.onWrongCheck();
    }
  };

  // Chip buttons click (Tile 2 & Tile 10)
  allChipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      allChipBtns.forEach(b => b.classList.remove('chip-active'));
      btn.classList.add('chip-active');
      activeChipKey = btn.dataset.key;
      highlightCrosshair(btn.dataset.col, btn.dataset.row);
      persist();
    });
  });

  // Click cell to fill into chip
  const handleCoordCellClick = (cell) => {
    let chip = null;
    if (activeChipKey) {
      chip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${activeChipKey}"]`);
    }

    // If no active chip, find first empty chip matching coordinates or first empty chip
    if (!chip) {
      chip = allChipBtns.find(b => b.dataset.col === cell.dataset.col && b.dataset.row === cell.dataset.row && !entries[b.dataset.key]) ||
             allChipBtns.find(b => !entries[b.dataset.key]);
    }

    if (chip && !chip.disabled) {
      const key = chip.dataset.key;
      const char = cell.dataset.char;
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
        highlightCrosshair(nextChip.dataset.col, nextChip.dataset.row);
      } else {
        activeChipKey = null;
      }

      persist();
    }
  };

  // Verification for Tile 2 & Tile 10
  const checkCoordinates = () => {
    let anyWrong = false;
    let firstWrongChip = null;

    if (data.groupedChips) {
      // Tile 2: Check by group (LEARN, BUILD, LEAD)
      data.groupedChips.forEach((grp, gIdx) => {
        if (solvedGroups.has(gIdx)) return;

        let grpFilled = true;
        let grpMatches = true;
        const grpChips = [];

        grp.coords.forEach((pair, cIdx) => {
          const key = `g${gIdx}_c${cIdx}`;
          const chip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${key}"]`);
          grpChips.push(chip);
          const entered = entries[key] || '';
          const expected = pair[2];

          if (!entered) {
            grpFilled = false;
          } else if (entered !== expected) {
            grpMatches = false;
          }
        });

        if (grpFilled && grpMatches) {
          solvedGroups.add(gIdx);
          grpChips.forEach(c => { if (c) c.disabled = true; });

          const grpEl = moduleRoot.querySelector(`#coord-group-${gIdx}`);
          if (grpEl) {
            grpEl.classList.add('group-solved');
            grpEl.querySelector('.coord-group-status').textContent = 'SOLVED';
          }

          const slotEl = moduleRoot.querySelector(`#poster-slot-${gIdx}`);
          if (slotEl) {
            slotEl.classList.add('slot-filled');
            const content = slotEl.querySelector('.slot-content');
            if (content) content.textContent = grp.name;
          }
          showRewardPopup(root, grp.name);
        } else if (grpFilled && !grpMatches) {
          anyWrong = true;
          grpChips.forEach(chip => {
            if (chip && entries[chip.dataset.key] !== chip.dataset.expectedChar) {
              chip.classList.add('chip-wrong');
              if (!firstWrongChip) firstWrongChip = chip;
            }
          });
        }
      });

      persist();

      if (solvedGroups.size === data.groupedChips.length) {
        ctx.onSolved();
      }
    } else if (data.mathCoords) {
      // Tile 10: Check CYBER
      let allFilled = true;
      let allMatches = true;

      allChipBtns.forEach(chip => {
        const entered = entries[chip.dataset.key] || '';
        const expected = chip.dataset.expectedChar;
        if (!entered) {
          allFilled = false;
        } else if (entered !== expected) {
          allMatches = false;
          anyWrong = true;
          chip.classList.add('chip-wrong');
          if (!firstWrongChip) firstWrongChip = chip;
        }
      });

      if (allFilled && allMatches) {
        solvedGroups.add(0);
        allChipBtns.forEach(c => c.disabled = true);
        const slotEl = moduleRoot.querySelector('#poster-slot-0');
        if (slotEl) {
          slotEl.classList.add('slot-filled');
          const content = slotEl.querySelector('.slot-content');
          if (content) content.textContent = data.finalWord || 'CYBER';
        }
        showRewardPopup(root, data.finalWord || 'CYBER');
        persist();
        ctx.onSolved();
      }
    }

    if (anyWrong) {
      const wrongChips = moduleRoot.querySelectorAll('.chip-wrong');
      wrongChips.forEach(c => c.classList.add('chip-shake'));

      setTimeout(() => {
        wrongChips.forEach(c => {
          c.classList.remove('chip-shake');
          c.classList.remove('chip-wrong');
          c.classList.remove('chip-filled');
          const span = c.querySelector('.chip-letter');
          if (span) span.innerHTML = '&bull;';
          delete entries[c.dataset.key];
        });
        if (firstWrongChip) {
          firstWrongChip.click();
        }
        persist();
      }, 450);

      ctx.onWrongCheck();
    }
  };

  const checkBtn = moduleRoot.querySelector('#btn-coords-check');
  if (checkBtn) {
    checkBtn.addEventListener('click', checkCoordinates);
  }

  // Initial highlight if chip is active
  if (activeChipKey) {
    const activeChip = moduleRoot.querySelector(`.coord-chip-btn[data-key="${activeChipKey}"]`);
    if (activeChip) highlightCrosshair(activeChip.dataset.col, activeChip.dataset.row);
  }

  // If Route Tracer already had hits on remount
  if (data.isRouteTracer && routeLegsCompleted > 0) {
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
