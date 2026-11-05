/**
 * Future Quest 2026 - ASCII Decoder Puzzle Module
 * 
 * Upgraded UX:
 * - Each word is a group; code cards sit in a wrapping horizontal row.
 * - Each card: code on top, small arrow, single-character letter slot (~40x44px, dark, mono, uppercase, maxlength 1).
 * - Auto-advance on typing, Backspace navigates back, pasting a word fills subsequent slots.
 * - Live decode strip showing the sentence being built in real time.
 * - Slide-out ASCII chart that highlights the exact row of the hovered code card.
 * - A correct word locks immediately with a short stamp effect.
 * - No horizontal scroll on 360px and 1280px, 44px touch targets. Animate only transform and opacity.
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

  const asciiChartHtml = data.isAtbash ? `
    <aside class="ascii-chart-sidebar" id="ascii-chart-sidebar" role="region" aria-label="Reverse Alphabet Index Table">
      <div class="chart-sidebar-header">
        <span class="chart-header-title">Reverse Index (Z=1 .. A=26)</span>
        <button type="button" class="chart-close-btn" id="btn-chart-close" aria-label="Close table">✕</button>
      </div>
      <div class="chart-sidebar-body">
        <div class="chart-col">
          <div class="chart-col-head">A–M (26–14)</div>
          ${Array.from({ length: 13 }, (_, i) => {
            const letter = String.fromCharCode(65 + i);
            const code = 26 - i;
            return `<div class="chart-row" id="chart-row-${code}" data-code="${code}"><span class="chart-ch mono"><strong>${letter}</strong></span><span class="chart-val mono">${code}</span></div>`;
          }).join('')}
        </div>
        <div class="chart-col">
          <div class="chart-col-head">N–Z (13–1)</div>
          ${Array.from({ length: 13 }, (_, i) => {
            const letter = String.fromCharCode(78 + i);
            const code = 13 - i;
            return `<div class="chart-row" id="chart-row-${code}" data-code="${code}"><span class="chart-ch mono"><strong>${letter}</strong></span><span class="chart-val mono">${code}</span></div>`;
          }).join('')}
        </div>
      </div>
    </aside>
  ` : `
    <aside class="ascii-chart-sidebar" id="ascii-chart-sidebar" role="region" aria-label="ASCII Decimal Table">
      <div class="chart-sidebar-header">
        <span class="chart-header-title">ASCII Reference Table</span>
        <button type="button" class="chart-close-btn" id="btn-chart-close" aria-label="Close table">✕</button>
      </div>
      <div class="chart-sidebar-body">
        <div class="chart-col">
          <div class="chart-col-head">A–Z (65–90)</div>
          ${chartRowsA}
        </div>
        <div class="chart-col">
          <div class="chart-col-head">a–z (97–122)</div>
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
        <div class="ascii-physical-card ${val ? 'has-letter' : ''}" data-key="${key}" data-code="${displayCode}" id="card-${key}">
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
          ${isGrpSolved ? `<span class="word-stamp-badge mono">STAMPED: LOCKED</span>` : ''}
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
            <circle cx="130" cy="130" r="120" fill="#140E24" stroke="#4A3A75" stroke-width="2"/>
            <circle cx="130" cy="130" r="92" fill="#0A0712" stroke="#3D3063" stroke-width="1.5"/>
            <g class="outer-ring-letters mono" fill="#A69CB8" font-size="11" font-weight="600" text-anchor="middle" dominant-baseline="central">
              ${Array.from({ length: 26 }, (_, i) => {
                const angle = (i * (360 / 26) - 90) * (Math.PI / 180);
                const x = 130 + 106 * Math.cos(angle);
                const y = 130 + 106 * Math.sin(angle);
                return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${String.fromCharCode(65 + i)}</text>`;
              }).join('')}
            </g>

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
              <circle cx="130" cy="130" r="22" fill="#171226" stroke="#FF9900" stroke-width="2"/>
              <text x="130" y="131" fill="#FFC928" font-size="9" font-family="'IBM Plex Mono', monospace" font-weight="800" text-anchor="middle" dominant-baseline="central">ROTOR</text>
            </g>

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

      <!-- Live Sentence Decode Strip -->
      <div class="ascii-live-strip-container" role="region" aria-label="Live Quote Decode Strip">
        <div class="ascii-live-strip-label mono">LIVE DECODE STRIP:</div>
        <div class="ascii-live-strip-display mono" id="ascii-live-sentence"></div>
      </div>

      <!-- Main Layout: Content Column + Slide-out ASCII Chart Sidebar -->
      <div class="ascii-main-layout">
        <div class="ascii-content-column">
          <!-- Action Bar Row for ASCII Chart Drawer Toggle -->
          <div class="ascii-toolbar-row">
            ${stepperHtml}
            <button type="button" class="btn btn-secondary btn-sm keycap-btn btn-chart-toggle" id="btn-chart-toggle">
              <span>${data.isAtbash ? 'Table (Reverse Index)' : 'Table (ASCII)'}</span>
            </button>
          </div>

          <!-- Stage Physical Cards -->
          <div class="ascii-words-stage" role="region" aria-label="ASCII Input Cards">
            ${wordsHtml}
          </div>

          ${caesarHtml}
        </div>

        ${asciiChartHtml}
      </div>
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

  // Update Live Sentence Strip
  const updateLiveSentence = () => {
    const liveEl = wrap.querySelector('#ascii-live-sentence');
    if (!liveEl) return;
    const parts = words.map((wObj, wIdx) => {
      const isWordSolved = solvedGroups.has(wIdx);
      const chars = wObj.codes.map((_, cIdx) => {
        const char = entries[`w${wIdx}_c${cIdx}`];
        if (isWordSolved) {
          return `<span class="decode-char char-entered" style="color: #4ADE80;">${char || ''}</span>`;
        }
        return char 
          ? `<span class="decode-char char-entered">${char}</span>` 
          : `<span class="decode-char char-empty">&middot;</span>`;
      }).join('');
      return `<span class="decode-word ${isWordSolved ? 'decode-word-solved' : ''}">${chars}</span>`;
    });
    liveEl.innerHTML = parts.join('<span class="decode-space"> </span>');
  };

  // Update Poster Strip
  const updatePosterStrip = () => {
    posterGroups.forEach((grpName, idx) => {
      const slot = wrap.querySelector(`#poster-slot-${idx}`);
      if (slot && solvedGroups.has(idx)) {
        slot.classList.add('slot-filled', 'slot-stamped');
        const content = slot.querySelector('.slot-content');
        if (content) {
          content.textContent = data.groupSolutions ? data.groupSolutions[idx] : grpName;
        }
      }
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

  // Check and lock a single word when solved
  const checkWordLock = (wIdx) => {
    const wordObj = words[wIdx];
    if (!wordObj) return;
    persist();
    updatePosterStrip();
    updateLiveSentence();
  };

  // Initial live sentence render
  updateLiveSentence();

  // Input events: Auto-advance, backspace navigation, card flipping, paste
  allInputs.forEach((inp, idx) => {
    inp.addEventListener('focus', () => {
      inp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    inp.addEventListener('input', (e) => {
      const val = e.target.value;
      const char = val ? val[val.length - 1] : '';
      inp.value = char;
      const key = inp.dataset.key;
      const flipper = inp.closest('.card-slot-flipper');

      if (char) {
        entries[key] = char;
        if (flipper) flipper.classList.add('flipped');
        persist();
        updateLiveSentence();
        checkWordLock(parseInt(inp.dataset.word, 10));

        // Auto-advance to next available input
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
        updateLiveSentence();
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!inp.value) {
          for (let i = idx - 1; i >= 0; i--) {
            if (!allInputs[i].disabled) {
              allInputs[i].focus();
              break;
            }
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

    // Pasting a word fills slots
    inp.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        ?.getData('text')
        ?.trim()
        ?.replace(/[^a-zA-Z]/g, '') || '';
      if (!pasted) return;

      const wIdx = parseInt(inp.dataset.word, 10);
      const startChar = parseInt(inp.dataset.char, 10);
      const wordObj = words[wIdx];
      if (!wordObj) return;

      for (let i = 0; i < pasted.length && (startChar + i) < wordObj.codes.length; i++) {
        const cIdx = startChar + i;
        const key = `w${wIdx}_c${cIdx}`;
        const char = pasted[i];
        entries[key] = char;
        const targetInp = wrap.querySelector(`.ascii-keycap-input[data-key="${key}"]`);
        if (targetInp) {
          targetInp.value = char;
          const flipper = targetInp.closest('.card-slot-flipper');
          if (flipper) flipper.classList.add('flipped');
        }
      }
      persist();
      updateLiveSentence();
      checkWordLock(wIdx);

      const nextChar = Math.min(startChar + pasted.length, wordObj.codes.length - 1);
      const nextInp = wrap.querySelector(`.ascii-keycap-input[data-word="${wIdx}"][data-char="${nextChar}"]`);
      if (nextInp && !nextInp.disabled) nextInp.focus();
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
      updateLiveSentence();
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

    let isDraggingDial = false;
    let startPointerAngle = 0;
    let startShift = 0;

    const getDialAngle = (e) => {
      const rect = svgDial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
      let deg = rad * (180 / Math.PI) + 90;
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
  const checkAll = async () => {
    if (ctx.isLocked && ctx.isLocked()) return;

    const fullSentence = words.map((wObj, wIdx) => {
      return wObj.codes.map((_, cIdx) => (entries[`w${wIdx}_c${cIdx}`] || '').toUpperCase()).join('');
    }).join(' ').trim();

    if (!fullSentence) return;

    let res = null;
    if (typeof ctx.checkAnswer === 'function') {
      res = await ctx.checkAnswer(fullSentence);
    }

    if (res && res.correct) {
      words.forEach((_, wIdx) => {
        solvedGroups.add(wIdx);
        const wordGroupEl = wrap.querySelector(`#ascii-word-${wIdx}`);
        if (wordGroupEl) {
          wordGroupEl.classList.add('word-bar-locked');
          wordGroupEl.querySelectorAll('.ascii-keycap-input').forEach(i => i.disabled = true);
        }
      });
      persist();
      updateLiveSentence();
      if (ctx.onSolved) ctx.onSolved(res);
    } else {
      const errorBar = document.querySelector('#bar-error-text');
      const allActiveInputs = Array.from(wrap.querySelectorAll('.ascii-keycap-input:not(:disabled)'));
      playWrongFeedback(allActiveInputs, errorBar);
      if (ctx.onWrongCheck) ctx.onWrongCheck(res);
    }
  };

  activeModuleInstance = { checkAll };

  activeCleanup = () => {
    allInputs.forEach(inp => inp.replaceWith(inp.cloneNode(true)));
  };
}
