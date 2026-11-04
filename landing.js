/**
 * Future Quest 2026 - Landing Page Interactivity Engine
 * 
 * Lightweight scoped interactivity for #/landing:
 * - IntersectionObserver to pause gallery drift when offscreen
 * - Tab visibility listener to pause drift and loops when hidden
 * - Scroll-reveal for sections (fade + 16px rise, once, via IntersectionObserver)
 * - Hero subtle parallax on dotted map background (translate only, desktop, rAF throttled)
 * - Hero lantern cursor spotlight (transformed radial element, desktop, rAF throttled)
 * - Prize numbers count up once when scrolled into view (rAF, 0 CLS)
 * - 3D card tilt on hover (max 4deg) and 3D card flip on click/tap/Enter
 * - 3 secret glints discovery with toast notifications & footer counter
 * - Auto-detect lite-mode (prefers-reduced-motion, concurrency <= 4, deviceMemory <= 4)
 */

let galleryObserver = null;
let sectionObserver = null;
let prizesObserver = null;
let visibilityHandler = null;
let scrollParallaxHandler = null;
let heroSpotlightHandler = null;
let heroLeaveHandler = null;
const secretsFound = new Set();

/**
 * Check if the user is in lite mode or prefers reduced motion.
 */
function isLiteOrReduced() {
  return document.body.classList.contains('lite-mode') ||
         (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Initialize all landing page interactions.
 */
export function initLanding() {
  const galleryEl = document.querySelector('.clue-gallery-section');
  const heroEl = document.getElementById('landing-hero');
  const heroDottedBg = document.getElementById('hero-dotted-bg');
  const heroSpotlight = document.getElementById('hero-spotlight');

  // 1. Lite mode sync & auto-detect
  initLiteMode();

  // 2. Restore secret glints from sessionStorage
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

  // 3. Setup IntersectionObserver to start/pause drift when on/off screen
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

  // 4. Tab visibility listener (pauses animations when tab is hidden)
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

  // 5. Scroll-reveal observer (fade + 16px rise once, unobserve)
  if ('IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.scroll-reveal');
    if (sectionObserver) sectionObserver.disconnect();
    sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => sectionObserver.observe(el));
  }

  // 6. Hero subtle parallax on dotted map background (translateY only, desktop only, rAF throttled)
  if (heroEl && heroDottedBg) {
    let parallaxRaf = null;
    scrollParallaxHandler = () => {
      if (isLiteOrReduced() || window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;
      if (!parallaxRaf) {
        parallaxRaf = requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;
          if (scrollY < 800) {
            heroDottedBg.style.transform = `translate3d(0, ${scrollY * 0.18}px, 0)`;
          }
          parallaxRaf = null;
        });
      }
    };
    window.addEventListener('scroll', scrollParallaxHandler, { passive: true });
  }

  // 7. Hero lantern cursor spotlight (desktop only, rAF throttled)
  if (heroEl && heroSpotlight) {
    let spotlightRaf = null;
    let targetX = 0;
    let targetY = 0;

    heroSpotlightHandler = (e) => {
      if (isLiteOrReduced() || window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;
      const rect = heroEl.getBoundingClientRect();
      targetX = e.clientX - rect.left - 160;
      targetY = e.clientY - rect.top - 160;

      if (!spotlightRaf) {
        spotlightRaf = requestAnimationFrame(() => {
          heroSpotlight.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
          heroSpotlight.style.opacity = '1';
          spotlightRaf = null;
        });
      }
    };

    heroLeaveHandler = () => {
      heroSpotlight.style.opacity = '0';
    };

    heroEl.addEventListener('mousemove', heroSpotlightHandler, { passive: true });
    heroEl.addEventListener('mouseleave', heroLeaveHandler);
  }

  // 8. Prize numbers count up once when scrolled into view (rAF, 0 CLS)
  const prizeBanner = document.querySelector('.prizes-banner');
  if (prizeBanner && 'IntersectionObserver' in window) {
    if (prizesObserver) prizesObserver.disconnect();
    prizesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          prizesObserver.disconnect();
          prizesObserver = null;
          animatePrizeCounters();
        }
      });
    }, { threshold: 0.2 });
    prizesObserver.observe(prizeBanner);
  }

  // 9. Card flip and hover tilt (throttled to 1 rAF, desktop only)
  const cards = document.querySelectorAll('.clue-card');
  let cardTiltRaf = null;
  let activeTiltCard = null;
  let activeRx = 0;
  let activeRy = 0;

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

    // Tilt on hover (max 4 degrees) - non-lite mode only, rAF throttled
    card.addEventListener('mousemove', (e) => {
      if (isLiteOrReduced() || window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;
      if (card.classList.contains('is-flipped')) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      activeTiltCard = card;
      activeRx = -y * 8;
      activeRy = x * 8;

      if (!cardTiltRaf) {
        cardTiltRaf = requestAnimationFrame(() => {
          if (activeTiltCard) {
            activeTiltCard.style.transform = `perspective(600px) rotateY(${activeRy}deg) rotateX(${activeRx}deg)`;
          }
          cardTiltRaf = null;
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      activeTiltCard = null;
    });
  });

  // 10. Secret glints discovery
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
}

/**
 * Animate prize counter numbers smoothly over 750ms.
 */
function animatePrizeCounters() {
  const countEls = document.querySelectorAll('[data-countup]');
  if (isLiteOrReduced()) {
    countEls.forEach(el => {
      const target = parseInt(el.dataset.countup, 10) || 50000;
      el.textContent = `₹ ${target.toLocaleString('en-IN')}`;
    });
    return;
  }

  const duration = 750;
  const startTime = performance.now();

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);

    countEls.forEach(el => {
      const target = parseInt(el.dataset.countup, 10) || 50000;
      const current = Math.floor(ease * target);
      el.textContent = `₹ ${current.toLocaleString('en-IN')}`;
    });

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      countEls.forEach(el => {
        const target = parseInt(el.dataset.countup, 10) || 50000;
        el.textContent = `₹ ${target.toLocaleString('en-IN')}`;
      });
    }
  };

  requestAnimationFrame(step);
}

/**
 * Clean up observers and listeners when leaving landing route.
 */
export function cleanupLanding() {
  if (galleryObserver) {
    galleryObserver.disconnect();
    galleryObserver = null;
  }
  if (sectionObserver) {
    sectionObserver.disconnect();
    sectionObserver = null;
  }
  if (prizesObserver) {
    prizesObserver.disconnect();
    prizesObserver = null;
  }
  if (scrollParallaxHandler) {
    window.removeEventListener('scroll', scrollParallaxHandler);
    scrollParallaxHandler = null;
  }
  const heroEl = document.getElementById('landing-hero');
  if (heroEl) {
    if (heroSpotlightHandler) heroEl.removeEventListener('mousemove', heroSpotlightHandler);
    if (heroLeaveHandler) heroEl.removeEventListener('mouseleave', heroLeaveHandler);
  }
  heroSpotlightHandler = null;
  heroLeaveHandler = null;
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
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowConcurrency = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;

  const isLite = saved !== null ? (saved === 'true' || saved === '1') : (prefersReduced || lowConcurrency || lowMemory);
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
