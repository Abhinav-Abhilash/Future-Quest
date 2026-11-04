/**
 * Future Quest 2026 - Landing Page Interactivity Engine
 * 
 * Lightweight scoped interactivity for #/landing:
 * - IntersectionObserver to pause gallery drift when offscreen
 * - Tab visibility listener to pause drift when the tab is hidden
 * - 3D card tilt on hover (max 4deg) and 3D card flip on click/tap/Enter
 * - 3 secret glints discovery with toast notifications & footer counter
 * - Reduced motion and lite-mode handling
 */

let galleryObserver = null;
let visibilityHandler = null;
const secretsFound = new Set();

/**
 * Initialize all landing page interactions.
 */
export function initLanding() {
  const galleryEl = document.querySelector('.clue-gallery-section');

  // 1. Restore secret glints from sessionStorage
  try {
    const saved = sessionStorage.getItem('future_quest_secrets_found');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        arr.forEach(id => secretsFound.add(String(id)));
      }
    }
  } catch (e) {}
  updateSecretsCounter();

  // Highlight already-discovered glints
  secretsFound.forEach(id => {
    document.querySelectorAll(`.card-secret-glint[data-secret-id="${id}"]`).forEach(el => {
      el.classList.add('is-found');
    });
  });

  // 2. Setup IntersectionObserver to start/pause drift when on/off screen
  if (galleryEl && 'IntersectionObserver' in window) {
    if (galleryObserver) galleryObserver.disconnect();
    galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          galleryEl.classList.remove('gallery-paused');
        } else {
          galleryEl.classList.add('gallery-paused');
        }
      });
    }, { threshold: 0.05 });
    galleryObserver.observe(galleryEl);
  }

  // 3. Tab visibility listener
  if (!visibilityHandler) {
    visibilityHandler = () => {
      if (document.hidden) {
        if (galleryEl) galleryEl.classList.add('gallery-paused');
      } else {
        if (galleryEl) galleryEl.classList.remove('gallery-paused');
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }

  // 4. Card flip and hover tilt
  const cards = document.querySelectorAll('.clue-card');
  cards.forEach(card => {
    if (card._lpBound) return;
    card._lpBound = true;

    // Flip on click/tap
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-secret-glint')) return;
      card.classList.toggle('is-flipped');
    });

    // Flip on Enter or Space key
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
      }
    });

    // Tilt on hover (max 4 degrees) - non-lite mode only
    card.addEventListener('mousemove', (e) => {
      if (document.body.classList.contains('lite-mode') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (card.classList.contains('is-flipped')) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // 5. Secret glints discovery
  document.querySelectorAll('.card-secret-glint').forEach(glint => {
    if (glint._lpBound) return;
    glint._lpBound = true;

    glint.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = glint.dataset.secretId;
      if (!id) return;

      if (!secretsFound.has(id)) {
        secretsFound.add(id);
        glint.classList.add('is-found');
        try {
          sessionStorage.setItem('future_quest_secrets_found', JSON.stringify(Array.from(secretsFound)));
        } catch (err) {}
        updateSecretsCounter();

        if (secretsFound.size === 3) {
          showToast('Map decoded! All 3 secrets discovered.');
        } else {
          showToast(`Secret found (${secretsFound.size}/3)`);
        }
      }
    });
  });

  // 6. Lite mode sync & toggle
  initLiteMode();
}

/**
 * Clean up observers and listeners when leaving landing route.
 */
export function cleanupLanding() {
  if (galleryObserver) {
    galleryObserver.disconnect();
    galleryObserver = null;
  }
}

function updateSecretsCounter() {
  const counterEl = document.getElementById('secrets-counter-val');
  if (counterEl) {
    counterEl.textContent = `${secretsFound.size}/3`;
  }
}

function showToast(msg) {
  let toast = document.getElementById('lp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lp-toast';
    toast.className = 'lp-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('is-visible');
  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2800);
}

function initLiteMode() {
  const saved = localStorage.getItem('future_quest_reduce_effects');
  const isLite = saved === 'true' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.body.classList.toggle('lite-mode', isLite);

  document.querySelectorAll('.btn-reduce-effects').forEach(btn => {
    btn.setAttribute('aria-pressed', isLite ? 'true' : 'false');
    const span = btn.querySelector('.reduce-effects-text');
    if (span) span.textContent = isLite ? 'Effects: Minimal' : 'Effects: Standard';

    if (!btn._lpBound) {
      btn._lpBound = true;
      btn.addEventListener('click', () => {
        const current = document.body.classList.contains('lite-mode');
        const next = !current;
        document.body.classList.toggle('lite-mode', next);
        localStorage.setItem('future_quest_reduce_effects', next ? 'true' : 'false');
        document.querySelectorAll('.btn-reduce-effects').forEach(b => {
          b.setAttribute('aria-pressed', next ? 'true' : 'false');
          const s = b.querySelector('.reduce-effects-text');
          if (s) s.textContent = next ? 'Effects: Minimal' : 'Effects: Standard';
        });
      });
    }
  });
}
