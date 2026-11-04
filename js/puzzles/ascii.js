/**
 * Future Quest 2026 - ASCII Decoder Puzzle Module
 * 
 * Upgraded UX:
 * - Physical code cards with mono code, arrow, and flipping letter slots.
 * - Locked words slide together into solid bars (gap closes to 2px).
 * - Desktop side panel / Mobile bottom sheet ASCII reference chart with active row auto-scroll.
 * - T4: Smooth vertical rolling counter for code stepper.
 * - T8: Interactive SVG Cipher Dial with pointer angle drag and arrow key rotation.
 * - Group lock FLIP animation and per-group Clear buttons.
 */

import { PUZZLE_ART } from './art.js';
import { animateGroupLock, playWrongFeedback, isReducedMotion } from './popup.js';

let activeCleanup = null;
let activeModuleInstance = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during ascii unmount:', e);
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
  const entries = saved.entries || {};
  const solvedGroups = new Set(saved.solvedGroups || []);
  let stepperOffset = typeof saved.stepperOffset === 'number' ? saved.stepperOffset : 0;
  let caesarShift = typeof saved.caesarShift === 'number' ? saved.caesarShift : 0;
  let phase2Unlocked = !!saved.phase2Unlocked;

  // Render Poster Strip Slots
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

  // ASCII Reference Chart (A-Z: 65-90, a-z: 97-122, common symbols)
  const chartRowsA = Array.from({ length: 26 }, (_, i) => {
    const code = 65 + i;
    const ch = String.fromCharCode(code);
    return `<div class="chart-row" id="chart-row-${code}" data-code="${code}"><span class="chart-ch mono"><strong>${ch}</strong></span><span class="chart-val mono">${code}</span></div>`;
  }).join('');

  const chartRowsB = Array.from({ length: 26 }, (_, i) => {
    const code = 97 + i;
    const ch = String.fromCharCode(code);
    return `<div class="chart-row" id="chart-row-${code}" data-code="${code}"><span class="chart-ch mono"><strong>${ch}</strong></span><span class="chart-val mono">${code}</span></div>`;
  }).join('');

  const chartSpecial = [
    [32, 'Space'], [33, '!'], [63, '?'], [46, '.'], [44, ','], [58, ':'], [45, '-'], [95, '_']
  ].map(([code, label]) => `
    <div class="chart-row" id="chart-row-${code}" data-code="${code}"><span class="chart-ch mono"><strong>${label}</strong></span><span class="chart-val mono">${code}</span></div>
  `).join('');

  const asciiChartHtml = `
    <aside class="ascii-chart-sidebar" id="ascii-chart-sidebar" role="region" aria-label="ASCII Decimal Table">
      <div class="chart-sidebar-header">
        <span class="chart-header-title">ASCII Table</span>
        <button type="button" class="chart-close-btn" id="btn-chart-close" aria-label="Close table">✕</button>
      </div>
      <div class="chart-sidebar-body">
        <div class="chart-col">
          <div class="chart-col-head">A-Z (65-90)</div>
          ${chartRowsA}
        </div>
        <div class="chart-col">
          <div class="chart-col-head">a-z (97-122)</div>
          ${chartRowsB}
        </div>
        <div class="chart-col">
          <div class="chart-col-head">Symbols</div>
          ${chartSpecial}
        </div>
      </div>
    </aside>
  `;

  // Render Words as Physical Card Groups
  const words = data.words || [];
  const wordsHtml = words.map((wordObj, wIdx) => {
    const isGrpSolved = solvedGroups.has(wIdx);
    const cardsHtml = wordObj.codes.map((code, cIdx) => {
      const key = `w${wIdx}_c${cIdx}`;
      const val = entries[key] || '';
      const displayCode = code + (data.hasStepper ? stepperOffset : 0);
      return `
        <div class="ascii-physical-card ${val ? 'has-letter' : ''}" data-key="${key}">
          <div class="card-mono-code mono" data-base-code="${code}">${displayCode}</div>
          <div class="card-arrow" aria-hidden="true">${PUZZLE_ART.arrowDown}</div>
          <div class="card-slot-wrap">
            <div class="card-slot-flipper ${val ? 'flipped' : ''}">
              <input 
                type="text" 
                class="ascii-keycap-input mono" 
                maxlength="1" 
                autocapitalize="characters"
                autocomplete="off"
                spellcheck="false"
                data-word="${wIdx}" 
                data-char="${cIdx}" 
                data-key="${key}"
                data-code="${displayCode}"
                value="${val}"
                ${isGrpSolved || isLocked ? 'disabled' : ''}
                aria-label="Character for ASCII code ${displayCode}"
              />
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="ascii-word-group ${isGrpSolved ? 'word-bar-locked' : ''}" id="ascii-word-${wIdx}">
        <div class="word-group-header">
          <span class="word-group-label mono">Word ${wIdx + 1} (${wordObj.codes.length} chars)</span>
          ${!isGrpSolved && !isLocked ? `
            <button type="button" class="btn-group-clear keycap-btn" data-word="${wIdx}" title="Clear this word's letters">Clear</button>
          ` : ''}
        </div>
        <div class="ascii-cards-track">${cardsHtml}</div>
      </div>
    `;
  }).join('');

  // T4 Stepper with Rolling Counter
  const stepperHtml = data.hasStepper ? `
    <div class="ascii-rolling-stepper" role="region" aria-label="ASCII Offset Stepper">
      <span class="stepper-title">Adjust all decimal codes by:</span>
      <div class="rolling-stepper-box">
        <button type="button" class="stepper-btn keycap-btn" id="btn-stepper-minus" aria-label="Decrease offset" ${isLocked ? 'disabled' : ''}>-</button>
        <div class="rolling-window mono" aria-live="polite">
          <div class="rolling-strip" id="stepper-rolling-strip" style="transform: translateY(-${(stepperOffset + 5) * 36}px);">
            ${[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(n => `
              <div class="rolling-num mono">${n > 0 ? '+' : ''}${n}</div>
            `).join('')}
          </div>
        </div>
        <button type="button" class="stepper-btn keycap-btn" id="btn-stepper-plus" aria-label="Increase offset" ${isLocked ? 'disabled' : ''}>+</button>
      </div>
      <span class="stepper-caption text-muted">Roll the offset to align cards with standard ASCII</span>
    </div>
  ` : '';

  // T8 Interactive SVG Cipher Dial
  const caesarHtml = data.isCaesarHybrid ? `
    <div class="caesar-dial-section ${phase2Unlocked ? 'dial-active' : 'dial-disabled'}" id="caesar-dial-section">
      <div class="caesar-section-header">
        <div class="caesar-tag-row">
          <span class="caesar-step-badge mono">PHASE 2</span>
          <span class="caesar-status-badge mono">${phase2Unlocked ? 'UNLOCKED' : 'LOCKED (Solve Phase 1 first)'}</span>
        </div>
        <h3 class="caesar-title">Rotational Caesar Cipher Dial</h3>
        <p class="caesar-prompt">Shift the decoded ciphertext backward by 3 positions to reveal the secret motto.</p>
      </div>

      <div class="caesar-dial-container" id="caesar-dial-container">
        <!-- SVG Interactive Dial -->
        <div class="caesar-dial-svg-wrap">
          <svg class="caesar-svg-dial" id="caesar-svg-dial" viewBox="0 0 260 260" width="240" height="240">
            <!-- Outer Fixed Ring (A-Z) - Brass & Dark Violet Enigma Rotor -->
            <circle cx="130" cy="130" r="120" fill="#140E24" stroke="#4A3A75" stroke-width="2"/>
            <circle cx="130" cy="130" r="92" fill="#0A0712" stroke="#3D3063" stroke-width="1.5"/>
            <!-- Outer Letters -->
            <g class="outer-ring-letters mono" fill="#A69CB8" font-size="11" font-weight="600" text-anchor="middle" dominant-baseline="central">
              ${Array.from({ length: 26 }, (_, i) => {
                const angle = (i * (360 / 26) - 90) * (Math.PI / 180);
                const x = 130 + 106 * Math.cos(angle);
                const y = 130 + 106 * Math.sin(angle);
                return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${String.fromCharCode(65 + i)}</text>`;
              }).join('')}
            </g>

            <!-- Inner Rotating Ring -->
            <g id="dial-rotatable-inner" style="transform-origin: 130px 130px; transform: rotate(${caesarShift * (360 / 26)}deg); transition: transform ${isReducedMotion() ? '0ms' : '120ms ease-out'};">
              <circle cx="130" cy="130" r="90" fill="#271D42" stroke="#FFC928" stroke-width="2"/>
              <circle cx="130" cy="130" r="54" fill="#0F0B1A" stroke="#4A3A75" stroke-width="1.5"/>
              <g class="inner-ring-letters mono" fill="#FFC928" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="central">
                ${Array.from({ length: 26 }, (_, i) => {
                  const angle = (i * (360 / 26) - 90) * (Math.PI / 180);
                  const x = 130 + 72 * Math.cos(angle);
                  const y = 130 + 72 * Math.sin(angle);
                  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${String.fromCharCode(65 + i)}</text>`;
                }).join('')}
              </g>
              <!-- Center Hub -->
              <circle cx="130" cy="130" r="22" fill="#171226" stroke="#FF9900" stroke-width="2"/>
              <text x="130" y="131" fill="#FFC928" font-size="9" font-family="'IBM Plex Mono', monospace" font-weight="800" text-anchor="middle" dominant-baseline="central">ROTOR</text>
            </g>

            <!-- Alignment Pointer Arrow -->
            <polygon points="130,3 124,14 136,14" fill="#FF9900"/>
          </svg>
        </div>

        <!-- Controls & Shift Readout -->
        <div class="caesar-readout-col">
          <div class="caesar-shift-stepper">
            <button type="button" class="btn btn-secondary btn-sm keycap-btn" id="btn-dial-minus" aria-label="Rotate dial backward" ${!phase2Unlocked || isLocked ? 'disabled' : ''}>-</button>
            <div class="shift-display-pill mono">
              <span class="shift-label">ROTATION:</span>
              <span class="shift-deg mono" id="caesar-shift-degrees">${caesarShift}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm keycap-btn" id="btn-dial-plus" aria-label="Rotate dial forward" ${!phase2Unlocked || isLocked ? 'disabled' : ''}>+</button>
          </div>

          <div class="caesar-live-preview-box">
            <span class="preview-tag mono">Live Decrypted Motto:</span>
            <div class="preview-text mono" id="caesar-preview-text">------ -----</div>
          </div>

          <button type="button" class="btn btn-primary keycap-btn" id="btn-caesar-confirm" ${!phase2Unlocked || isLocked ? 'disabled' : ''}>
            Confirm Motto
          </button>
        </div>
      </div>
    </div>
  ` : '';

  root.innerHTML = `
    <div class="puzzle-ascii-wrap" id="ascii-wrap">
      <!-- Top Poster Strip Anchor -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Decoded Poster Fragments:</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      <!-- Action Bar Row for ASCII Chart Drawer Toggle -->
      <div class="ascii-toolbar-row">
        ${stepperHtml}
        <button type="button" class="btn btn-secondary btn-sm keycap-btn btn-chart-toggle" id="btn-chart-toggle">
          <span>Table (ASCII)</span>
        </button>
      </div>

      <!-- Stage Physical Cards -->
      <div class="ascii-words-stage" role="region" aria-label="ASCII Input Cards">
        ${wordsHtml}
      </div>

      ${caesarHtml}

      ${asciiChartHtml}
    </div>
  `;

  const wrap = root.querySelector('#ascii-wrap');
  const allInputs = Array.from(wrap.querySelectorAll('.ascii-keycap-input'));
  const chartSidebar = wrap.querySelector('#ascii-chart-sidebar');

  const persist = () => {
    ctx.saveProgress({
      entries,
      solvedGroups: Array.from(solvedGroups),
      stepperOffset,
      caesarShift,
      phase2Unlocked
    });
  };

  // Mobile Bottom Sheet / Sidebar Chart Toggle
  const chartToggleBtn = wrap.querySelector('#btn-chart-toggle');
  const chartCloseBtn = wrap.querySelector('#btn-chart-close');

  if (chartToggleBtn && chartSidebar) {
    chartToggleBtn.addEventListener('click', () => {
      chartSidebar.classList.toggle('open');
    });
  }
  if (chartCloseBtn && chartSidebar) {
    chartCloseBtn.addEventListener('click', () => {
      chartSidebar.classList.remove('open');
    });
  }

  // Highlight ASCII table row on input focus
  const highlightChartCode = (code) => {
    wrap.querySelectorAll('.chart-row').forEach(r => r.classList.remove('chart-row-active'));
    const row = wrap.querySelector(`#chart-row-${code}`);
    if (row) {
      row.classList.add('chart-row-active');
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // Input events: Auto-advance, backspace navigation, card flipping, mobile scroll
  allInputs.forEach((inp, idx) => {
    inp.addEventListener('focus', () => {
      const code = inp.dataset.code;
      if (code) highlightChartCode(code);
      inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    inp.addEventListener('input', (e) => {
      const char = e.target.value.trim().toUpperCase();
      const key = inp.dataset.key;
      const flipper = inp.closest('.card-slot-flipper');

      if (char) {
        entries[key] = char;
        inp.value = char;
        if (flipper) flipper.classList.add('flipped');
        persist();

        // Advance to next available input
        for (let i = idx + 1; i < allInputs.length; i++) {
          if (!allInputs[i].disabled) {
            allInputs[i].focus();
            allInputs[i].select();
            break;
          }
        }
      } else {
        delete entries[key];
        if (flipper) flipper.classList.remove('flipped');
        persist();
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value) {
        for (let i = idx - 1; i >= 0; i--) {
          if (!allInputs[i].disabled) {
            allInputs[i].focus();
            break;
          }
        }
      } else if (e.key === 'ArrowLeft') {
        for (let i = idx - 1; i >= 0; i--) {
          if (!allInputs[i].disabled) {
            allInputs[i].focus();
            break;
          }
        }
      } else if (e.key === 'ArrowRight') {
        for (let i = idx + 1; i < allInputs.length; i++) {
          if (!allInputs[i].disabled) {
            allInputs[i].focus();
            break;
          }
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        checkAll();
      }
    });
  });

  // Per-group Clear button
  wrap.querySelectorAll('.btn-group-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const wIdx = parseInt(btn.dataset.word, 10);
      const groupEl = wrap.querySelector(`#ascii-word-${wIdx}`);
      if (!groupEl) return;
      const groupInputs = groupEl.querySelectorAll('.ascii-keycap-input:not(:disabled)');
      groupInputs.forEach(inp => {
        inp.value = '';
        delete entries[inp.dataset.key];
        const flipper = inp.closest('.card-slot-flipper');
        if (flipper) flipper.classList.remove('flipped');
      });
      persist();
      if (groupInputs[0]) groupInputs[0].focus();
    });
  });

  // T4 Stepper Rolling Counter Logic
  if (data.hasStepper) {
    const rollingStrip = wrap.querySelector('#stepper-rolling-strip');
    const updateStepper = () => {
      if (rollingStrip) {
        rollingStrip.style.transform = `translateY(-${(stepperOffset + 5) * 36}px)`;
      }
      wrap.querySelectorAll('.card-mono-code').forEach(el => {
        const base = parseInt(el.dataset.baseCode, 10);
        const newCode = base + stepperOffset;
        el.textContent = newCode;
        const input = el.closest('.ascii-physical-card')?.querySelector('.ascii-keycap-input');
        if (input) input.dataset.code = String(newCode);
      });
      persist();
    };

    const minusBtn = wrap.querySelector('#btn-stepper-minus');
    const plusBtn = wrap.querySelector('#btn-stepper-plus');

    if (minusBtn) minusBtn.addEventListener('click', () => {
      if (stepperOffset > -5) {
        stepperOffset--;
        updateStepper();
      }
    });
    if (plusBtn) plusBtn.addEventListener('click', () => {
      if (stepperOffset < 5) {
        stepperOffset++;
        updateStepper();
      }
    });
  }

  // T8 Cipher Dial Interaction Logic
  const updateCaesarPreview = () => {
    if (!data.isCaesarHybrid) return;
    const previewEl = wrap.querySelector('#caesar-preview-text');
    const degEl = wrap.querySelector('#caesar-shift-degrees');
    const rotatable = wrap.querySelector('#dial-rotatable-inner');

    if (degEl) degEl.textContent = String(caesarShift);
    if (rotatable) {
      rotatable.style.transform = `rotate(${caesarShift * (360 / 26)}deg)`;
    }

    const source = (data.cipherWords || ['IXWXUH', 'UHDGB']).join(' ');
    const shifted = source.split('').map(ch => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + caesarShift) % 26) + 65);
      }
      return ch;
    }).join('');

    if (previewEl) previewEl.textContent = shifted;
    persist();
  };

  if (data.isCaesarHybrid) {
    updateCaesarPreview();

    const svgDial = wrap.querySelector('#caesar-svg-dial');
    const dialMinus = wrap.querySelector('#btn-dial-minus');
    const dialPlus = wrap.querySelector('#btn-dial-plus');
    const confirmBtn = wrap.querySelector('#btn-caesar-confirm');

    // Pointer Drag Rotation
    let isDraggingDial = false;
    let startPointerAngle = 0;
    let startShift = 0;

    const getDialAngle = (e) => {
      const rect = svgDial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angleRad = Math.atan2(e.clientY - cy, e.clientX - cx);
      let deg = angleRad * (180 / Math.PI);
      if (deg < 0) deg += 360;
      return deg;
    };

    if (svgDial && phase2Unlocked && !isLocked) {
      svgDial.addEventListener('pointerdown', (e) => {
        isDraggingDial = true;
        svgDial.setPointerCapture(e.pointerId);
        startPointerAngle = getDialAngle(e);
        startShift = caesarShift;
      });

      svgDial.addEventListener('pointermove', (e) => {
        if (!isDraggingDial) return;
        requestAnimationFrame(() => {
          const currentAngle = getDialAngle(e);
          let delta = currentAngle - startPointerAngle;
          if (delta < -180) delta += 360;
          if (delta > 180) delta -= 360;

          const steps = Math.round(delta / (360 / 26));
          const newShift = (((startShift + steps) % 26) + 26) % 26;
          if (newShift !== caesarShift) {
            caesarShift = newShift;
            updateCaesarPreview();
          }
        });
      });

      const stopDrag = () => { isDraggingDial = false; };
      svgDial.addEventListener('pointerup', stopDrag);
      svgDial.addEventListener('pointercancel', stopDrag);
    }

    if (dialMinus) dialMinus.addEventListener('click', () => {
      caesarShift = (caesarShift - 1 + 26) % 26;
      updateCaesarPreview();
    });

    if (dialPlus) dialPlus.addEventListener('click', () => {
      caesarShift = (caesarShift + 1) % 26;
      updateCaesarPreview();
    });

    if (confirmBtn) confirmBtn.addEventListener('click', () => {
      const previewText = wrap.querySelector('#caesar-preview-text')?.textContent.trim();
      if (previewText === data.finalText) {
        solvedGroups.add(2);
        const slotEl = wrap.querySelector('#poster-slot-2');
        const dialSection = wrap.querySelector('#caesar-dial-section');
        animateGroupLock(dialSection, slotEl, data.finalText, root, () => {
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

  // Answer Check Verification
  const checkAll = () => {
    let anyWrong = false;
    let wrongCards = [];

    words.forEach((wordObj, wIdx) => {
      if (solvedGroups.has(wIdx)) return;

      let wordFilled = true;
      let wordMatches = true;
      const groupInputs = [];

      wordObj.codes.forEach((code, cIdx) => {
        const key = `w${wIdx}_c${cIdx}`;
        const input = wrap.querySelector(`.ascii-keycap-input[data-key="${key}"]`);
        groupInputs.push(input);
        const entered = (entries[key] || '').toUpperCase();
        const expected = wordObj.expectedChars[cIdx].toUpperCase();

        if (!entered) {
          wordFilled = false;
        } else if (entered !== expected) {
          wordMatches = false;
        }
      });

      if (wordFilled && wordMatches) {
        solvedGroups.add(wIdx);
        groupInputs.forEach(inp => { if (inp) inp.disabled = true; });

        const wordGroupEl = wrap.querySelector(`#ascii-word-${wIdx}`);
        if (wordGroupEl) wordGroupEl.classList.add('word-bar-locked');

        const slotEl = wrap.querySelector(`#poster-slot-${wIdx}`);
        const solvedText = wordObj.expectedText || wordObj.expectedChars.join('');
        animateGroupLock(groupInputs, slotEl, solvedText, root);
      } else if (wordFilled && !wordMatches) {
        anyWrong = true;
        groupInputs.forEach(inp => {
          if (inp && (entries[inp.dataset.key] || '').toUpperCase() !== wordObj.expectedChars[parseInt(inp.dataset.char, 10)].toUpperCase()) {
            wrongCards.push(inp);
          }
        });
      }
    });

    persist();

    // Check Phase 2 unlock for T8
    if (data.isCaesarHybrid && !phase2Unlocked) {
      if (solvedGroups.has(0) && solvedGroups.has(1)) {
        phase2Unlocked = true;
        const dialSec = wrap.querySelector('#caesar-dial-section');
        if (dialSec) {
          dialSec.classList.remove('dial-disabled');
          dialSec.classList.add('dial-active');
          const badge = dialSec.querySelector('.caesar-status-badge');
          if (badge) badge.textContent = 'UNLOCKED';
          wrap.querySelectorAll('#btn-dial-minus, #btn-dial-plus, #btn-caesar-confirm').forEach(b => b.disabled = false);
        }
        persist();
      }
    }

    if (anyWrong) {
      const errorBar = document.querySelector('#bar-error-text');
      playWrongFeedback(wrongCards, errorBar);
      setTimeout(() => {
        wrongCards.forEach(inp => {
          inp.value = '';
          delete entries[inp.dataset.key];
          const flipper = inp.closest('.card-slot-flipper');
          if (flipper) flipper.classList.remove('flipped');
        });
        if (wrongCards[0]) wrongCards[0].focus();
        persist();
      }, 450);

      ctx.onWrongCheck();
    }

    // Solve overall if non-hybrid
    if (!data.isCaesarHybrid && solvedGroups.size === words.length) {
      ctx.onSolved();
    }
  };

  activeModuleInstance = { checkAll };

  activeCleanup = () => {
    allInputs.forEach(inp => inp.replaceWith(inp.cloneNode(true)));
  };
}
