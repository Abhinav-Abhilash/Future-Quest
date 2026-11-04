/**
 * Future Quest 2026 - Puzzle Reward Popup
 * 
 * Displays a transient reward badge whenever a word or group is solved.
 * Rotates through the 6 art icons, animates transform & opacity,
 * and announces to screen readers via aria-live.
 */

import { PUZZLE_ART, ART_KEYS } from './art.js';

let iconCounter = 0;

/**
 * Trigger reward popup overlay over the puzzle container.
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

  // Ensure positioning context
  const targetParent = rootContainer.querySelector('.puzzle-screen') || rootContainer;
  const originalPos = window.getComputedStyle(targetParent).position;
  if (originalPos === 'static') {
    targetParent.style.position = 'relative';
  }

  targetParent.appendChild(popup);

  const isLite = document.body.classList.contains('lite-mode') || 
                (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (isLite) {
    popup.classList.add('lite-mode');
    setTimeout(() => {
      popup.remove();
    }, 1200);
  } else {
    // Normal animation: fade/scale in (180ms), hold (700ms), fade out (300ms)
    requestAnimationFrame(() => {
      popup.classList.add('show');
    });

    setTimeout(() => {
      popup.classList.remove('show');
      popup.classList.add('hide');
      setTimeout(() => {
        popup.remove();
      }, 320);
    }, 880);
  }
}
