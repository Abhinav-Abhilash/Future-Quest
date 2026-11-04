/**
 * Future Quest 2026 - Main Application Controller
 * 
 * Orchestrates SPA routing, sticky navigation, master countdown loop,
 * notice announcements (10m and 5m remaining), and automated vault locking.
 * Lazy-loads landing-only assets (landing.css, landing.js) strictly on the landing route.
 */

import { CONFIG } from './config.js';
import { GameState } from './state.js';
import { Router } from './router.js';
import { Screens } from './screens.js';
import { ICONS } from './icons.js';
import { Modal } from './modal.js';

/**
 * Accessible Toast Notification System
 */
export const Toast = {
  show(message, type = 'info', duration = 4000) {
    const root = document.getElementById('toast-stack-root');
    if (!root) return;

    const item = document.createElement('div');
    item.className = `toast-item toast-${type}`;
    item.setAttribute('role', 'status');

    let iconSvg = ICONS.circleDot;
    if (type === 'success') iconSvg = ICONS.checkCircle || ICONS.check;
    else if (type === 'danger') iconSvg = ICONS.cross;
    else if (type === 'amber') iconSvg = ICONS.clock;

    item.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${iconSvg}</span>
        <span class="toast-msg">${message}</span>
      </div>
      <button type="button" class="toast-dismiss" aria-label="Dismiss notification">${ICONS.close}</button>
    `;

    root.appendChild(item);
    requestAnimationFrame(() => {
      item.classList.add('toast-show');
    });

    const dismiss = () => {
      item.classList.remove('toast-show');
      setTimeout(() => {
        if (item.parentNode) item.remove();
      }, 200);
    };

    const dismissBtn = item.querySelector('.toast-dismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', dismiss);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }
};

class App {
  constructor() {
    this.router = null;
    this.masterInterval = null;
    this.notified10Min = false;
    this.notified5Min = false;
    this.pulsed5Min = false;
    this.mobileMenuOpen = false;
    this.landingModule = null;

    // DEV-ONLY: Expose only when CONFIG.DEV_MODE is true for testing/inspection
    if (CONFIG.DEV_MODE) {
      window.GameState = GameState;
      window.CONFIG = CONFIG;
      window.Toast = Toast;
    }
  }

  init() {
    const mainContainer = document.getElementById('app-main');
    const navContainer = document.getElementById('app-navbar');

    document.body.classList.toggle('dev-mode', !!CONFIG.DEV_MODE);

    // Apply lite-mode on game screens if reduced effects was toggled
    try {
      const reduceEffects = localStorage.getItem('future_quest_reduce_effects');
      if (reduceEffects === 'true' || reduceEffects === '1') {
        document.body.classList.add('lite-mode');
      }
    } catch (e) {
      console.warn('Could not read future_quest_reduce_effects from localStorage:', e);
    }

    this.router = new Router({}, (route, params) => {
      this.closeMobileMenu();
      this.updateNavbar(navContainer, route);
      this.renderCurrentScreen(mainContainer, route, params);
    });

    // Start master timer loop
    this.startMasterTimerLoop(navContainer);

    // Initial router kick-off
    this.router.start();

    // Subscribe to state updates for reactive nav updates (e.g. hints count)
    GameState.subscribe(() => {
      this.updateNavbar(navContainer, this.router.currentRoute);
    });

    // DEV-ONLY: Initialize fixed dev reset bar at bottom-right
    this.initDevResetBar();
  }

  /**
   * DEV-ONLY: Mount fixed dev reset bar at bottom-right of screen.
   */
  initDevResetBar() {
    const existing = document.getElementById('dev-reset-bar');
    if (existing) existing.remove();

    if (!CONFIG.DEV_MODE) return;

    const barEl = document.createElement('aside');
    barEl.id = 'dev-reset-bar';
    barEl.className = 'dev-reset-bar dev-only';
    barEl.setAttribute('aria-label', 'Developer Reset Bar');
    barEl.innerHTML = `
      <span class="dev-tag mono">DEV</span>
      <button type="button" class="btn btn-secondary btn-sm" id="btn-dev-reset-all">Reset all progress</button>
    `;

    document.body.appendChild(barEl);

    const resetBtn = barEl.querySelector('#btn-dev-reset-all');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Modal.showDevResetConfirmation(() => {
          this.performDevReset();
        });
      });
    }
  }

  /**
   * DEV-ONLY: Perform complete wipe of progress and reset timers.
   */
  performDevReset() {
    // 1. Remove every localStorage key the app uses
    try {
      localStorage.removeItem('future_quest_2026_state');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('future_quest') || key === 'future_quest_2026_state')) {
          localStorage.removeItem(key);
        }
      }
      sessionStorage.removeItem('future_quest_secrets_found');
    } catch (e) {
      console.warn('Dev reset error clearing storage:', e);
    }

    // Reset zero-flash session state
    document.documentElement.classList.remove('has-active-session');
    window.__gridFirstLoadDone = false;

    // 2. Clear all running intervals
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
    }
    if (Screens.activePuzzleInterval) {
      clearInterval(Screens.activePuzzleInterval);
      Screens.activePuzzleInterval = null;
    }

    // 3. Reset 10 and 5 minute notice flags
    this.notified10Min = false;
    this.notified5Min = false;
    this.pulsed5Min = false;

    // 4. Dismiss any notice banners
    const noticeContainer = document.getElementById('notice-banner-root');
    if (noticeContainer) {
      noticeContainer.innerHTML = '';
    }

    // 5. Close any open modal
    Modal.close();

    // 6. Set the state to null
    GameState.resetSession();

    // 7. Rebuild the nav bar
    const navContainer = document.getElementById('app-navbar');
    this.updateNavbar(navContainer, 'landing');

    // 8. Navigate to #/landing
    this.router.navigate('/landing');

    // Re-start master timer loop (will idle safely while hasSession() is false)
    this.startMasterTimerLoop(navContainer);
  }

  /**
   * Lazy load landing-only assets (landing.css, landing.js) when entering #/landing.
   */
  loadLandingAssets() {
    document.body.classList.add('is-landing');

    // Lazy load landing.css if not already in document
    if (!document.getElementById('landing-css')) {
      const link = document.createElement('link');
      link.id = 'landing-css';
      link.rel = 'stylesheet';
      link.href = 'landing.css';
      document.head.appendChild(link);
    }

    // Lazy load landing.js module
    import('./landing.js').then(module => {
      this.landingModule = module;
      if (module && typeof module.initLanding === 'function') {
        module.initLanding();
      }
    }).catch(err => {
      console.warn('Could not lazy-load landing.js:', err);
    });
  }

  /**
   * Clean up landing assets and observers when leaving #/landing.
   */
  leaveLanding() {
    document.body.classList.remove('is-landing');
    if (this.landingModule && typeof this.landingModule.cleanupLanding === 'function') {
      this.landingModule.cleanupLanding();
    }
  }

  /**
   * Render the active screen.
   */
  renderCurrentScreen(container, route, params) {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const staticLanding = document.getElementById('static-landing-view');

    // Landing route handling
    if (route === 'landing' || (!GameState.hasSession() && (route === '' || route === 'home'))) {
      this.loadLandingAssets();
      if (staticLanding) staticLanding.style.display = '';
      if (container) container.style.display = 'none';
      return;
    }

    // Leaving landing: restore non-landing canvas & cleanup landing observers
    this.leaveLanding();
    if (staticLanding) staticLanding.style.display = 'none';
    if (container) container.style.display = 'block';

    switch (route) {
      case 'landing':
        if (GameState.hasSession()) this.router.navigate('/grid');
        break;
      case 'register':
        Screens.renderRegister(container, this.router);
        break;
      case 'grid':
        Screens.renderGrid(container, this.router);
        break;
      case 'puzzle':
        Screens.renderPuzzle(container, this.router, params.id);
        break;
      case 'vault':
        Screens.renderVault(container, this.router);
        break;
      case 'rules':
        Screens.renderRules(container, this.router);
        break;
      case 'home':
        if (GameState.hasSession()) {
          this.router.navigate('/grid');
        } else {
          this.router.navigate('/landing');
        }
        break;
      default:
        if (GameState.hasSession()) {
          this.router.navigate('/grid');
        } else {
          this.router.navigate('/landing');
        }
        break;
    }
  }

  /**
   * Render or update the sticky navigation bar.
   */
  updateNavbar(navContainer, currentRoute) {
    const hasSession = GameState.hasSession();
    const state = GameState.state;

    if (!hasSession) {
      if (currentRoute === 'landing' || currentRoute === '' || currentRoute === 'home') {
        // Landing-only nav variant: wordmark on left, Rules link, and compact Start Event pill on right
        navContainer.innerHTML = `
          <header class="app-nav nav-pre-entry nav-landing-variant" role="banner">
            <div class="nav-inner">
              <div class="nav-left">
                <a href="#/landing" class="nav-brand" aria-label="Future Quest 2026">
                  <span class="brand-text">Future Quest 2026</span>
                  <span class="brand-badge lp-nav-badge">SFT</span>
                </a>
                <div class="nav-links">
                  <a href="#/rules" class="nav-link">Rules</a>
                </div>
              </div>
              <div class="nav-right">
                <a href="#/register" class="lp-nav-pill-btn">Start Event</a>
              </div>
            </div>
          </header>
        `;
        return;
      }

      // Pre-session registration and rules nav (minimal clean header: wordmark plus Rules, no Start Event pill)
      navContainer.innerHTML = `
        <header class="app-nav nav-pre-entry" role="banner">
          <div class="nav-inner">
            <a href="#/landing" class="nav-brand" aria-label="Future Quest 2026">
              <span class="brand-text">Future Quest 2026</span>
              <span class="brand-badge">SFT</span>
            </a>
            <div class="nav-links">
              <a href="#/rules" class="nav-link ${currentRoute === 'rules' ? 'active' : ''}">Rules</a>
            </div>
          </div>
        </header>
      `;
      return;
    }

    // Active session game nav (clean dark graphite style)
    const remainingSec = GameState.getMasterRemainingSeconds();
    const isAmber = remainingSec <= 600 && !state.vaultEntered;
    const hintsCount = state.hintsRemaining !== undefined ? state.hintsRemaining : 3;
    const teamName = state.teamName || 'Team';
    const teamInitial = (teamName.trim()[0] || 'T').toUpperCase();

    let hintPipsHtml = '';
    for (let i = 1; i <= 3; i++) {
      if (i <= hintsCount) {
        hintPipsHtml += `<span class="nav-hint-pip" title="Hint ${i} available">${ICONS.lanternLit}</span>`;
      } else {
        hintPipsHtml += `<span class="nav-hint-pip pip-spent" title="Hint ${i} used">${ICONS.lanternDark}</span>`;
      }
    }

    navContainer.innerHTML = `
      <header class="app-nav" role="banner">
        <div class="nav-inner">
          <!-- Left: Brand Wordmark -->
          <div class="nav-left">
            <a href="#/grid" class="nav-brand" aria-label="Future Quest 2026 - Go to Grid">
              <span class="brand-text">Future Quest 2026</span>
            </a>
            <!-- Desktop Links -->
            <nav class="nav-links desktop-only" aria-label="Main Navigation">
              <a href="#/grid" class="nav-link ${currentRoute === 'grid' ? 'active' : ''}">Grid</a>
              <a href="#/rules" class="nav-link ${currentRoute === 'rules' ? 'active' : ''}">Rules</a>
              ${state.vaultEntered ? `<a href="#/vault" class="nav-link ${currentRoute === 'vault' ? 'active' : ''}">Vault</a>` : ''}
            </nav>
          </div>

          <!-- Right Side: Always Visible Status Badges -->
          <div class="nav-right">
            <!-- Master Countdown -->
            <div 
              class="nav-stat-badge nav-timer-badge ${isAmber ? 'timer-amber' : ''}" 
              id="master-timer-display"
              title="Master Competition Timer"
              aria-live="polite"
            >
              <span class="badge-icon">${ICONS.clock}</span>
              <span class="timer-digits mono" id="master-timer-clock">${Screens.formatTime(remainingSec, true)}</span>
            </div>

            <!-- Hints Counter with 3 Pips -->
            <div class="nav-stat-badge nav-hints-badge" title="Hints remaining for contest">
              <div class="nav-hints-pips" id="nav-hints-pips">${hintPipsHtml}</div>
              <span class="hints-text"><strong id="nav-hints-val">${hintsCount}/3</strong></span>
            </div>

            <!-- Team Name with Avatar Chip (Desktop) -->
            <div class="nav-team-badge desktop-only" title="${teamName} (${state.schoolName})">
              <span class="nav-team-avatar">${teamInitial}</span>
              <span class="team-label text-truncate">${teamName}</span>
            </div>

            <!-- Mobile Menu Toggle Button -->
            <button 
              type="button" 
              class="btn-icon mobile-menu-btn mobile-only" 
              id="mobile-nav-toggle" 
              aria-label="Toggle navigation menu"
              aria-expanded="${this.mobileMenuOpen ? 'true' : 'false'}"
            >
              ${this.mobileMenuOpen ? ICONS.close : ICONS.menu}
            </button>
          </div>
        </div>

        <!-- Master-timer Progress Bar Track under Navigation -->
        <div class="nav-master-progress-track">
          <div class="nav-master-progress-bar" id="nav-master-progress"></div>
        </div>

        <!-- Mobile Collapsible Menu Drawer -->
        <div class="mobile-drawer ${this.mobileMenuOpen ? 'is-open' : ''}" id="mobile-nav-drawer" role="menu">
          <div class="mobile-drawer-inner">
            <div class="mobile-team-info">
              <div class="mobile-team-name">${teamName}</div>
              <div class="mobile-school-name">${state.schoolName}</div>
            </div>
            <div class="mobile-drawer-links">
              <a href="#/grid" class="mobile-drawer-link ${currentRoute === 'grid' ? 'active' : ''}">Grid</a>
              <a href="#/rules" class="mobile-drawer-link ${currentRoute === 'rules' ? 'active' : ''}">Rules</a>
              ${state.vaultEntered ? `<a href="#/vault" class="mobile-drawer-link ${currentRoute === 'vault' ? 'active' : ''}">Vault</a>` : ''}
            </div>
          </div>
        </div>
      </header>
    `;

    // Bind mobile menu toggle
    const toggleBtn = navContainer.querySelector('#mobile-nav-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        const drawer = document.getElementById('mobile-nav-drawer');
        if (drawer) {
          drawer.classList.toggle('is-open', this.mobileMenuOpen);
          toggleBtn.setAttribute('aria-expanded', this.mobileMenuOpen ? 'true' : 'false');
          toggleBtn.innerHTML = this.mobileMenuOpen ? ICONS.close : ICONS.menu;
        }
      });
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    const drawer = document.getElementById('mobile-nav-drawer');
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    if (drawer) drawer.classList.remove('is-open');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = ICONS.menu;
    }
  }

  /**
   * Display a non-intrusive notification notice banner at the top of the app.
   */
  showNotice(message, type = 'amber') {
    const noticeContainer = document.getElementById('notice-banner-root');
    if (!noticeContainer) return;

    const noticeEl = document.createElement('div');
    noticeEl.className = `notice-banner banner-${type}`;
    noticeEl.setAttribute('role', 'alert');
    noticeEl.innerHTML = `
      <div class="notice-inner">
        <span class="notice-icon">${ICONS.clock}</span>
        <span class="notice-msg">${message}</span>
        <button type="button" class="notice-dismiss" aria-label="Dismiss notice">${ICONS.close}</button>
      </div>
    `;

    noticeContainer.appendChild(noticeEl);

    noticeEl.querySelector('.notice-dismiss').addEventListener('click', () => {
      noticeEl.remove();
    });

    // Auto dismiss after 12 seconds
    setTimeout(() => {
      if (noticeEl.parentNode) noticeEl.remove();
    }, 12000);
  }

  /**
   * Master Timer Interval loop. Runs every second.
   */
  startMasterTimerLoop(navContainer) {
    if (this.masterInterval) clearInterval(this.masterInterval);

    this.masterInterval = setInterval(() => {
      if (!GameState.hasSession()) return;
      const state = GameState.state;
      const remainingSec = GameState.getMasterRemainingSeconds();

      // Update timer element directly for 60fps performance without full nav redraw
      const clockEl = document.getElementById('master-timer-clock');
      const badgeEl = document.getElementById('master-timer-display');
      const progressBar = document.getElementById('nav-master-progress');

      if (clockEl) {
        clockEl.textContent = Screens.formatTime(remainingSec, true);
      }

      const totalSec = CONFIG.TOTAL_TIME_MINUTES * 60;
      const pct = Math.max(0, Math.min(1, remainingSec / totalSec));

      if (progressBar) {
        progressBar.style.transform = `scaleX(${pct})`;
        if (remainingSec <= 600 && !state.vaultEntered) {
          progressBar.classList.add('is-amber');
        } else {
          progressBar.classList.remove('is-amber');
        }
        if (remainingSec <= 300 && !this.pulsed5Min && !state.vaultEntered) {
          this.pulsed5Min = true;
          progressBar.classList.add('pulse-5min');
        }
      }

      if (badgeEl) {
        if (remainingSec <= 600 && !state.vaultEntered) {
          badgeEl.classList.add('timer-amber');
        } else {
          badgeEl.classList.remove('timer-amber');
        }
      }

      // Check 10-minute warning (600s)
      if (remainingSec <= 600 && remainingSec > 595 && !this.notified10Min && !state.vaultEntered) {
        this.notified10Min = true;
        this.showNotice('Notice: 10 minutes remaining in contest. Finalize your puzzle solutions.', 'amber');
        Toast.show('10 minutes remaining in contest!', 'amber');
      }

      // Check 5-minute warning (300s)
      if (remainingSec <= 300 && remainingSec > 295 && !this.notified5Min && !state.vaultEntered) {
        this.notified5Min = true;
        this.showNotice('Notice: 5 minutes remaining in contest. Prepare for vault locking.', 'amber');
        Toast.show('5 minutes remaining! Prepare for vault locking.', 'amber');
      }

      // Master time expired!
      if (remainingSec <= 0 && !state.vaultEntered) {
        GameState.enterVault(true);
        this.updateNavbar(navContainer, 'vault');
        this.router.navigate('/vault');
      }
    }, 1000);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
