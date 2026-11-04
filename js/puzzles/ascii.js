/**
 * Future Quest 2026 - ASCII Decoder Puzzle Module
 * 
 * Handles Tile 1 (Quote Decoder), Tile 4 (Shifted ASCII with Stepper),
 * and Tile 8 (Caesar-ASCII Hybrid with Shift Dial).
 */

import { showRewardPopup } from './popup.js';

let activeCleanup = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during ascii unmount:', e);
    }
    activeCleanup = null;
  }
}

/**
 * Mount ASCII decoder interface.
 * @param {HTMLElement} root - Container to mount into
 * @param {Object} data - Puzzle configuration data
 * @param {Object} ctx - Controller context { getProgress, saveProgress, isLocked, onSolved, onWrongCheck }
 */
export function mount(root, data, ctx) {
  unmount();

  const isLocked = ctx.isLocked();
  const saved = ctx.getProgress() || {};
  const entries = saved.entries || {};
  const solvedGroups = new Set(saved.solvedGroups || []);
  let stepperOffset = typeof saved.stepperOffset === 'number' ? saved.stepperOffset : 0;
  let caesarShift = typeof saved.caesarShift === 'number' ? saved.caesarShift : 0;
  let phase2Unlocked = !!saved.phase2Unlocked;

  // Build the poster strip slots
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

  // ASCII Reference Chart (from PDF)
  const asciiChartHtml = `
    <details class="ascii-chart-collapsible">
      <summary class="btn btn-secondary btn-sm ascii-toggle-btn">
        ASCII Reference Chart
      </summary>
      <div class="ascii-chart-drawer">
        <div class="ascii-chart-grid">
          <div class="ascii-chart-col">
            <h4 class="ascii-col-title">Uppercase (A-Z)</h4>
            <div class="ascii-rows">
              <span><strong>A</strong> 65</span><span><strong>B</strong> 66</span><span><strong>C</strong> 67</span><span><strong>D</strong> 68</span>
              <span><strong>E</strong> 69</span><span><strong>F</strong> 70</span><span><strong>G</strong> 71</span><span><strong>H</strong> 72</span>
              <span><strong>I</strong> 73</span><span><strong>J</strong> 74</span><span><strong>K</strong> 75</span><span><strong>L</strong> 76</span>
              <span><strong>M</strong> 77</span><span><strong>N</strong> 78</span><span><strong>O</strong> 79</span><span><strong>P</strong> 80</span>
              <span><strong>Q</strong> 81</span><span><strong>R</strong> 82</span><span><strong>S</strong> 83</span><span><strong>T</strong> 84</span>
              <span><strong>U</strong> 85</span><span><strong>V</strong> 86</span><span><strong>W</strong> 87</span><span><strong>X</strong> 88</span>
              <span><strong>Y</strong> 89</span><span><strong>Z</strong> 90</span>
            </div>
          </div>
          <div class="ascii-chart-col">
            <h4 class="ascii-col-title">Lowercase (a-z)</h4>
            <div class="ascii-rows">
              <span><strong>a</strong> 97</span><span><strong>b</strong> 98</span><span><strong>c</strong> 99</span><span><strong>d</strong> 100</span>
              <span><strong>e</strong> 101</span><span><strong>f</strong> 102</span><span><strong>g</strong> 103</span><span><strong>h</strong> 104</span>
              <span><strong>i</strong> 105</span><span><strong>j</strong> 106</span><span><strong>k</strong> 107</span><span><strong>l</strong> 108</span>
              <span><strong>m</strong> 109</span><span><strong>n</strong> 110</span><span><strong>o</strong> 111</span><span><strong>p</strong> 112</span>
              <span><strong>q</strong> 113</span><span><strong>r</strong> 114</span><span><strong>s</strong> 115</span><span><strong>t</strong> 116</span>
              <span><strong>u</strong> 117</span><span><strong>v</strong> 118</span><span><strong>w</strong> 119</span><span><strong>x</strong> 120</span>
              <span><strong>y</strong> 121</span><span><strong>z</strong> 122</span>
            </div>
          </div>
          <div class="ascii-chart-col">
            <h4 class="ascii-col-title">Special & Symbols</h4>
            <div class="ascii-rows">
              <span><strong>[Space]</strong> 32</span><span><strong>!</strong> 33</span><span><strong>?</strong> 63</span>
              <span><strong>.</strong> 46</span><span><strong>,</strong> 44</span><span><strong>:</strong> 58</span>
              <span><strong>-</strong> 45</span><span><strong>_</strong> 95</span>
            </div>
          </div>
        </div>
      </div>
    </details>
  `;

  // Render Words & Chips
  const words = data.words || [];
  const wordsHtml = words.map((wordObj, wIdx) => {
    const isGrpSolved = solvedGroups.has(wIdx);
    const chipsHtml = wordObj.codes.map((code, cIdx) => {
      const key = `w${wIdx}_c${cIdx}`;
      const val = entries[key] || '';
      const displayCode = code + (data.hasStepper ? stepperOffset : 0);
      return `
        <div class="ascii-chip-pair" data-key="${key}">
          <div class="ascii-chip-num mono" data-base-code="${code}">${displayCode}</div>
          <input 
            type="text" 
            class="ascii-input mono" 
            maxlength="1" 
            data-word="${wIdx}" 
            data-char="${cIdx}" 
            data-key="${key}"
            value="${val}"
            ${isGrpSolved || isLocked ? 'disabled' : ''}
            autocomplete="off"
            spellcheck="false"
            aria-label="Character for ASCII code ${displayCode}"
          />
        </div>
      `;
    }).join('');

    return `
      <div class="ascii-word-group ${isGrpSolved ? 'word-locked' : ''}" id="ascii-word-${wIdx}">
        <div class="ascii-word-chips">${chipsHtml}</div>
      </div>
    `;
  }).join('');

  // Stepper UI for Tile 4
  const stepperHtml = data.hasStepper ? `
    <div class="ascii-stepper-control" role="region" aria-label="ASCII Code Stepper Offset">
      <span class="stepper-label">Adjust all codes by:</span>
      <div class="stepper-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-stepper-minus" ${isLocked ? 'disabled' : ''}>-</button>
        <span class="stepper-value mono" id="stepper-val">${stepperOffset > 0 ? '+' : ''}${stepperOffset}</span>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-stepper-plus" ${isLocked ? 'disabled' : ''}>+</button>
      </div>
      <span class="stepper-hint text-muted">Step the offset to match standard ASCII values</span>
    </div>
  ` : '';

  // Caesar UI for Tile 8 Phase 2
  const caesarHtml = data.isCaesarHybrid ? `
    <div class="caesar-phase2-box ${phase2Unlocked ? 'unlocked' : 'locked'}" id="caesar-phase2">
      <div class="caesar-phase2-header">
        <h3 class="caesar-title">Phase 2: Caesar Shift Decoder</h3>
        <span class="caesar-badge mono">${phase2Unlocked ? 'UNLOCKED' : 'LOCKED (Solve Phase 1 first)'}</span>
      </div>
      <p class="caesar-desc">Decoded ciphertext: <strong class="mono" id="caesar-source-text">${data.cipherWords ? data.cipherWords.join(' ') : 'IXWXUH UHDGB'}</strong></p>
      
      <div class="caesar-dial-row">
        <label for="caesar-shift-slider" class="caesar-dial-label">Shift Offset (A-Z):</label>
        <div class="caesar-controls">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-caesar-minus" ${!phase2Unlocked || isLocked ? 'disabled' : ''}>-</button>
          <input 
            type="range" 
            id="caesar-shift-slider" 
            min="0" 
            max="25" 
            value="${caesarShift}" 
            class="caesar-slider" 
            ${!phase2Unlocked || isLocked ? 'disabled' : ''}
          />
          <button type="button" class="btn btn-secondary btn-sm" id="btn-caesar-plus" ${!phase2Unlocked || isLocked ? 'disabled' : ''}>+</button>
          <span class="caesar-shift-num mono" id="caesar-shift-display">${caesarShift}</span>
        </div>
      </div>

      <div class="caesar-preview-box">
        <span class="preview-label">Live Decoded Result:</span>
        <div class="caesar-preview-text mono" id="caesar-preview"></div>
      </div>

      <div class="caesar-action-row">
        <button type="button" class="btn btn-primary" id="btn-caesar-apply" ${!phase2Unlocked || isLocked ? 'disabled' : ''}>
          Confirm Caesar Solution
        </button>
      </div>
    </div>
  ` : '';

  root.innerHTML = `
    <div class="puzzle-interactive-module puzzle-ascii" id="ascii-module-root">
      <!-- Poster Slot Strip -->
      <div class="poster-strip-container" role="region" aria-label="Decoded Poster Fragments">
        <div class="poster-strip-title">Decoded Poster Fragments:</div>
        <div class="poster-strip-slots">${posterSlotsHtml}</div>
      </div>

      ${stepperHtml}

      <!-- Interactive ASCII Words Input Area -->
      <div class="ascii-words-container" role="region" aria-label="ASCII Code Inputs">
        ${wordsHtml}
      </div>

      <!-- Action Buttons -->
      <div class="puzzle-action-bar">
        <button type="button" class="btn btn-primary" id="btn-ascii-check" ${isLocked ? 'disabled' : ''}>
          Check Answer
        </button>
        <span class="action-note text-muted">Filled letters will be verified against ASCII standard</span>
      </div>

      ${caesarHtml}

      ${asciiChartHtml}
    </div>
  `;

  // Bind Listeners
  const moduleRoot = root.querySelector('#ascii-module-root');
  const allInputs = Array.from(moduleRoot.querySelectorAll('.ascii-input'));

  // Save current progress helper
  const persist = () => {
    ctx.saveProgress({
      entries,
      solvedGroups: Array.from(solvedGroups),
      stepperOffset,
      caesarShift,
      phase2Unlocked
    });
  };

  // Auto-advance & Backspace Navigation
  const handleInputNav = (e, index) => {
    const input = e.target;
    const char = input.value;
    const key = input.dataset.key;

    if (char) {
      entries[key] = char.toUpperCase();
      input.value = char.toUpperCase();
      persist();

      // Advance to next enabled input
      for (let i = index + 1; i < allInputs.length; i++) {
        if (!allInputs[i].disabled) {
          allInputs[i].focus();
          allInputs[i].select();
          break;
        }
      }
    } else {
      delete entries[key];
      persist();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value) {
      // Move to previous enabled input
      for (let i = index - 1; i >= 0; i--) {
        if (!allInputs[i].disabled) {
          allInputs[i].focus();
          break;
        }
      }
    } else if (e.key === 'ArrowLeft') {
      for (let i = index - 1; i >= 0; i--) {
        if (!allInputs[i].disabled) {
          allInputs[i].focus();
          break;
        }
      }
    } else if (e.key === 'ArrowRight') {
      for (let i = index + 1; i < allInputs.length; i++) {
        if (!allInputs[i].disabled) {
          allInputs[i].focus();
          break;
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      checkAll();
    }
  };

  allInputs.forEach((inp, idx) => {
    inp.addEventListener('input', (e) => handleInputNav(e, idx));
    inp.addEventListener('keydown', (e) => handleKeyDown(e, idx));
  });

  // Stepper handlers
  if (data.hasStepper) {
    const updateChips = () => {
      const chipNums = moduleRoot.querySelectorAll('.ascii-chip-num');
      chipNums.forEach(el => {
        const base = parseInt(el.dataset.baseCode, 10);
        el.textContent = base + stepperOffset;
      });
      const valEl = moduleRoot.querySelector('#stepper-val');
      if (valEl) valEl.textContent = `${stepperOffset > 0 ? '+' : ''}${stepperOffset}`;
      persist();
    };

    const minusBtn = moduleRoot.querySelector('#btn-stepper-minus');
    const plusBtn = moduleRoot.querySelector('#btn-stepper-plus');

    if (minusBtn) minusBtn.addEventListener('click', () => {
      if (stepperOffset > -5) {
        stepperOffset--;
        updateChips();
      }
    });

    if (plusBtn) plusBtn.addEventListener('click', () => {
      if (stepperOffset < 5) {
        stepperOffset++;
        updateChips();
      }
    });
  }

  // Caesar Phase 2 handlers
  const updateCaesarPreview = () => {
    if (!data.isCaesarHybrid) return;
    const previewEl = moduleRoot.querySelector('#caesar-preview');
    const dispEl = moduleRoot.querySelector('#caesar-shift-display');
    const slider = moduleRoot.querySelector('#caesar-shift-slider');
    if (dispEl) dispEl.textContent = String(caesarShift);
    if (slider) slider.value = String(caesarShift);

    const source = (data.cipherWords || ['IXWXUH', 'UHDGB']).join(' ');
    // A=65..Z=90
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

    const slider = moduleRoot.querySelector('#caesar-shift-slider');
    const minus = moduleRoot.querySelector('#btn-caesar-minus');
    const plus = moduleRoot.querySelector('#btn-caesar-plus');
    const applyBtn = moduleRoot.querySelector('#btn-caesar-apply');

    if (slider) slider.addEventListener('input', (e) => {
      caesarShift = parseInt(e.target.value, 10);
      updateCaesarPreview();
    });

    if (minus) minus.addEventListener('click', () => {
      caesarShift = (caesarShift - 1 + 26) % 26;
      updateCaesarPreview();
    });

    if (plus) plus.addEventListener('click', () => {
      caesarShift = (caesarShift + 1) % 26;
      updateCaesarPreview();
    });

    if (applyBtn) applyBtn.addEventListener('click', () => {
      // Check if caesar preview matches target
      const previewEl = moduleRoot.querySelector('#caesar-preview');
      const text = previewEl ? previewEl.textContent.trim() : '';
      if (text === data.finalText) {
        // Solved final phase!
        solvedGroups.add(2); // Group 3 is slot index 2
        const slotEl = moduleRoot.querySelector('#poster-slot-2');
        if (slotEl) {
          slotEl.classList.add('slot-filled');
          const content = slotEl.querySelector('.slot-content');
          if (content) content.textContent = data.finalText;
        }
        showRewardPopup(root, data.finalText);
        persist();
        ctx.onSolved();
      } else {
        // Wrong shift check
        applyBtn.classList.add('btn-wrong-shake');
        setTimeout(() => applyBtn.classList.remove('btn-wrong-shake'), 400);
        ctx.onWrongCheck();
      }
    });
  }

  // Check verification logic
  const checkAll = () => {
    let anyWrong = false;
    let newlySolved = false;
    let firstWrongInput = null;

    words.forEach((wordObj, wIdx) => {
      if (solvedGroups.has(wIdx)) return;

      let wordFilled = true;
      let wordMatches = true;
      const wordInputs = [];

      wordObj.codes.forEach((code, cIdx) => {
        const key = `w${wIdx}_c${cIdx}`;
        const input = moduleRoot.querySelector(`.ascii-input[data-key="${key}"]`);
        wordInputs.push(input);
        const entered = (entries[key] || '').toUpperCase();
        const expected = wordObj.expectedChars[cIdx].toUpperCase();

        if (!entered) {
          wordFilled = false;
        } else if (entered !== expected) {
          wordMatches = false;
        }
      });

      if (wordFilled && wordMatches) {
        // Solved this word!
        solvedGroups.add(wIdx);
        newlySolved = true;
        wordInputs.forEach(inp => { if (inp) inp.disabled = true; });

        const slotEl = moduleRoot.querySelector(`#poster-slot-${wIdx}`);
        if (slotEl) {
          slotEl.classList.add('slot-filled');
          const content = slotEl.querySelector('.slot-content');
          if (content) content.textContent = wordObj.expectedText || wordObj.expectedChars.join('');
        }
        showRewardPopup(root, wordObj.expectedText || wordObj.expectedChars.join(''));
      } else if (wordFilled && !wordMatches) {
        anyWrong = true;
        wordInputs.forEach(inp => {
          if (inp && (entries[inp.dataset.key] || '').toUpperCase() !== wordObj.expectedChars[parseInt(inp.dataset.char, 10)].toUpperCase()) {
            inp.classList.add('input-wrong');
            if (!firstWrongInput) firstWrongInput = inp;
          }
        });
      }
    });

    persist();

    // Handle phase 2 unlock for Tile 8
    if (data.isCaesarHybrid && !phase2Unlocked) {
      if (solvedGroups.has(0) && solvedGroups.has(1)) {
        phase2Unlocked = true;
        const p2Box = moduleRoot.querySelector('#caesar-phase2');
        if (p2Box) {
          p2Box.classList.remove('locked');
          p2Box.classList.add('unlocked');
          p2Box.querySelector('.caesar-badge').textContent = 'UNLOCKED';
          const slider = p2Box.querySelector('#caesar-shift-slider');
          const minus = p2Box.querySelector('#btn-caesar-minus');
          const plus = p2Box.querySelector('#btn-caesar-plus');
          const apply = p2Box.querySelector('#btn-caesar-apply');
          if (slider) slider.disabled = false;
          if (minus) minus.disabled = false;
          if (plus) plus.disabled = false;
          if (apply) apply.disabled = false;
        }
        persist();
      }
    }

    if (anyWrong) {
      const wrongInputs = moduleRoot.querySelectorAll('.input-wrong');
      wrongInputs.forEach(inp => {
        inp.classList.add('input-shake');
      });

      setTimeout(() => {
        wrongInputs.forEach(inp => {
          inp.classList.remove('input-shake');
          inp.classList.remove('input-wrong');
          inp.value = '';
          delete entries[inp.dataset.key];
        });
        if (firstWrongInput) firstWrongInput.focus();
        persist();
      }, 450);

      ctx.onWrongCheck();
    }

    // Check if entire puzzle is solved
    if (!data.isCaesarHybrid) {
      if (solvedGroups.size === words.length) {
        ctx.onSolved();
      }
    }
  };

  const checkBtn = moduleRoot.querySelector('#btn-ascii-check');
  if (checkBtn) {
    checkBtn.addEventListener('click', checkAll);
  }

  activeCleanup = () => {
    // Unbind listeners, clear references
    allInputs.forEach(inp => {
      inp.replaceWith(inp.cloneNode(true));
    });
  };
}
