/**
 * Future Quest 2026 - Puzzle Reward Popup & Motion Utilities
 * 
 * Displays transient reward badges, coordinates FLIP word slide animations,
 * and handles tactile wrong feedback with vibration guarding.
 */

import { PUZZLE_ART, ART_KEYS } from './art.js';

let iconCounter = 0;

/**
 * Check if the user has requested reduced motion or lite mode.
 */
export function isReducedMotion() {
  return document.body.classList.contains('lite-mode') || 
         (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Trigger reward popup overlay centered over the stage.
 * @param {HTMLElement} rootContainer - The container element to attach popup into
 * @param {string} word - The solved word or fragment label
 */
export function showRewardPopup(rootContainer, word) {
  if (!rootContainer) return;

  // Screen reader announcement
  let liveRegion = document.getElementById('puzzle-sr-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'puzzle-sr-announcer';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = `Word correct: ${word}`;

  // Pick next rotating icon
  const currentKey = ART_KEYS[iconCounter % ART_KEYS.length];
  iconCounter++;
  const iconSvg = PUZZLE_ART[currentKey] || PUZZLE_ART.gem;

  // Build popup element
  const popup = document.createElement('div');
  popup.className = 'puzzle-reward-popup';
  popup.setAttribute('aria-hidden', 'true');
  popup.innerHTML = `
    <div class="reward-popup-inner">
      <div class="reward-popup-icon">${iconSvg}</div>
      <div class="reward-popup-text">
        <span class="reward-popup-label">Solved</span>
        <span class="reward-popup-word mono">${word}</span>
      </div>
    </div>
  `;

  // Target the STAGE so popup centers over the active puzzle stage
  const targetParent = rootContainer.querySelector('#puzzle-stage') || 
                       rootContainer.querySelector('.puzzle-stage') || 
                       rootContainer.querySelector('.puzzle-screen') || 
                       rootContainer;
  const originalPos = window.getComputedStyle(targetParent).position;
  if (originalPos === 'static') {
    targetParent.style.position = 'relative';
  }

  targetParent.appendChild(popup);

  if (isReducedMotion()) {
    popup.classList.add('lite-mode');
    setTimeout(() => popup.remove(), 1200);
  } else {
    requestAnimationFrame(() => popup.classList.add('show'));
    setTimeout(() => {
      popup.classList.remove('show');
      popup.classList.add('hide');
      setTimeout(() => popup.remove(), 320);
    }, 880);
  }
}

/**
 * Coordinated Group Lock Sequence:
 * 1. Staggered pulse across source tiles (40ms each)
 * 2. FLIP animation sliding the finished word from source bounding box to poster slot (320ms)
 * 3. Stamps word into poster slot and triggers reward popup.
 */
export function animateGroupLock(sourceEls, targetSlot, word, rootContainer, onComplete) {
  const isReduced = isReducedMotion();

  if (isReduced || !targetSlot) {
    if (targetSlot) {
      targetSlot.classList.add('slot-filled', 'slot-stamped');
      const content = targetSlot.querySelector('.slot-content');
      if (content) content.textContent = word;
    }
    showRewardPopup(rootContainer, word);
    if (onComplete) onComplete();
    return;
  }

  const els = Array.isArray(sourceEls) ? sourceEls.filter(Boolean) : [sourceEls].filter(Boolean);

  // 1. Pulse sequence across tiles
  els.forEach((el, idx) => {
    setTimeout(() => {
      el.classList.add('tile-lock-pulse');
      setTimeout(() => el.classList.remove('tile-lock-pulse'), 280);
    }, idx * 40);
  });

  const pulseDelay = Math.max(120, els.length * 40);

  // 2. FLIP slide animation into poster slot
  setTimeout(() => {
    let sourceRect;
    if (els.length > 0) {
      const first = els[0].getBoundingClientRect();
      const last = els[els.length - 1].getBoundingClientRect();
      sourceRect = {
        top: Math.min(first.top, last.top),
        left: Math.min(first.left, last.left),
        width: Math.max(first.right, last.right) - Math.min(first.left, last.left),
        height: Math.max(first.bottom, last.bottom) - Math.min(first.top, last.top)
      };
    } else {
      sourceRect = targetSlot.getBoundingClientRect();
    }

    const targetRect = targetSlot.getBoundingClientRect();

    const clone = document.createElement('div');
    clone.className = 'flight-word-clone mono';
    clone.textContent = word;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.left = `${sourceRect.left}px`;
    clone.style.width = `${Math.max(64, sourceRect.width)}px`;
    clone.style.height = `${Math.max(36, sourceRect.height)}px`;
    document.body.appendChild(clone);

    const deltaX = targetRect.left - sourceRect.left;
    const deltaY = targetRect.top - sourceRect.top;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.9)`;
      clone.style.opacity = '0.9';
    });

    setTimeout(() => {
      clone.remove();
      targetSlot.classList.add('slot-filled', 'slot-stamped');
      const content = targetSlot.querySelector('.slot-content');
      if (content) content.textContent = word;
      showRewardPopup(rootContainer, word);
      if (onComplete) onComplete();
    }, 320);
  }, pulseDelay);
}

/**
 * Handle wrong check attempt feedback with tactile vibration.
 */
export function playWrongFeedback(wrongElements, msgContainer) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(30);
    } catch (e) {}
  }

  const els = Array.isArray(wrongElements) ? wrongElements.filter(Boolean) : [wrongElements].filter(Boolean);
  els.forEach(el => {
    el.classList.add('input-wrong', 'input-shake');
    setTimeout(() => el.classList.remove('input-shake'), 450);
  });

  if (msgContainer) {
    msgContainer.textContent = 'Not quite';
    msgContainer.style.display = 'block';
    setTimeout(() => {
      msgContainer.style.display = 'none';
    }, 2000);
  }
}
