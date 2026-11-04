/**
 * Future Quest 2026 - FX & Interaction Engine
 * 
 * Implements purpose-driven, lightweight visual feedback:
 * - Lantern hero spotlight & secret glyphs discovery
 * - Prize figures count-up via IntersectionObserver
 * - Self-drawing dotted route line
 * - Interactive 3D preview card flips
 * - Game tile press feedback & shine sweeps
 * - Dynamic clue pouch strip & timer progress bars
 * - Key attempts & lantern hints visualization
 * - 16-piece CSS particle solve burst
 * 
 * Strict Performance Rules:
 * - No external libraries (pure vanilla JS and CSS)
 * - Animate only transform and opacity
 * - Auto-detect low-end devices and respect prefers-reduced-motion
 * - All effects behind CONFIG.EFFECTS flags and "Reduce effects" toggle
 */

import { CONFIG } from './config.js';
import { ICONS } from './icons.js';

export const Fx = {
  activeRaf: null,
  secretsFound: new Set(),

  /**
   * Determine whether animations should run in Lite Mode.
   */
  isLiteMode() {
    const saved = localStorage.getItem('future_quest_reduce_effects');
    if (saved !== null) {
      return saved === 'true';
    }
    // Respect OS setting
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    // Auto-detect low-power / budget devices
    if (typeof navigator !== 'undefined') {
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
      if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
    }
    return false;
  },

  /**
   * Toggle lite mode manually.
   */
  setLiteMode(enabled) {
    localStorage.setItem('future_quest_reduce_effects', enabled ? 'true' : 'false');
    document.documentElement.classList.toggle('lite-mode', enabled);
    document.documentElement.classList.toggle('reduce-motion', enabled);

    // Update all toggle buttons in DOM
    document.querySelectorAll('.btn-reduce-effects').forEach(btn => {
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      const textSpan = btn.querySelector('.reduce-effects-text');
      if (textSpan) {
        textSpan.textContent = enabled ? 'Effects: Minimal' : 'Effects: Standard';
      }
    });
  },

  /**
   * Initialize reduce-effects toggle buttons and sync DOM classes.
   */
  initLiteModeSync() {
    const isLite = this.isLiteMode();
    document.documentElement.classList.toggle('lite-mode', isLite);
    document.documentElement.classList.toggle('reduce-motion', isLite);

    // Load any previously saved secret glyph discoveries from sessionStorage
    try {
      const savedSecrets = sessionStorage.getItem('future_quest_secrets_found');
      if (savedSecrets) {
        const arr = JSON.parse(savedSecrets);
        if (Array.isArray(arr)) {
          arr.forEach(id => this.secretsFound.add(String(id)));
        }
      }
    } catch (e) {}

    // Delegated listener for any reduce effects buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-reduce-effects');
      if (btn) {
        const current = this.isLiteMode();
        this.setLiteMode(!current);
      }
    });
  },

  // =========================================================================
  // 1. LANTERN HERO SPOTLIGHT (Landing)
  // =========================================================================
  initLanternHero(heroElement) {
    if (!heroElement) return;
    if (!CONFIG.EFFECTS.lanternHero || this.isLiteMode()) {
      // In lite mode, ensure glyphs are revealed or non-blocking
      heroElement.querySelectorAll('.hero-secret-glyph').forEach(g => g.classList.add('is-revealed'));
      return;
    }

    const lanternLayer = heroElement.querySelector('.hero-lantern-layer');
    if (!lanternLayer) return;

    const glyphs = Array.from(heroElement.querySelectorAll('.hero-secret-glyph'));
    let rafScheduled = false;
    let targetX = 0;
    let targetY = 0;

    // Restore found glyphs from session
    this.secretsFound.forEach(id => {
      const match = heroElement.querySelector(`.hero-secret-glyph[data-glyph-id="${id}"]`);
      if (match) match.classList.add('is-revealed');
    });
    this.updateSecretsCounter();

    const updateSpotlight = () => {
      rafScheduled = false;
      heroElement.style.setProperty('--mouse-x', `${targetX}px`);
      heroElement.style.setProperty('--mouse-y', `${targetY}px`);

      // Check proximity to glyphs
      glyphs.forEach(glyph => {
        if (glyph.classList.contains('is-revealed')) return;
        const rect = glyph.getBoundingClientRect();
        const heroRect = heroElement.getBoundingClientRect();

        const glyphCenterX = rect.left - heroRect.left + rect.width / 2;
        const glyphCenterY = rect.top - heroRect.top + rect.height / 2;

        const dist = Math.hypot(targetX - glyphCenterX, targetY - glyphCenterY);
        // Reveal threshold radius ~85px
        if (dist < 85) {
          glyph.classList.add('is-revealed');
          const id = glyph.dataset.glyphId;
          if (id) {
            this.secretsFound.add(id);
            try {
              sessionStorage.setItem('future_quest_secrets_found', JSON.stringify(Array.from(this.secretsFound)));
            } catch (e) {}
            this.updateSecretsCounter();

            if (this.secretsFound.size === 3) {
              this.showToast('Map decoded! All 3 secret glyphs found.');
            }
          }
        }
      });
    };

    const onPointerMove = (e) => {
      if (document.hidden) return;
      const rect = heroElement.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      targetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      targetY = Math.max(0, Math.min(rect.height, clientY - rect.top));

      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(updateSpotlight);
      }
    };

    heroElement.addEventListener('mousemove', onPointerMove, { passive: true });
    heroElement.addEventListener('touchmove', onPointerMove, { passive: true });
    heroElement.addEventListener('touchstart', onPointerMove, { passive: true });
  },

  updateSecretsCounter() {
    const counterEl = document.getElementById('secrets-counter-val');
    if (counterEl) {
      counterEl.textContent = `${this.secretsFound.size}/3`;
    }
  },

  // =========================================================================
  // 2. PRIZE FIGURES COUNT-UP (IntersectionObserver)
  // =========================================================================
  initPrizeCountUp(container) {
    if (!container) return;
    const counters = container.querySelectorAll('.prize-counter[data-target]');
    if (!counters.length) return;

    if (!CONFIG.EFFECTS.prizeCountUp || this.isLiteMode()) {
      // Immediate format for reduced motion
      counters.forEach(el => {
        const val = parseInt(el.dataset.target, 10) || 0;
        el.textContent = `₹ ${val.toLocaleString('en-IN')}`;
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          this.animateCounter(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach(el => observer.observe(el));
  },

  animateCounter(element) {
    const target = parseInt(element.dataset.target, 10) || 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * target);
      element.textContent = `₹ ${current.toLocaleString('en-IN')}`;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        element.textContent = `₹ ${target.toLocaleString('en-IN')}`;
      }
    };

    requestAnimationFrame(frame);
  },

  // =========================================================================
  // 3. HOW IT WORKS DOTTED ROUTE DRAW
  // =========================================================================
  initRoutePathDraw(container) {
    if (!container) return;
    const routeContainer = container.querySelector('.landing-steps-route');
    if (!routeContainer) return;

    if (!CONFIG.EFFECTS.routePathDraw || this.isLiteMode()) {
      routeContainer.classList.add('is-drawn');
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          routeContainer.classList.add('is-drawn');
        }
      });
    }, { threshold: 0.15 });

    observer.observe(routeContainer);
  },

  // =========================================================================
  // 4. GRID PREVIEW TILE TILT & FLIP
  // =========================================================================
  initGridPreviewFlip(container) {
    if (!container) return;
    const cards = container.querySelectorAll('.preview-tile-card');
    if (!cards.length) return;

    cards.forEach(card => {
      // Toggle flip on tap/click
      card.addEventListener('click', () => {
        if (!CONFIG.EFFECTS.gridPreviewFlip) return;
        card.classList.toggle('is-flipped');
      });

      // Subtle 3D tilt on hover (max 4 degrees)
      if (CONFIG.EFFECTS.gridPreviewFlip && !this.isLiteMode()) {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      }
    });
  },

  // =========================================================================
  // 5. GAME TILE MOTION & SUBMIT PULSE
  // =========================================================================
  initTileMotion(container, state) {
    if (!container || !CONFIG.EFFECTS.tileMotion || this.isLiteMode()) return;

    const tiles = container.querySelectorAll('.tile-puzzle:not([disabled])');
    tiles.forEach(tile => {
      tile.addEventListener('mousemove', (e) => {
        const rect = tile.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tile.style.transform = `perspective(500px) translateY(-3px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });

      tile.addEventListener('mouseleave', () => {
        tile.style.transform = '';
      });
    });

    // Submit tile pulse check: if all 11 puzzles are SOLVED or FAILED
    const vaultBtn = container.querySelector('#tile-vault-btn');
    if (vaultBtn && state && state.blocks) {
      const puzzleIds = Object.keys(state.blocks);
      const allFinished = puzzleIds.length === 11 && puzzleIds.every(id => {
        const st = state.blocks[id].status;
        return st === 'SOLVED' || st === 'FAILED';
      });

      if (allFinished && !state.vaultEntered) {
        vaultBtn.classList.add('submit-ready-pulse');
      } else {
        vaultBtn.classList.remove('submit-ready-pulse');
      }
    }
  },

  // =========================================================================
  // 6. CLUE POUCH STRIP
  // =========================================================================
  updateCluePouch(pouchElement, state) {
    if (!pouchElement || !CONFIG.EFFECTS.cluePouch) return;
    if (!state || !state.blocks) {
      pouchElement.style.display = 'none';
      return;
    }

    pouchElement.style.display = 'flex';
    const gridOrder = state.gridOrder || [];
    let slotsHtml = '';
    let solvedCount = 0;

    gridOrder.forEach((itemId, idx) => {
      if (itemId === 'vault_12' || idx >= 11) return;
      const taskNum = idx + 1;
      const block = state.blocks[itemId] || { status: 'UNOPENED' };

      if (block.status === 'SOLVED') {
        solvedCount++;
        slotsHtml += `
          <div class="pouch-slot is-solved" title="Task ${taskNum}: Clue Unlocked" aria-label="Task ${taskNum}: Clue Unlocked">
            <span class="slot-icon">${ICONS.gem}</span>
            <span class="slot-num mono">${String(taskNum).padStart(2, '0')}</span>
          </div>
        `;
      } else if (block.status === 'FAILED') {
        slotsHtml += `
          <div class="pouch-slot is-failed" title="Task ${taskNum}: Sealed for good" aria-label="Task ${taskNum}: Sealed for good">
            <span class="slot-icon">${ICONS.gemCracked}</span>
            <span class="slot-num mono">${String(taskNum).padStart(2, '0')}</span>
          </div>
        `;
      } else {
        slotsHtml += `
          <div class="pouch-slot is-empty" title="Task ${taskNum}: Unsolved" aria-label="Task ${taskNum}: Unsolved">
            <span class="slot-bullet"></span>
            <span class="slot-num mono">${String(taskNum).padStart(2, '0')}</span>
          </div>
        `;
      }
    });

    pouchElement.innerHTML = `
      <div class="pouch-inner">
        <div class="pouch-label">
          <span class="pouch-icon">${ICONS.chest}</span>
          <span class="pouch-title">Clue Pouch</span>
          <span class="pouch-score mono">${solvedCount}/11</span>
        </div>
        <div class="pouch-slots" role="region" aria-label="Clue inventory pouch">
          ${slotsHtml}
        </div>
        <div class="sr-only" aria-live="polite" id="clue-pouch-announcer">
          ${solvedCount} of 11 clues unlocked.
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 7. ATTEMPTS KEYS & HINTS LANTERNS
  // =========================================================================
  renderAttemptsKeys(attemptsUsed, maxAttempts = 3) {
    const remaining = Math.max(0, maxAttempts - attemptsUsed);
    let keysHtml = '';
    for (let i = 1; i <= maxAttempts; i++) {
      const isBroken = i > remaining;
      keysHtml += `
        <span class="attempt-key ${isBroken ? 'key-broken' : 'key-intact'}" title="${isBroken ? 'Attempt spent' : 'Attempt available'}">
          ${isBroken ? ICONS.keyBroken : ICONS.key}
        </span>
      `;
    }
    return `
      <div class="attempts-keys-display" aria-label="${remaining} of ${maxAttempts} attempts remaining">
        <span class="attempts-keys-label">Keys:</span>
        <div class="attempts-keys-row">${keysHtml}</div>
        <span class="attempts-keys-count mono">${remaining}/${maxAttempts}</span>
      </div>
    `;
  },

  renderHintsLanterns(hintsRemaining, totalHints = 3) {
    let lanternsHtml = '';
    for (let i = 1; i <= totalHints; i++) {
      const isLit = i <= hintsRemaining;
      lanternsHtml += `
        <span class="hint-lantern ${isLit ? 'lantern-lit' : 'lantern-dark'}" title="${isLit ? 'Lantern lit' : 'Lantern extinguished'}">
          ${isLit ? ICONS.lanternLit : ICONS.lanternDark}
        </span>
      `;
    }
    return `
      <div class="hints-lanterns-display" aria-label="${hintsRemaining} of ${totalHints} hints remaining">
        <span class="hints-lanterns-label">Lanterns:</span>
        <div class="hints-lanterns-row">${lanternsHtml}</div>
        <span class="hints-lanterns-count mono">${hintsRemaining}/${totalHints}</span>
      </div>
    `;
  },

  triggerInputShake(element) {
    if (!element) return;
    element.classList.remove('input-shake');
    // Force reflow
    void element.offsetWidth;
    element.classList.add('input-shake');
    setTimeout(() => {
      element.classList.remove('input-shake');
    }, 280);
  },

  // =========================================================================
  // 8. SOLVE MOMENT PARTICLE BURST (Max 16 pieces, CSS-only)
  // =========================================================================
  triggerSolveBurst(anchorElement) {
    if (!anchorElement || !CONFIG.EFFECTS.solveBurst || this.isLiteMode()) return;

    const burstContainer = document.createElement('div');
    burstContainer.className = 'solve-burst-container';
    burstContainer.setAttribute('aria-hidden', 'true');

    // 16 CSS spark particles
    const particleCount = 16;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 2 * Math.PI;
      const dist = 40 + Math.random() * 45; // 40px to 85px
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const rot = Math.floor(Math.random() * 360);

      const spark = document.createElement('span');
      spark.className = 'solve-spark';
      spark.style.setProperty('--dx', `${dx.toFixed(1)}px`);
      spark.style.setProperty('--dy', `${dy.toFixed(1)}px`);
      spark.style.setProperty('--rot', `${rot}deg`);
      burstContainer.appendChild(spark);
    }

    anchorElement.appendChild(burstContainer);
    setTimeout(() => {
      burstContainer.remove();
    }, 850);
  },

  // =========================================================================
  // 9. TIMER PROGRESS BARS
  // =========================================================================
  updateMasterProgressBar(remainingSec, totalSec = 7200) {
    if (!CONFIG.EFFECTS.timerBars) return;
    const bar = document.getElementById('master-timer-progress');
    if (!bar) return;

    const ratio = Math.max(0, Math.min(1, remainingSec / totalSec));
    bar.style.transform = `scaleX(${ratio})`;

    if (remainingSec <= 600) {
      bar.classList.add('bar-amber');
    } else {
      bar.classList.remove('bar-amber');
    }
  },

  updatePuzzleProgressBar(remainingSec, totalSec) {
    if (!CONFIG.EFFECTS.timerBars) return;
    const bar = document.getElementById('puzzle-timer-progress');
    if (!bar) return;

    const ratio = totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0;
    bar.style.transform = `scaleX(${ratio})`;

    if (remainingSec <= 120) {
      bar.classList.add('bar-amber');
    } else {
      bar.classList.remove('bar-amber');
    }
  },

  // =========================================================================
  // 10. TOAST NOTIFICATION
  // =========================================================================
  showToast(message) {
    let toast = document.getElementById('fx-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fx-toast';
      toast.className = 'fx-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');

    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3200);
  }
};
