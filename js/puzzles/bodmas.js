/**
 * Future Quest 2026 - BODMAS Decoder Puzzle Module
 * 
 * Upgraded UX:
 * - Calculator-style cards with real superscripts, large typeset expressions, and flipping letter bays.
 * - Horizontal A-Z numerical scale strip where active key lifts 2px and turns blue.
 * - T3: Letter cards fly into the 13-slot message strip (FLIP).
 * - T5: Pointer-draggable anagram tiles with spring-back and snap/pulse slot dropping.
 * - T9: Vault-style 6-slot row matching equation slot badges.
 * - Group lock FLIP animations, tactile error vibrations, and per-group Clear buttons.
 */

import { animateGroupLock, playWrongFeedback, isReducedMotion } from './popup.js';

let activeCleanup = null;
let activeModuleInstance = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during bodmas unmount:', e);
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

function numToLetter(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 1 || n > 26) return '';
  return String.fromCharCode(64 + n);
}

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
  const entries = saved.entries || {};
  const solvedGroups = new Set(saved.solvedGroups || []);
  const anagramSlots = saved.anagramSlots || [null, null, null, null, null];

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

  // 26-Key A-Z Horizontal Scale Strip
  const azChips = Array.from({ length: 26 }, (_, i) => {
    const l = String.fromCharCode(65 + i);
    const n = i + 1;
    return `
      <div class="az-scale-key mono" id="az-key-${n}" data-num="${n}" data-letter="${l}">
        <span class="az-key-letter">${l}</span>
        <span class="az-key-num">${n}</span>
      </div>
    `;
  }).join('');

  // Equations Markup (Grouped or Flat)
  let equationsHtml = '';

  if (data.groupedEquations) {
    // T3: 3 Words (CODE, THE, FUTURE)
    equationsHtml = data.groupedEquations.map((group, gIdx) => {
      const isGrpSolved = solvedGroups.has(gIdx);
      const cards = group.equations.map((eq, eIdx) => {
        const key = `g${gIdx}_e${eIdx}`;
        const val = entries[key] || '';
        const letter = numToLetter(val);
        return `
          <div class="bodmas-calc-card ${isGrpSolved ? 'calc-card-locked' : ''}" data-key="${key}">
            <div class="calc-expr-box mono">${formatMathExpr(eq.display || eq.expr)}</div>
            <div class="calc-input-row">
              <span class="calc-equal mono">=</span>
              <input 
                type="text" 
                inputmode="numeric" 
                pattern="[0-9]*" 
                enterkeyhint="next" 
                class="bodmas-keycap-input mono" 
                data-group="${gIdx}"
                data-idx="${eIdx}"
                data-key="${key}"
                value="${val}"
                placeholder="?"
                ${isGrpSolved || isLocked ? 'disabled' : ''}
                aria-label="Result for equation ${eq.display || eq.expr}"
              />
              <div class="letter-bay">
                <div class="letter-bay-flipper ${letter ? 'flipped' : ''}">
                  <span class="bay-letter mono" id="letter-${key}">${letter || '?'}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="bodmas-group-panel ${isGrpSolved ? 'group-locked' : ''}" id="bodmas-group-${gIdx}">
          <div class="bodmas-panel-header">
            <span class="bodmas-panel-title mono">Word ${gIdx + 1}: ${group.name}</span>
            ${!isGrpSolved && !isLocked ? `
              <button type="button" class="btn-group-clear keycap-btn" data-group="${gIdx}">Clear</button>
            ` : ''}
          </div>
          <div class="bodmas-calc-grid">${cards}</div>
        </div>
      `;
    }).join('');
  } else {
    // Flat Equations (T5, T9)
    const cards = (data.equations || []).map((eq, eIdx) => {
      const key = `e${eIdx}`;
      const val = entries[key] || '';
      const letter = numToLetter(val);
      const slotBadge = eq.slot ? `<span class="calc-slot-badge mono">Slot #${eq.slot}</span>` : '';
      return `
        <div class="bodmas-calc-card" data-key="${key}">
          <div class="calc-card-header">
            ${slotBadge}
            <div class="calc-expr-box mono">${formatMathExpr(eq.display || eq.expr)}</div>
          </div>
          <div class="calc-input-row">
            <span class="calc-equal mono">=</span>
            <input 
              type="text" 
              inputmode="numeric" 
              pattern="[0-9]*" 
              enterkeyhint="next" 
              class="bodmas-keycap-input mono" 
              data-idx="${eIdx}"
              data-key="${key}"
              value="${val}"
              placeholder="?"
              ${isLocked ? 'disabled' : ''}
              aria-label="Result for equation ${eq.display || eq.expr}"
            />
            <div class="letter-bay">
              <div class="letter-bay-flipper ${letter ? 'flipped' : ''}">
                <span class="bay-letter mono" id="letter-${key}">${letter || '?'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // T9 Vault Row header
    const vaultRowHtml = data.finalWord === 'SIGNAL' ? `
      <div class="signal-vault-row" role="region" aria-label="Signal Vault Slots 1 to 6">
        <span class="vault-row-title mono">VAULT SLOTS:</span>
        <div class="vault-slots-container">
          ${[1, 2, 3, 4, 5, 6].map(num => `
            <div class="vault-slot-cell" id="vault-slot-${num}">
              <span class="vault-slot-num mono">#${num}</span>
              <span class="vault-slot-char mono">&bull;</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    equationsHtml = `
      ${vaultRowHtml}
      <div class="bodmas-calc-grid">${cards}</div>
    `;
  }

  // T5 Anagram Tray
  let anagramHtml = '';
  if (data.hasAnagramTray) {
    const isTrayUnlocked = saved.trayUnlocked || solvedGroups.has(0);
    anagramHtml = `
      <div class="anagram-tray-panel ${isTrayUnlocked ? 'unlocked' : 'locked'}" id="anagram-tray-panel">
        <div class="anagram-panel-header">
          <div class="anagram-tag-row">
            <span class="anagram-step-tag mono">STEP 2</span>
            <span class="anagram-badge mono" id="anagram-badge">${isTrayUnlocked ? 'UNLOCKED' : 'Locked (solve equations first)'}</span>
          </div>
          <h3 class="anagram-title">Assemble the 5-Letter Word</h3>
          <p class="anagram-prompt">Drag or tap tiles into the target slots to form the final secret word.</p>
        </div>

        <!-- Target Slots -->
        <div class="anagram-target-slots" role="region" aria-label="Target 5 Slots">
          ${[0, 1, 2, 3, 4].map(idx => `
            <div class="anagram-slot-box keycap-slot" data-slot-idx="${idx}" aria-label="Slot ${idx + 1}">
              <span class="slot-idx-hint mono">${idx + 1}</span>
              <span class="slot-letter-val mono">${anagramSlots[idx] || ''}</span>
            </div>
          `).join('')}
        </div>

        <!-- Available Letter Tiles Tray -->
        <div class="anagram-tiles-tray" id="anagram-tiles-tray" role="region" aria-label="Available Letter Tiles">
          <!-- Letter tiles injected dynamically -->
        </div>

        <div class="anagram-actions-row">
          <button type="button" class="btn btn-secondary btn-sm keycap-btn" id="btn-anagram-reset" ${!isTrayUnlocked || isLocked ? 'disabled' : ''}>
            Reset Slots
          </button>
          <button type="button" class="btn btn-primary keycap-btn" id="btn-anagram-confirm" ${!isTrayUnlocked || isLocked ? 'disabled' : ''}>
            Confirm Word
          </button>
        </div>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="puzzle-bodmas-wrap" id="bodmas-wrap">
      <!-- Top Poster Strip -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Decoded Poster Fragments:</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Horizontal A-Z Numerical Scale Strip -->
      <div class="az-scale-container" role="region" aria-label="A to Z Numerical Scale (1=A ... 26=Z)">
        <div class="az-scale-track">${azChips}</div>
      </div>

      <!-- Stage Calculations -->
      <div class="bodmas-stage-content">
        ${equationsHtml}
      </div>

      ${anagramHtml}
    </div>
  `;

  const wrap = root.querySelector('#bodmas-wrap');
  const allInputs = Array.from(wrap.querySelectorAll('.bodmas-keycap-input'));

  const persist = () => {
    ctx.saveProgress({
      entries,
      solvedGroups: Array.from(solvedGroups),
      anagramSlots,
      trayUnlocked: !!saved.trayUnlocked
    });
  };

  // Highlight A-Z scale strip key on input / focus
  const highlightScaleKey = (num) => {
    wrap.querySelectorAll('.az-scale-key').forEach(k => k.classList.remove('key-active'));
    const n = parseInt(num, 10);
    if (!isNaN(n) && n >= 1 && n <= 26) {
      const activeKey = wrap.querySelector(`#az-key-${n}`);
      if (activeKey) {
        activeKey.classList.add('key-active');
        activeKey.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    }
  };

  // Update T9 vault slot if applicable
  const updateVaultSlot = (eqIdx, letter) => {
    if (data.finalWord !== 'SIGNAL') return;
    const eq = data.equations[eqIdx];
    if (!eq || !eq.slot) return;
    const slotCell = wrap.querySelector(`#vault-slot-${eq.slot}`);
    if (slotCell) {
      const charEl = slotCell.querySelector('.vault-slot-char');
      if (charEl) charEl.textContent = letter || '•';
      slotCell.classList.toggle('vault-slot-filled', !!letter);
    }
  };

  // Input Events: Numerical entry, live letter bay flipping, next input navigation
  allInputs.forEach((inp, idx) => {
    inp.addEventListener('focus', () => {
      highlightScaleKey(inp.value);
      inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    inp.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const key = inp.dataset.key;
      entries[key] = val;
      persist();

      const letter = numToLetter(val);
      const flipper = inp.closest('.calc-input-row')?.querySelector('.letter-bay-flipper');
      const letterSpan = flipper?.querySelector('.bay-letter');

      if (letterSpan) {
        letterSpan.textContent = letter || '?';
      }
      if (flipper) {
        flipper.classList.toggle('flipped', !!letter);
      }

      highlightScaleKey(val);

      if (data.finalWord === 'SIGNAL') {
        updateVaultSlot(parseInt(inp.dataset.idx, 10), letter);
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (idx < allInputs.length - 1) {
          allInputs[idx + 1].focus();
        } else {
          checkAll();
        }
      }
    });
  });

  // Per-group Clear buttons
  wrap.querySelectorAll('.btn-group-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const gIdx = parseInt(btn.dataset.group, 10);
      const panel = wrap.querySelector(`#bodmas-group-${gIdx}`);
      if (!panel) return;
      const groupInputs = panel.querySelectorAll('.bodmas-keycap-input:not(:disabled)');
      groupInputs.forEach(inp => {
        inp.value = '';
        delete entries[inp.dataset.key];
        const flipper = inp.closest('.calc-input-row')?.querySelector('.letter-bay-flipper');
        if (flipper) {
          flipper.classList.remove('flipped');
          flipper.querySelector('.bay-letter').textContent = '?';
        }
      });
      persist();
      if (groupInputs[0]) groupInputs[0].focus();
    });
  });

  // T5 Anagram Pointer Drag & Snap
  if (data.hasAnagramTray) {
    const letters = ['Q', 'U', 'E', 'S', 'T'];

    const renderTray = () => {
      const trayEl = wrap.querySelector('#anagram-tiles-tray');
      if (!trayEl) return;
      trayEl.innerHTML = '';

      const usedCounts = {};
      anagramSlots.forEach(ch => {
        if (ch) usedCounts[ch] = (usedCounts[ch] || 0) + 1;
      });

      letters.forEach((letter, i) => {
        const used = usedCounts[letter] || 0;
        const available = 1 - used;
        const tile = document.createElement('div');
        tile.className = `anagram-tile mono keycap-btn ${available <= 0 ? 'tile-used' : ''}`;
        tile.textContent = letter;
        tile.dataset.letter = letter;

        if (available > 0 && saved.trayUnlocked && !isLocked) {
          // Pointer Drag & Spring-back
          let isDragging = false;
          let startX = 0;
          let startY = 0;

          tile.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            tile.setPointerCapture(e.pointerId);
            tile.classList.add('tile-dragging');
          });

          tile.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            tile.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
          });

          const onPointerEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            tile.classList.remove('tile-dragging');

            // Check if dropped on a target slot
            tile.style.display = 'none';
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            tile.style.display = '';

            const slotBox = elemBelow?.closest('.keycap-slot');
            if (slotBox) {
              const sIdx = parseInt(slotBox.dataset.slotIdx, 10);
              anagramSlots[sIdx] = letter;
              slotBox.classList.add('slot-pulse');
              setTimeout(() => slotBox.classList.remove('slot-pulse'), 250);
              updateSlots();
              renderTray();
              persist();
              return;
            }

            // If not dropped on a slot, spring back
            tile.style.transition = 'transform 180ms ease';
            tile.style.transform = 'translate(0, 0)';
            setTimeout(() => { tile.style.transition = ''; }, 180);
          };

          tile.addEventListener('pointerup', onPointerEnd);
          tile.addEventListener('pointercancel', onPointerEnd);

          // Tap tile to place in first empty slot
          tile.addEventListener('click', () => {
            const emptyIdx = anagramSlots.indexOf(null);
            if (emptyIdx !== -1) {
              anagramSlots[emptyIdx] = letter;
              updateSlots();
              renderTray();
              persist();
            }
          });
        }

        trayEl.appendChild(tile);
      });
    };

    const updateSlots = () => {
      const slotBoxes = wrap.querySelectorAll('.keycap-slot');
      slotBoxes.forEach((box, idx) => {
        const valSpan = box.querySelector('.slot-letter-val');
        if (valSpan) valSpan.textContent = anagramSlots[idx] || '';
        box.classList.toggle('slot-has-letter', !!anagramSlots[idx]);
      });
    };

    // Tap slot to remove letter
    wrap.querySelectorAll('.keycap-slot').forEach((box, idx) => {
      box.addEventListener('click', () => {
        if (anagramSlots[idx] && !isLocked && !solvedGroups.has(0)) {
          anagramSlots[idx] = null;
          updateSlots();
          renderTray();
          persist();
        }
      });
    });

    const resetBtn = wrap.querySelector('#btn-anagram-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        for (let i = 0; i < 5; i++) anagramSlots[i] = null;
        updateSlots();
        renderTray();
        persist();
      });
    }

    const confirmBtn = wrap.querySelector('#btn-anagram-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const word = anagramSlots.join('');
        if (word === 'QUEST') {
          solvedGroups.add(0);
          const slotEl = wrap.querySelector('#poster-slot-0');
          const trayPanel = wrap.querySelector('#anagram-tray-panel');
          animateGroupLock(trayPanel, slotEl, 'QUEST', root, () => {
            persist();
            ctx.onSolved();
          });
        } else {
          const errorBar = document.querySelector('#bar-error-text');
          playWrongFeedback(confirmBtn, errorBar);
          ctx.onWrongCheck();
        }
      });
    }

    renderTray();
    updateSlots();
  }

  // Answer Check Verification
  const checkAll = async () => {
    if (ctx.isLocked && ctx.isLocked()) return;

    if (data.groupedEquations) {
      // Collect entered letters for all words
      const fullSentence = data.groupedEquations.map((group, gIdx) => {
        return group.equations.map((_, eIdx) => {
          const val = (entries[`g${gIdx}_e${eIdx}`] || '').trim();
          return numToLetter(val) || '';
        }).join('');
      }).join(' ').trim();

      if (!fullSentence) return;

      let res = null;
      if (typeof ctx.checkAnswer === 'function') {
        res = await ctx.checkAnswer(fullSentence);
      }

      if (res && res.correct) {
        data.groupedEquations.forEach((_, gIdx) => {
          solvedGroups.add(gIdx);
          const panel = wrap.querySelector(`#bodmas-group-${gIdx}`);
          if (panel) panel.classList.add('group-locked');
        });
        allInputs.forEach(inp => { if (inp) inp.disabled = true; });
        persist();
        if (ctx.onSolved) ctx.onSolved(res);
      } else {
        const errorBar = document.querySelector('#bar-error-text');
        playWrongFeedback(allInputs, errorBar);
        if (ctx.onWrongCheck) ctx.onWrongCheck(res);
      }
    } else {
      // Slotted / flat equations
      const fullSentence = allInputs.map(inp => numToLetter(inp.value.trim()) || '').join('');
      if (!fullSentence) return;

      let res = null;
      if (typeof ctx.checkAnswer === 'function') {
        res = await ctx.checkAnswer(fullSentence);
      }

      if (res && res.correct) {
        allInputs.forEach(inp => { if (inp) inp.disabled = true; });
        persist();
        if (ctx.onSolved) ctx.onSolved(res);
      } else {
        const errorBar = document.querySelector('#bar-error-text');
        playWrongFeedback(allInputs, errorBar);
        if (ctx.onWrongCheck) ctx.onWrongCheck(res);
      }
    }
  };

  activeModuleInstance = { checkAll };

  activeCleanup = () => {
    allInputs.forEach(inp => inp.replaceWith(inp.cloneNode(true)));
  };
}
