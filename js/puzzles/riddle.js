/**
 * Future Quest 2026 - Riddle Puzzle Module
 * 
 * Interactive riddle workstation featuring poetic/cryptic clues,
 * auto-advancing tactile keycap letter slots, live sentence preview,
 * and server-validated stamping feedback.
 */

import { PUZZLE_ART } from './art.js';

let currentCtx = null;
let currentData = null;
let containerEl = null;

export function mount(root, data, ctx) {
  currentCtx = ctx;
  currentData = data;
  containerEl = root;

  const isLocked = ctx.isLocked ? ctx.isLocked() : false;
  const progress = ctx.getProgress ? ctx.getProgress() : {};
  const savedLetters = progress.enteredLetters || {};

  const words = data.words || [
    { name: "Word 1", length: 8 }
  ];

  let slotsHtml = '';
  let globalSlotIndex = 0;

  words.forEach((wordInfo, wIdx) => {
    slotsHtml += `<div class="riddle-word-group" data-word-idx="${wIdx}">`;
    slotsHtml += `<div class="riddle-word-label mono">${wordInfo.name || `Word ${wIdx + 1}`} (${wordInfo.length} letters)</div>`;
    slotsHtml += `<div class="riddle-slots-row">`;

    for (let i = 0; i < wordInfo.length; i++) {
      const slotKey = `${wIdx}_${i}`;
      const charVal = (savedLetters[slotKey] || '').toUpperCase();
      slotsHtml += `
        <div class="riddle-slot-wrap" data-slot-key="${slotKey}" data-global-idx="${globalSlotIndex}">
          <input 
            type="text" 
            class="riddle-letter-slot mono keycap" 
            maxlength="1" 
            value="${charVal}"
            data-slot-key="${slotKey}"
            data-word-idx="${wIdx}"
            data-char-idx="${i}"
            data-global-idx="${globalSlotIndex}"
            autocomplete="off"
            spellcheck="false"
            ${isLocked ? 'disabled' : ''}
            aria-label="${wordInfo.name || `Word ${wIdx + 1}`}, letter ${i + 1}"
          />
        </div>
      `;
      globalSlotIndex++;
    }

    slotsHtml += `</div></div>`;
  });

  root.innerHTML = `
    <div class="riddle-workstation" role="region" aria-label="Cryptic Riddle Workstation">
      <div class="riddle-card keycap">
        <div class="riddle-header-row">
          <span class="riddle-category-pill mono">
            <span class="riddle-icon" aria-hidden="true">${PUZZLE_ART.scroll || ''}</span>
            <span>${data.categoryTag || 'IDENTITY DECRYPTION PROTOCOL'}</span>
          </span>
          <span class="riddle-format-badge mono">${data.formatBadge || 'TYPE THE ANSWER'}</span>
        </div>

        ${data.imageUrl ? `
          <div class="riddle-image-preview-box">
            <a href="${data.imageUrl}" target="_blank" rel="noopener" class="riddle-image-link" title="Click to view full high-resolution image">
              <img src="${data.imageUrl}" alt="${data.categoryTag || 'Visual Clue'}" class="riddle-clue-img" />
              <div class="riddle-zoom-pill mono">🔍 Tap or click to view full resolution</div>
            </a>
          </div>
        ` : ''}

        <blockquote class="riddle-quote-block">
          ${(data.riddleLines || []).map(line => `<p class="riddle-line">${line}</p>`).join('')}
        </blockquote>
      </div>

      <!-- Live Sentence Preview -->
      <div class="riddle-preview-strip" aria-live="polite">
        <span class="riddle-preview-label mono">YOUR DEDUCTION:</span>
        <span class="riddle-preview-value mono" id="riddle-live-preview">...</span>
      </div>

      <!-- Tactile Word Slot Rows -->
      <div class="riddle-words-container ${isLocked ? 'riddle-locked' : ''}" id="riddle-words-container">
        ${slotsHtml}
      </div>

      <div class="riddle-status-bar" id="riddle-status-bar">
        ${isLocked ? '<span class="riddle-stamp-badge mono">STAMPED: SOLVED</span>' : '<span class="riddle-helper-text mono">Type letters into keycaps or paste string. Backspace moves backward.</span>'}
      </div>
    </div>
  `;

  setupEventListeners();
  updateLivePreview();
}

function setupEventListeners() {
  if (!containerEl) return;

  const slots = Array.from(containerEl.querySelectorAll('.riddle-letter-slot'));

  slots.forEach((slot, idx) => {
    const wIdx = parseInt(slot.dataset.wordIdx, 10);
    const cIdx = parseInt(slot.dataset.charIdx, 10);

    // Input event: auto advance within same word only
    slot.addEventListener('input', (e) => {
      const val = (e.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      e.target.value = val ? val[val.length - 1] : '';

      persistLetters();
      updateLivePreview();

      if (e.target.value) {
        const nextInSameWord = containerEl.querySelector(`.riddle-letter-slot[data-word-idx="${wIdx}"][data-char-idx="${cIdx + 1}"]`);
        if (nextInSameWord && !nextInSameWord.disabled) {
          nextInSameWord.focus();
          nextInSameWord.select();
        }
      }
    });

    // Keydown event: Backspace backward navigation & arrow navigation within same word
    slot.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && cIdx > 0) {
        const prevInSameWord = containerEl.querySelector(`.riddle-letter-slot[data-word-idx="${wIdx}"][data-char-idx="${cIdx - 1}"]`);
        if (prevInSameWord && !prevInSameWord.disabled) {
          prevInSameWord.focus();
          prevInSameWord.select();
        }
      } else if (e.key === 'ArrowRight') {
        const nextInSameWord = containerEl.querySelector(`.riddle-letter-slot[data-word-idx="${wIdx}"][data-char-idx="${cIdx + 1}"]`);
        if (nextInSameWord && !nextInSameWord.disabled) {
          nextInSameWord.focus();
          nextInSameWord.select();
        }
      } else if (e.key === 'ArrowLeft' && cIdx > 0) {
        const prevInSameWord = containerEl.querySelector(`.riddle-letter-slot[data-word-idx="${wIdx}"][data-char-idx="${cIdx - 1}"]`);
        if (prevInSameWord && !prevInSameWord.disabled) {
          prevInSameWord.focus();
          prevInSameWord.select();
        }
      } else if (e.key === 'Enter') {
        checkAnswer();
      }
    });

    // Paste event: distribute pasted text across remaining slots
    slot.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const clean = (pasted || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      let cur = idx;
      for (let i = 0; i < clean.length && cur < slots.length; i++) {
        slots[cur].value = clean[i];
        cur++;
      }
      persistLetters();
      updateLivePreview();
      if (cur < slots.length) {
        slots[cur].focus();
      } else {
        slots[slots.length - 1].focus();
      }
    });
  });
}

function persistLetters() {
  if (!containerEl || !currentCtx) return;
  const slots = containerEl.querySelectorAll('.riddle-letter-slot');
  const enteredLetters = {};
  slots.forEach(slot => {
    const key = slot.getAttribute('data-slot-key');
    if (key) enteredLetters[key] = (slot.value || '').toUpperCase();
  });
  if (currentCtx.saveProgress) {
    currentCtx.saveProgress({ enteredLetters });
  }
}

function getCurrentDeduction() {
  if (!containerEl || !currentData) return '';
  const words = currentData.words || [];
  const wordsText = [];

  words.forEach((w, wIdx) => {
    const wordSlots = Array.from(containerEl.querySelectorAll(`.riddle-letter-slot[data-word-idx="${wIdx}"]`));
    const chars = wordSlots.map(s => (s.value || '_').toUpperCase());
    wordsText.push(chars.join(''));
  });

  return wordsText.join(' ');
}

function updateLivePreview() {
  if (!containerEl) return;
  const previewEl = containerEl.querySelector('#riddle-live-preview');
  if (previewEl) {
    const text = getCurrentDeduction();
    previewEl.textContent = text || '...';
  }
}

export async function checkAnswer() {
  if (!containerEl || !currentData || !currentCtx) return;
  if (currentCtx.isLocked && currentCtx.isLocked()) return;

  const currentText = getCurrentDeduction().replace(/_/g, '').trim().toUpperCase();
  if (!currentText) return;

  const statusBar = containerEl.querySelector('#riddle-status-bar');
  if (statusBar) {
    statusBar.innerHTML = '<span class="riddle-helper-text mono" style="color: #F59E0B;">Validating with contest server...</span>';
  }

  try {
    let result = null;
    if (typeof currentCtx.checkAnswer === 'function') {
      result = await currentCtx.checkAnswer(currentText);
    }

    if (result && result.correct) {
      // Solved!
      const slots = containerEl.querySelectorAll('.riddle-letter-slot');
      slots.forEach(s => {
        s.disabled = true;
        s.classList.add('slot-solved');
      });
      if (statusBar) {
        statusBar.innerHTML = '<span class="riddle-stamp-badge mono">STAMPED: SOLVED</span>';
      }
      const container = containerEl.querySelector('#riddle-words-container');
      if (container) container.classList.add('riddle-locked');

      if (currentCtx.onSolved) {
        currentCtx.onSolved(result);
      }
    } else {
      // Wrong check
      const wordsContainer = containerEl.querySelector('#riddle-words-container');
      if (wordsContainer) {
        wordsContainer.classList.add('key-shake');
        setTimeout(() => wordsContainer.classList.remove('key-shake'), 400);
      }
      if (statusBar) {
        statusBar.innerHTML = `<span class="riddle-helper-text mono" style="color: #EF4444;">${result?.message || 'Incorrect deduction. Check your clues.'}</span>`;
      }
      if (currentCtx.onWrongCheck) {
        currentCtx.onWrongCheck(result);
      }
    }
  } catch (err) {
    if (statusBar) {
      statusBar.innerHTML = `<span class="riddle-helper-text mono" style="color: #EF4444;">Verification error: ${err.message}</span>`;
    }
  }
}

export function unmount() {
  currentCtx = null;
  currentData = null;
  containerEl = null;
}
