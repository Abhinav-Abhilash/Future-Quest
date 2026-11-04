/**
 * Future Quest 2026 - BODMAS Decoder Puzzle Module
 * 
 * Handles Tile 3 (CODE THE FUTURE), Tile 5 (QUEST Anagram Tray),
 * and Tile 9 (SIGNAL Slotted Equations).
 */

import { showRewardPopup } from './popup.js';

let activeCleanup = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during bodmas unmount:', e);
    }
    activeCleanup = null;
  }
}

/**
 * Helper to map number (1..26) to letter (A..Z).
 */
function numToLetter(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 1 || n > 26) return '';
  return String.fromCharCode(64 + n);
}

/**
 * Format math expression string with clean unicode/superscripts.
 */
function formatMathExpr(raw) {
  return raw
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/\-/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mount(root, data, ctx) {
  unmount();

  const isLocked = ctx.isLocked();
  const saved = ctx.getProgress() || {};
  const entries = saved.entries || {}; // key -> number string
  const solvedGroups = new Set(saved.solvedGroups || []);
  const anagramSlots = saved.anagramSlots || [null, null, null, null, null]; // for Tile 5

  // Mini A-Z Reference Strip (A:1 .. Z:26)
  const azChips = Array.from({ length: 26 }, (_, i) => {
    const l = String.fromCharCode(65 + i);
    const n = i + 1;
    return `<span class="az-chip mono"><strong class="az-letter">${l}</strong><span class="az-num">${n}</span></span>`;
  }).join('');

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

  // Equations HTML
  // Can be grouped by words (Tile 3) or a flat list (Tile 5, Tile 9)
  let equationsHtml = '';

  if (data.groupedEquations) {
    // Tile 3: 3 words (CODE, THE, FUTURE)
    equationsHtml = data.groupedEquations.map((group, gIdx) => {
      const isGrpSolved = solvedGroups.has(gIdx);
      const rows = group.equations.map((eq, eIdx) => {
        const key = `g${gIdx}_e${eIdx}`;
        const val = entries[key] || '';
        const mappedLetter = numToLetter(val);
        return `
          <div class="bodmas-row ${isGrpSolved ? 'row-locked' : ''}" data-key="${key}">
            <div class="bodmas-expr mono">${formatMathExpr(eq.display || eq.expr)}</div>
            <div class="bodmas-eq-sign">=</div>
            <input 
              type="number" 
              class="bodmas-input mono" 
              data-group="${gIdx}"
              data-idx="${eIdx}"
              data-key="${key}"
              data-expected="${eq.expected}"
              data-letter="${eq.letter}"
              value="${val}"
              placeholder="?"
              ${isGrpSolved || isLocked ? 'disabled' : ''}
              min="1"
              max="99"
              aria-label="Result for equation ${eq.display || eq.expr}"
            />
            <div class="bodmas-mapped-letter mono" id="letter-${key}" aria-live="polite">
              ${mappedLetter || '&bull;'}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="bodmas-group-card ${isGrpSolved ? 'group-solved' : ''}" id="bodmas-group-${gIdx}">
          <div class="bodmas-group-header">
            <span class="bodmas-group-title">Word ${gIdx + 1}: ${group.name}</span>
            <span class="bodmas-group-status mono">${isGrpSolved ? 'SOLVED' : `${group.equations.length} letters`}</span>
          </div>
          <div class="bodmas-group-rows">${rows}</div>
        </div>
      `;
    }).join('');
  } else {
    // Flat equations (Tile 5 or Tile 9)
    const rows = (data.equations || []).map((eq, eIdx) => {
      const key = `e${eIdx}`;
      const val = entries[key] || '';
      const mappedLetter = numToLetter(val);
      const slotTag = eq.slot ? `<span class="slot-tag mono">Letter #${eq.slot}</span>` : '';
      return `
        <div class="bodmas-row" data-key="${key}">
          ${slotTag}
          <div class="bodmas-expr mono">${formatMathExpr(eq.display || eq.expr)}</div>
          <div class="bodmas-eq-sign">=</div>
          <input 
            type="number" 
            class="bodmas-input mono" 
            data-idx="${eIdx}"
            data-key="${key}"
            data-expected="${eq.expected}"
            data-letter="${eq.letter}"
            value="${val}"
            placeholder="?"
            ${isLocked ? 'disabled' : ''}
            min="1"
            max="99"
            aria-label="Result for equation ${eq.display || eq.expr}"
          />
          <div class="bodmas-mapped-letter mono" id="letter-${key}">
            ${mappedLetter || '&bull;'}
          </div>
        </div>
      `;
    }).join('');

    equationsHtml = `<div class="bodmas-flat-rows">${rows}</div>`;
  }

  // Anagram Tray for Tile 5
  let anagramHtml = '';
  if (data.hasAnagramTray) {
    const isTrayUnlocked = saved.trayUnlocked || solvedGroups.has(0);
    anagramHtml = `
      <div class="anagram-tray-card ${isTrayUnlocked ? 'unlocked' : 'locked'}" id="anagram-tray-container">
        <div class="anagram-header">
          <h3 class="anagram-title">Step 2: Anagram Word Assembly</h3>
          <span class="anagram-badge mono" id="anagram-badge">${isTrayUnlocked ? 'UNLOCKED' : 'Locked (solve equations first)'}</span>
        </div>
        <p class="anagram-instruction">Tap a tile to place it into the next empty slot below. Form the 5-letter target word.</p>

        <!-- Target Slots -->
        <div class="anagram-target-slots" role="region" aria-label="Target Letter Slots">
          ${[0, 1, 2, 3, 4].map(idx => `
            <button type="button" class="anagram-target-slot mono" data-slot-idx="${idx}" aria-label="Slot ${idx + 1}">
              ${anagramSlots[idx] || ''}
            </button>
          `).join('')}
        </div>

        <!-- Available Letter Tiles Tray -->
        <div class="anagram-available-tray" id="anagram-available-tray" role="region" aria-label="Available Letter Tiles">
          <!-- Populated dynamically -->
        </div>

        <div class="anagram-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-anagram-reset" ${!isTrayUnlocked || isLocked ? 'disabled' : ''}>
            Reset Slots
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-anagram-check" ${!isTrayUnlocked || isLocked ? 'disabled' : ''}>
            Check Anagram
          </button>
        </div>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="puzzle-interactive-module puzzle-bodmas" id="bodmas-module-root">
      <!-- Poster Slot Strip -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Decoded Poster Fragments:</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Mini A-Z Reference Strip -->
      <div class="bodmas-az-strip-wrapper" role="region" aria-label="A to Z Numerical Reference">
        <div class="az-strip-header">
          <span class="az-strip-label">Alphabet to Number Index (A=1 ... Z=26):</span>
        </div>
        <div class="bodmas-az-strip">${azChips}</div>
      </div>

      <!-- Equations Area -->
      <div class="bodmas-equations-area" role="region" aria-label="BODMAS Equations">
        ${equationsHtml}
      </div>

      <!-- Main Action Bar -->
      <div class="puzzle-action-bar">
        <button type="button" class="btn btn-primary" id="btn-bodmas-check" ${isLocked ? 'disabled' : ''}>
          Check Equations
        </button>
        <span class="action-note text-muted">Solve each equation using standard order of operations</span>
      </div>

      ${anagramHtml}
    </div>
  `;

  const moduleRoot = root.querySelector('#bodmas-module-root');
  const allInputs = Array.from(moduleRoot.querySelectorAll('.bodmas-input'));

  const persist = () => {
    ctx.saveProgress({
      entries,
      solvedGroups: Array.from(solvedGroups),
      anagramSlots,
      trayUnlocked: !!saved.trayUnlocked
    });
  };

  // Live letter mapping on input
  allInputs.forEach((inp, idx) => {
    inp.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const key = e.target.dataset.key;
      entries[key] = val;

      const letterBadge = moduleRoot.querySelector(`#letter-${key}`);
      if (letterBadge) {
        const letter = numToLetter(val);
        letterBadge.innerHTML = letter || '&bull;';
      }
      persist();
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Move to next input or check
        if (idx < allInputs.length - 1) {
          allInputs[idx + 1].focus();
        } else {
          checkEquations();
        }
      }
    });
  });

  // Anagram Tray Logic for Tile 5
  if (data.hasAnagramTray) {
    const renderTray = () => {
      const trayEl = moduleRoot.querySelector('#anagram-available-tray');
      if (!trayEl) return;
      trayEl.innerHTML = '';

      // All 5 letters: Q, U, E, S, T
      const letters = ['Q', 'U', 'E', 'S', 'T'];
      // Count used in slots
      const usedCounts = {};
      anagramSlots.forEach(ch => {
        if (ch) usedCounts[ch] = (usedCounts[ch] || 0) + 1;
      });

      letters.forEach(letter => {
        const used = usedCounts[letter] || 0;
        const available = 1 - used;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `anagram-tile mono ${available <= 0 ? 'tile-used' : ''}`;
        btn.textContent = letter;
        btn.disabled = available <= 0 || !saved.trayUnlocked || isLocked;

        btn.addEventListener('click', () => {
          // Place in first empty slot
          const emptyIdx = anagramSlots.indexOf(null);
          if (emptyIdx !== -1) {
            anagramSlots[emptyIdx] = letter;
            updateSlots();
            renderTray();
            persist();
          }
        });
        trayEl.appendChild(btn);
      });
    };

    const updateSlots = () => {
      const slotBtns = moduleRoot.querySelectorAll('.anagram-target-slot');
      slotBtns.forEach((btn, idx) => {
        btn.textContent = anagramSlots[idx] || '';
      });
    };

    // Slot click removes placed letter
    const slotBtns = moduleRoot.querySelectorAll('.anagram-target-slot');
    slotBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (anagramSlots[idx] && !isLocked && !solvedGroups.has(0)) {
          anagramSlots[idx] = null;
          updateSlots();
          renderTray();
          persist();
        }
      });
    });

    const resetBtn = moduleRoot.querySelector('#btn-anagram-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        for (let i = 0; i < 5; i++) anagramSlots[i] = null;
        updateSlots();
        renderTray();
        persist();
      });
    }

    const checkAnagramBtn = moduleRoot.querySelector('#btn-anagram-check');
    if (checkAnagramBtn) {
      checkAnagramBtn.addEventListener('click', () => {
        const word = anagramSlots.join('');
        if (word === 'QUEST') {
          // Solved!
          solvedGroups.add(0);
          const slotEl = moduleRoot.querySelector('#poster-slot-0');
          if (slotEl) {
            slotEl.classList.add('slot-filled');
            const content = slotEl.querySelector('.slot-content');
            if (content) content.textContent = 'QUEST';
          }
          showRewardPopup(root, 'QUEST');
          persist();
          ctx.onSolved();
        } else {
          // Wrong word
          checkAnagramBtn.classList.add('btn-wrong-shake');
          setTimeout(() => checkAnagramBtn.classList.remove('btn-wrong-shake'), 400);
          ctx.onWrongCheck();
        }
      });
    }

    renderTray();
    updateSlots();
  }

  // Verification
  const checkEquations = () => {
    let anyWrong = false;
    let firstWrongInput = null;

    if (data.groupedEquations) {
      // Tile 3: Check by group
      data.groupedEquations.forEach((group, gIdx) => {
        if (solvedGroups.has(gIdx)) return;

        let grpFilled = true;
        let grpMatches = true;
        const grpInputs = [];

        group.equations.forEach((eq, eIdx) => {
          const key = `g${gIdx}_e${eIdx}`;
          const input = moduleRoot.querySelector(`.bodmas-input[data-key="${key}"]`);
          grpInputs.push(input);
          const val = (entries[key] || '').trim();

          if (!val) {
            grpFilled = false;
          } else if (parseInt(val, 10) !== eq.expected) {
            grpMatches = false;
          }
        });

        if (grpFilled && grpMatches) {
          solvedGroups.add(gIdx);
          grpInputs.forEach(inp => { if (inp) inp.disabled = true; });
          const card = moduleRoot.querySelector(`#bodmas-group-${gIdx}`);
          if (card) {
            card.classList.add('group-solved');
            card.querySelector('.bodmas-group-status').textContent = 'SOLVED';
          }

          const slotEl = moduleRoot.querySelector(`#poster-slot-${gIdx}`);
          if (slotEl) {
            slotEl.classList.add('slot-filled');
            const content = slotEl.querySelector('.slot-content');
            if (content) content.textContent = group.solution || group.name;
          }
          showRewardPopup(root, group.solution || group.name);
        } else if (grpFilled && !grpMatches) {
          anyWrong = true;
          grpInputs.forEach(inp => {
            if (inp && parseInt(inp.value, 10) !== parseInt(inp.dataset.expected, 10)) {
              inp.classList.add('input-wrong');
              if (!firstWrongInput) firstWrongInput = inp;
            }
          });
        }
      });

      persist();

      if (solvedGroups.size === data.groupedEquations.length) {
        ctx.onSolved();
      }
    } else if (data.hasAnagramTray) {
      // Tile 5: Check 5 equations to unlock anagram tray
      let allEqsCorrect = true;
      allInputs.forEach(inp => {
        const val = parseInt(inp.value, 10);
        const expected = parseInt(inp.dataset.expected, 10);
        if (isNaN(val) || val !== expected) {
          allEqsCorrect = false;
          if (!isNaN(val)) {
            anyWrong = true;
            inp.classList.add('input-wrong');
            if (!firstWrongInput) firstWrongInput = inp;
          }
        }
      });

      if (allEqsCorrect) {
        saved.trayUnlocked = true;
        const trayCard = moduleRoot.querySelector('#anagram-tray-container');
        if (trayCard) {
          trayCard.classList.remove('locked');
          trayCard.classList.add('unlocked');
          trayCard.querySelector('#anagram-badge').textContent = 'UNLOCKED';
          const rBtn = trayCard.querySelector('#btn-anagram-reset');
          const cBtn = trayCard.querySelector('#btn-anagram-check');
          if (rBtn) rBtn.disabled = false;
          if (cBtn) cBtn.disabled = false;
        }
        allInputs.forEach(inp => inp.disabled = true);
        persist();
      }
    } else {
      // Tile 9: Flat equations mapping to slots (SIGNAL)
      let allFilled = true;
      let allCorrect = true;

      allInputs.forEach(inp => {
        const val = parseInt(inp.value, 10);
        const expected = parseInt(inp.dataset.expected, 10);
        if (isNaN(val)) {
          allFilled = false;
        } else if (val !== expected) {
          allCorrect = false;
          anyWrong = true;
          inp.classList.add('input-wrong');
          if (!firstWrongInput) firstWrongInput = inp;
        }
      });

      if (allFilled && allCorrect) {
        solvedGroups.add(0);
        allInputs.forEach(inp => inp.disabled = true);
        const slotEl = moduleRoot.querySelector('#poster-slot-0');
        if (slotEl) {
          slotEl.classList.add('slot-filled');
          const content = slotEl.querySelector('.slot-content');
          if (content) content.textContent = data.finalWord || 'SIGNAL';
        }
        showRewardPopup(root, data.finalWord || 'SIGNAL');
        persist();
        ctx.onSolved();
      }
    }

    if (anyWrong) {
      const wrongInputs = moduleRoot.querySelectorAll('.input-wrong');
      wrongInputs.forEach(inp => inp.classList.add('input-shake'));

      setTimeout(() => {
        wrongInputs.forEach(inp => {
          inp.classList.remove('input-shake');
          inp.classList.remove('input-wrong');
          inp.value = '';
          delete entries[inp.dataset.key];
          const letterBadge = moduleRoot.querySelector(`#letter-${inp.dataset.key}`);
          if (letterBadge) letterBadge.innerHTML = '&bull;';
        });
        if (firstWrongInput) firstWrongInput.focus();
        persist();
      }, 450);

      ctx.onWrongCheck();
    }
  };

  const checkBtn = moduleRoot.querySelector('#btn-bodmas-check');
  if (checkBtn) {
    checkBtn.addEventListener('click', checkEquations);
  }

  activeCleanup = () => {
    allInputs.forEach(inp => inp.replaceWith(inp.cloneNode(true)));
  };
}
