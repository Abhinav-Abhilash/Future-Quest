/**
 * Future Quest 2026 - Screens & Views
 * 
 * Implements rendering and event binding for:
 * - Registration Screen (#/register)
 * - Grid Screen (#/grid) with HUD, Clue Pouch, and Tile Motion
 * - Puzzle Screen (#/puzzle/:id) with Single-stage tactile UX and sealed clue reveal
 * - Vault Screen (#/vault) with Door Reveal Ceremony and 4-Step Checklist
 * - Rules Screen (#/rules) with Quick Facts & Sticky TOC
 */

import { CONFIG, getTileLabel } from './config.js';
import { GameState } from './state.js';
import { ICONS } from './icons.js';
import { Modal } from './modal.js';
import { PUZZLE_REGISTRY } from './puzzles/index.js';
import { PUZZLE_ART } from './puzzles/art.js';
import { Toast } from './app.js';

export function getFoodBadgeSvg(difficulty) {
  const diff = (difficulty || 'medium').toLowerCase();
  const label = diff.charAt(0).toUpperCase() + diff.slice(1);
  return `
    <span class="tile-food-badge badge-${diff}" title="Difficulty: ${label}" aria-label="Difficulty: ${label}">
      <svg class="food-badge-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <rect x="1.25" y="1.25" width="13.5" height="13.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="8" cy="8" r="3.75" fill="currentColor"/>
      </svg>
    </span>
  `;
}

const showToast = (msg, type) => {
  if (typeof window !== 'undefined' && window.Toast && typeof window.Toast.show === 'function') {
    window.Toast.show(msg, type);
  } else if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
    Toast.show(msg, type);
  }
};

export const Screens = {
  activePuzzleInterval: null,
  activePuzzleModule: null,
  activePuzzleId: null,
  announced120: false,
  announced30: false,

  /**
   * Safely unmount active interactive puzzle module.
   */
  unmountCurrentPuzzle() {
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }
    if (this.activePuzzleModule && typeof this.activePuzzleModule.unmount === 'function') {
      try {
        this.activePuzzleModule.unmount();
      } catch (e) {
        console.warn('Error unmounting puzzle module:', e);
      }
    }
    this.activePuzzleModule = null;
    this.activePuzzleId = null;
    this.announced120 = false;
    this.announced30 = false;
  },

  /**
   * Display an in-page notice banner at the top of the app.
   */
  showNotice(message, type = 'amber') {
    const noticeContainer = document.getElementById('notice-banner-root');
    if (!noticeContainer) return;

    const noticeEl = document.createElement('div');
    noticeEl.className = `notice-banner banner-${type}`;
    noticeEl.setAttribute('role', 'alert');
    noticeEl.innerHTML = `
      <div class="notice-inner">
        <span class="notice-icon">${type === 'danger' ? ICONS.cross : ICONS.clock}</span>
        <span class="notice-msg">${message}</span>
        <button type="button" class="notice-dismiss" aria-label="Dismiss notice">${ICONS.close}</button>
      </div>
    `;

    noticeContainer.appendChild(noticeEl);

    noticeEl.querySelector('.notice-dismiss').addEventListener('click', () => {
      noticeEl.remove();
    });

    setTimeout(() => {
      if (noticeEl.parentNode) noticeEl.remove();
    }, 10000);
  },

  /**
   * Helper to format seconds as MM:SS or HH:MM:SS.
   */
  formatTime(seconds, includeHours = false) {
    const s = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (includeHours || hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  /**
   * Copy text helper with visual button feedback.
   */
  copyToClipboard(text, btnElement) {
    const originalHtml = btnElement.innerHTML;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        btnElement.innerHTML = `${ICONS.check} <span>Copied!</span>`;
        showToast('Copied to clipboard!', 'success');
        setTimeout(() => { btnElement.innerHTML = originalHtml; }, 1800);
      }).catch(() => {
        this.fallbackCopy(text, btnElement, originalHtml);
      });
    } else {
      this.fallbackCopy(text, btnElement, originalHtml);
    }
  },

  fallbackCopy(text, btnElement, originalHtml) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      btnElement.innerHTML = `${ICONS.check} <span>Copied!</span>`;
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => { btnElement.innerHTML = originalHtml; }, 1800);
    } catch (err) {
      console.error('Copy fallback failed:', err);
    }
    document.body.removeChild(textArea);
  },

  /**
   * Download SVG helper.
   */
  downloadSvg(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'clue-graphic.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloading ${link.download}`, 'info');
  },

  // =========================================================================
  // 1. REGISTRATION SCREEN (#/register)
  // =========================================================================
  renderRegister(container, router) {
    this.unmountCurrentPuzzle();
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    container.innerHTML = `
      <section class="screen-container entry-screen" aria-labelledby="register-title">
        <div class="entry-card">
          <header class="entry-header">
            <div class="brand-institution">${CONFIG.EVENT.fullName}</div>
            <h1 id="register-title" class="entry-title">${CONFIG.EVENT.title}</h1>
            <p class="entry-subtitle">Team Registration & Round Access</p>
          </header>

          <form id="entry-form" class="entry-form" novalidate>
            <div id="entry-error" class="alert alert-danger" style="display: none;" role="alert"></div>

            <div class="form-group">
              <label for="team-name" class="form-label">Team Name <span class="required-star">*</span></label>
              <input 
                type="text" 
                id="team-name" 
                name="teamName" 
                class="form-input" 
                placeholder="e.g. CyberKnights" 
                autocomplete="off" 
                required 
              />
              <span class="field-error" id="team-name-error"></span>
            </div>

            <div class="form-group">
              <label for="school-name" class="form-label">School Name <span class="required-star">*</span></label>
              <input 
                type="text" 
                id="school-name" 
                name="schoolName" 
                class="form-input" 
                placeholder="e.g. National Public School, Bengaluru" 
                autocomplete="off" 
                required 
              />
              <span class="field-error" id="school-name-error"></span>
            </div>

            <!-- Ready Check Pre-round Checklist with Stroke-Dashoffset Tick Motion -->
            <div class="ready-checklist" role="region" aria-label="Pre-round Readiness Checklist">
              <div class="ready-checklist-title mono">PRE-ROUND READINESS CHECK:</div>
              <label class="ready-check-item">
                <input type="checkbox" id="chk-team-ready" class="ready-checkbox sr-only" />
                <span class="custom-checkbox" aria-hidden="true">
                  <svg class="check-svg" viewBox="0 0 16 16">
                    <polyline points="3 8 6.5 12 13 4"></polyline>
                  </svg>
                </span>
                <span class="ready-check-text">Our team (3 to 5 members) is assembled and ready.</span>
              </label>
              <label class="ready-check-item">
                <input type="checkbox" id="chk-device-ready" class="ready-checkbox sr-only" />
                <span class="custom-checkbox" aria-hidden="true">
                  <svg class="check-svg" viewBox="0 0 16 16">
                    <polyline points="3 8 6.5 12 13 4"></polyline>
                  </svg>
                </span>
                <span class="ready-check-text">We have a stable internet connection and are using one shared device.</span>
              </label>
              <label class="ready-check-item">
                <input type="checkbox" id="chk-timer-ready" class="ready-checkbox sr-only" />
                <span class="custom-checkbox" aria-hidden="true">
                  <svg class="check-svg" viewBox="0 0 16 16">
                    <polyline points="3 8 6.5 12 13 4"></polyline>
                  </svg>
                </span>
                <span class="ready-check-text">We understand that the 2-hour timer cannot be paused once started.</span>
              </label>
              <label class="ready-check-item">
                <input type="checkbox" id="chk-rules-ready" class="ready-checkbox sr-only" />
                <span class="custom-checkbox" aria-hidden="true">
                  <svg class="check-svg" viewBox="0 0 16 16">
                    <polyline points="3 8 6.5 12 13 4"></polyline>
                  </svg>
                </span>
                <span class="ready-check-text">We have read and agree to the competition rules.</span>
              </label>
            </div>

            <div class="entry-notice">
              <span class="notice-icon">${ICONS.clock}</span>
              <p class="notice-text">
                The 2-hour contest timer starts immediately after the launch countdown. Ensure your entire team is assembled before proceeding.
              </p>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-block" id="btn-begin-round" disabled>Begin Round</button>
            </div>
          </form>

          <footer class="entry-footer">
            <a href="#/rules" class="text-link">Review Contest Rules & Specifications</a>
          </footer>
        </div>
      </section>
    `;

    const form = document.getElementById('entry-form');
    const teamInput = document.getElementById('team-name');
    const schoolInput = document.getElementById('school-name');
    const teamError = document.getElementById('team-name-error');
    const schoolError = document.getElementById('school-name-error');
    const alertError = document.getElementById('entry-error');
    const submitBtn = document.getElementById('btn-begin-round');
    const checkboxes = form.querySelectorAll('.ready-checkbox');

    const validateReadyState = () => {
      const hasTeam = teamInput.value.trim().length > 0;
      const hasSchool = schoolInput.value.trim().length > 0;
      const allChecked = Array.from(checkboxes).every(chk => chk.checked);

      submitBtn.disabled = !(hasTeam && hasSchool && allChecked);
    };

    teamInput.addEventListener('input', validateReadyState);
    schoolInput.addEventListener('input', validateReadyState);
    checkboxes.forEach(chk => chk.addEventListener('change', validateReadyState));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;
      teamError.textContent = '';
      schoolError.textContent = '';
      teamInput.classList.remove('input-invalid');
      schoolInput.classList.remove('input-invalid');
      alertError.style.display = 'none';

      const teamVal = teamInput.value.trim();
      const schoolVal = schoolInput.value.trim();

      if (!teamVal) {
        teamError.textContent = 'Team Name is required.';
        teamInput.classList.add('input-invalid');
        isValid = false;
      }

      if (!schoolVal) {
        schoolError.textContent = 'School Name is required.';
        schoolInput.classList.add('input-invalid');
        isValid = false;
      }

      const allChecked = Array.from(checkboxes).every(chk => chk.checked);
      if (!allChecked) {
        alertError.textContent = 'Please confirm all pre-round readiness checklist items.';
        alertError.style.display = 'block';
        isValid = false;
      }

      if (!isValid) {
        if (!alertError.textContent) {
          alertError.textContent = 'Please fill out all required fields before starting.';
          alertError.style.display = 'block';
        }
        return;
      }

      // Disable button during server registration call
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering team...';

      GameState.initSession(teamVal, schoolVal)
        .then(() => {
          // 3-2-1 Countdown Overlay Ceremony
          const overlay = document.createElement('div');
          overlay.className = 'launch-countdown-overlay';
          overlay.setAttribute('role', 'alert');
          overlay.setAttribute('aria-live', 'assertive');
          overlay.innerHTML = `
            <div class="launch-countdown-digit show" id="launch-digit">3</div>
            <div class="launch-countdown-caption">Preparing Contest Round...</div>
          `;
          document.body.appendChild(overlay);

          let count = 3;
          const digitEl = overlay.querySelector('#launch-digit');
          const interval = setInterval(() => {
            count--;
            if (count > 0) {
              digitEl.classList.remove('show');
              void digitEl.offsetWidth; // Reflow for animation trigger
              digitEl.textContent = count;
              digitEl.classList.add('show');
            } else {
              clearInterval(interval);
              digitEl.textContent = 'GO!';
              setTimeout(() => {
                overlay.remove();
                router.navigate('/grid');
              }, 500);
            }
          }, 1000);
        })
        .catch(err => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Begin Round';
          const errMsg = err.message || 'Registration failed. Please try again.';
          alertError.textContent = errMsg;
          alertError.style.display = 'block';
          if (errMsg.toLowerCase().includes('team')) {
            teamInput.classList.add('input-invalid');
            teamError.textContent = errMsg;
          }
        });
    });
  },

  // Backward compatibility alias
  renderHome(container, router) {
    return this.renderRegister(container, router);
  },

  // =========================================================================
  // 2. GRID SCREEN (#/grid)
  // =========================================================================
  renderGrid(container, router) {
    this.unmountCurrentPuzzle();
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    let state = GameState.state;
    if (!state) {
      state = GameState.loadState();
      GameState.state = state;
    }
    if (!state && !GameState.hasSession()) {
      router.navigate('/landing');
      return;
    }
    if (!state) {
      state = {
        teamName: 'Team',
        timerStartedAt: Date.now(),
        vaultEntered: false,
        hintsRemaining: 3,
        gridOrder: [...Object.keys(CONFIG.PUZZLES), 'vault_12'],
        blocks: {},
      };
      GameState.state = state;
      GameState.saveState();
    }
    state.blocks = state.blocks || {};

    // Check all OPENED_IN_PROGRESS puzzles so any expired puzzle becomes FAILED immediately
    GameState.checkExpiredPuzzles();

    const isVaultEntered = state.vaultEntered;
    // Canonical sequential order: Task 1 (puzzle_1) through Task 10 (puzzle_10)
    const questIds = [
      'puzzle_1',
      'puzzle_2',
      'puzzle_3',
      'puzzle_4',
      'puzzle_5',
      'puzzle_6',
      'puzzle_7',
      'puzzle_8',
      'puzzle_9',
      'puzzle_10'
    ];
    const gridOrder = [...questIds, 'vault_12'];

    // Calculate solved, failed, and progress
    let solvedCount = 0;
    let failedCount = 0;
    const totalQuestCount = questIds.length;

    questIds.forEach(id => {
      const b = state.blocks[id];
      if (b) {
        if (b.status === 'SOLVED') solvedCount++;
        if (b.status === 'FAILED') failedCount++;
      }
    });

    const isAllAttempted = (solvedCount + failedCount === totalQuestCount);
    const progressPct = Math.round((solvedCount / totalQuestCount) * 100);
    const ringCircumference = 150.8; // 2 * pi * 24
    const ringDashOffset = ringCircumference * (1 - (solvedCount / totalQuestCount));
    const masterRemaining = GameState.getMasterRemainingSeconds();

    // Check if first load in this session for deal-in motion
    const isDealt = sessionStorage.getItem('future_quest_grid_dealt');
    if (!isDealt) {
      try { sessionStorage.setItem('future_quest_grid_dealt', '1'); } catch (e) {}
    }
    const isFirstLoad = !isDealt && !document.body.classList.contains('lite-mode');

    // Clue pouch route line dash calculation
    const routePct = Math.max(0, Math.min(1, solvedCount / totalQuestCount));
    const routeDashOffset = 960 * (1 - routePct);

    // Build Clue Pouch 10-slot strip
    let pouchSlotsHtml = '';
    questIds.forEach((itemId, idx) => {
      const tileNum = idx + 1;
      const formattedNum = String(tileNum).padStart(2, '0');
      const block = state.blocks[itemId];
      const isSolved = block && block.status === 'SOLVED';
      const isInProgress = block && (block.status === 'OPENED' || block.status === 'OPENED_IN_PROGRESS');
      const isFailed = block && block.status === 'FAILED';
      const clue = block ? block.unlockedClue : null;

      if (isSolved) {
        let iconSvg = ICONS.check;
        if (clue) {
          if (clue.type === 'spec') iconSvg = ICONS.clueSpec || ICONS.check;
          else if (clue.type === 'text') iconSvg = ICONS.clueText || ICONS.check;
          else if (clue.type === 'image') iconSvg = ICONS.clueImage || ICONS.check;
        }

        const clueTitle = clue ? (clue.title || clue.fragment || 'Clue Fragment') : 'Clue Unlocked';

        pouchSlotsHtml += `
          <div 
            class="pouch-slot pouch-slot-solved pouch-slot-filled pouch-stamp" 
            data-puzzle-id="${itemId}" 
            title="Task ${tileNum}: ${clueTitle} (Solved - Green)" 
            tabindex="0"
            role="button"
            aria-label="Task ${tileNum} clue unlocked (Solved)"
          >
            <span class="pouch-slot-icon">${iconSvg}</span>
            <span class="pouch-slot-num">${formattedNum}</span>
          </div>
        `;
      } else if (isInProgress) {
        pouchSlotsHtml += `
          <div 
            class="pouch-slot pouch-slot-inprogress" 
            data-puzzle-id="${itemId}" 
            title="Task ${tileNum}: In Progress (Yellow)" 
            tabindex="0"
            role="button"
            aria-label="Task ${tileNum} in progress"
          >
            <span class="pouch-slot-icon">${ICONS.clock}</span>
            <span class="pouch-slot-num">${formattedNum}</span>
          </div>
        `;
      } else if (isFailed) {
        pouchSlotsHtml += `
          <div 
            class="pouch-slot pouch-slot-failed" 
            data-puzzle-id="${itemId}" 
            title="Task ${tileNum}: Failed (Red)" 
            tabindex="0"
            role="button"
            aria-label="Task ${tileNum} failed"
          >
            <span class="pouch-slot-icon">${ICONS.cross}</span>
            <span class="pouch-slot-num">${formattedNum}</span>
          </div>
        `;
      } else {
        pouchSlotsHtml += `
          <div 
            class="pouch-slot pouch-slot-locked" 
            data-puzzle-id="${itemId}" 
            title="Task ${tileNum}: Locked" 
            tabindex="0"
            role="button"
            aria-label="Task ${tileNum} clue locked"
          >
            <span class="pouch-slot-icon">${ICONS.lock}</span>
            <span class="pouch-slot-num">${formattedNum}</span>
          </div>
        `;
      }
    });

    // NOTE: Difficulty is a mystery. The grid and the nav bar never show or hint at
    // difficulty or time limits before a puzzle is opened. No difficulty in tile labels,
    // CSS classes, data attributes, tooltips, or aria-labels. Tile IDs (puzzle_1..10)
    // are opaque and do not reveal difficulty.
    let tilesHtml = '';

    // Submit tile: static until ready, then ONE gentle pulse, never looping
    const isSubmitReady = (isAllAttempted || solvedCount === totalQuestCount);
    let submitPulseClass = '';
    if (isSubmitReady && !sessionStorage.getItem('future_quest_submit_pulsed')) {
      submitPulseClass = 'tile-submit-ready';
      try { sessionStorage.setItem('future_quest_submit_pulsed', '1'); } catch (e) {}
    }

    gridOrder.forEach((itemId, index) => {
      const tileNumber = index + 1;
      const formattedNum = String(tileNumber).padStart(2, '0');
      const staggerClass = isFirstLoad ? 'tile-deal-in' : '';
      const staggerDelay = isFirstLoad ? `style="animation-delay: ${index * 40}ms;"` : '';

      if (itemId === 'vault_12') {
        // Submit Button (static until ready, then ONE gentle pulse)
        tilesHtml += `
          <button 
            type="button" 
            class="tile-card tile-style-submit ${submitPulseClass} ${staggerClass}"
            id="tile-vault-btn"
            ${staggerDelay}
            aria-label="Submit: Opens Vault Confirmation"
          >
            <div class="tile-submit-content">
              <span class="submit-icon">${ICONS.lock}</span>
              <span class="submit-label">Submit</span>
            </div>
          </button>
        `;
      } else {
        // Tiles 1..10
        const block = state.blocks[itemId] || { status: 'UNOPENED' };
        const status = block.status; // UNOPENED, AVAILABLE, OPENED, OPENED_IN_PROGRESS, SOLVED, FAILED
        const isInProgress = (status === 'OPENED' || status === 'OPENED_IN_PROGRESS');
        const isSolved = (status === 'SOLVED');
        const isFailed = (status === 'FAILED');

        let statusClass = 'status-unopened';
        let statusBadgeHtml = '';
        let isClickable = !isVaultEntered;
        let elapsedIndicator = '';

        let failedCrossOverlay = '';

        if (isInProgress) {
          statusClass = 'status-in-progress';
          statusBadgeHtml = `
            <div class="tile-corner-badge badge-in-progress" aria-label="Status: In progress">
              <span class="badge-icon">${ICONS.clock}</span>
              <span class="badge-text">In progress</span>
            </div>
          `;
          elapsedIndicator = `<div class="tile-time-elapsed tile-elapsed-inprogress">In progress</div>`;
        } else if (isSolved) {
          statusClass = 'status-solved';
          statusBadgeHtml = `
            <div class="tile-corner-badge badge-solved" aria-label="Status: Solved">
              <span class="badge-icon">${ICONS.check}</span>
              <span class="badge-text">Solved</span>
            </div>
          `;
          elapsedIndicator = `<div class="tile-time-elapsed tile-elapsed-solved">Solved</div>`;
        } else if (isFailed) {
          statusClass = 'status-failed';
          statusBadgeHtml = `
            <div class="tile-corner-badge badge-failed" aria-label="Status: Failed">
              <span class="badge-icon">${ICONS.cross}</span>
              <span class="badge-text">Failed</span>
            </div>
          `;
          elapsedIndicator = `<div class="tile-time-elapsed tile-elapsed-failed">Failed</div>`;
          failedCrossOverlay = `
            <svg class="tile-failed-cross-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" />
              <line x1="100" y1="0" x2="0" y2="100" vector-effect="non-scaling-stroke" />
            </svg>
          `;
          isClickable = false; // Failed tiles are locked for good
        }

        let statusHumanLabel = 'Unopened';
        if (isInProgress) {
          statusHumanLabel = 'In progress';
        } else if (isSolved) {
          statusHumanLabel = 'Solved';
        } else if (isFailed) {
          statusHumanLabel = 'Failed';
        }

        const puzzleDiff = (CONFIG.TILE_DIFFICULTY && CONFIG.TILE_DIFFICULTY[itemId])
          || (CONFIG.PUZZLES[itemId] && CONFIG.PUZZLES[itemId].difficulty)
          || 'medium';
        const foodBadgeHtml = getFoodBadgeSvg(puzzleDiff);
        const timeLimitSec = (CONFIG.DIFFICULTY_TIME && CONFIG.DIFFICULTY_TIME[puzzleDiff])
          || (puzzleDiff === 'easy' ? 600 : puzzleDiff === 'medium' ? 900 : 1200);
        const timeLimitMin = Math.round(timeLimitSec / 60);

        if (isInProgress) {
          const remSec = GameState.getPuzzleRemainingSeconds(itemId);
          elapsedIndicator = `
            <div class="tile-time-elapsed tile-elapsed-inprogress" data-puzzle-id="${itemId}">
              <span class="tile-clock-icon">${ICONS.clock}</span>
              <span class="tile-time-left-text">${this.formatTime(remSec)} left</span>
            </div>
          `;
        }

        tilesHtml += `
          <button 
            type="button" 
            class="tile-card tile-puzzle tile-style-gradient ${statusClass} ${staggerClass} ${!isClickable ? 'tile-disabled' : ''}" 
            data-puzzle-id="${itemId}"
            data-tile-index="${index}"
            data-tile-num="${tileNumber}"
            ${staggerDelay}
            ${!isClickable ? 'disabled aria-disabled="true"' : ''}
            aria-label="Task ${tileNumber}, Difficulty: ${puzzleDiff}, Time Limit: ${timeLimitMin} minutes, Status: ${statusHumanLabel}"
          >
            ${failedCrossOverlay}
            <div class="tile-top-row">
              <span class="tile-task-tag">Task ${tileNumber}</span>
              ${foodBadgeHtml}
              <span class="tile-duration-pill" title="Allocated Time: ${timeLimitMin} minutes">${timeLimitMin}m</span>
            </div>
            <div class="tile-gradient-number mono">${formattedNum}</div>
            ${elapsedIndicator}
            ${statusBadgeHtml}
          </button>
        `;
      }
    });

    container.innerHTML = `
      <section class="screen-container grid-screen" aria-labelledby="grid-page-title">
        <!-- Grid Header with Helper Line -->
        <header class="grid-header">
          <div class="grid-header-main">
            <h1 id="grid-page-title" class="page-title">Puzzle Grid</h1>
            <p class="page-description">
              Select any open tile to solve its puzzle. Solve puzzles to unlock clues and technical specifications for your final submission.
            </p>
            <p class="grid-helper-line">Pick any tile. Your timer starts when you open it.</p>
          </div>
          ${isVaultEntered ? `
            <div class="alert alert-info">
              <strong>Contest Read-Only:</strong> You have entered the submission vault. Puzzle tiles are frozen.
              <a href="#/vault" class="text-link" style="margin-left: 8px;">Go to Vault</a>
            </div>
          ` : ''}
        </header>

        <!-- Grid HUD Header -->
        <div class="grid-hud-header" role="region" aria-label="Contest HUD Bar">
          <div class="hud-stat-group">
            <div class="hud-progress-ring-box" title="Solved ${solvedCount} of ${totalQuestCount} puzzles (${progressPct}%)">
              <div class="hud-progress-ring">
                <svg class="hud-ring-svg" viewBox="0 0 56 56" aria-hidden="true">
                  <circle class="hud-ring-bg" cx="28" cy="28" r="24" fill="none" stroke-width="4"></circle>
                  <circle class="hud-ring-fill" cx="28" cy="28" r="24" fill="none" stroke-width="4" stroke-dasharray="150.8" stroke-dashoffset="${ringDashOffset}"></circle>
                </svg>
                <div class="hud-ring-text">${solvedCount}/${totalQuestCount}</div>
              </div>
              <div class="hud-stat-item">
                <span class="hud-stat-label">Progress</span>
                <span class="hud-stat-value">${progressPct}% Solved</span>
              </div>
            </div>

            <div class="hud-stat-item">
              <span class="hud-stat-label">Time Remaining</span>
              <span class="hud-stat-value mono" id="hud-master-timer">${this.formatTime(masterRemaining, true)}</span>
            </div>

            <div class="hud-stat-item">
              <span class="hud-stat-label">Hints Remaining</span>
              <span class="hud-stat-value">${state.hintsRemaining !== undefined ? state.hintsRemaining : 3}/3</span>
            </div>
          </div>

          <div class="hud-stat-item">
            <span class="hud-stat-label">Active Team</span>
            <span class="hud-stat-value text-truncate" style="max-width: 180px;">${state.teamName || 'Team'}</span>
          </div>
        </div>

        <!-- Clue Pouch Strip with Animated Route Line -->
        <div class="clue-pouch-strip" role="region" aria-label="Unlocked Clue Pouch">
          <div class="pouch-label">
            ${ICONS.pouch || ''}
            <span>Clue Pouch</span>
          </div>
          <div class="pouch-route-container" aria-hidden="true">
            <svg class="pouch-route-svg" viewBox="0 0 1000 12" preserveAspectRatio="none">
              <line x1="20" y1="6" x2="980" y2="6" stroke="#2B1E4A" stroke-width="2" stroke-dasharray="6 6" />
              <line x1="20" y1="6" x2="980" y2="6" stroke="#FFC928" stroke-width="2.5" stroke-dasharray="960" stroke-dashoffset="${routeDashOffset}" class="pouch-route-active" />
            </svg>
          </div>
          <div class="pouch-slots-row">
            ${pouchSlotsHtml}
          </div>
        </div>

        <!-- 11 Tiles Grid (10 Puzzles + 1 Submit) -->
        <div class="puzzle-grid" role="region" aria-label="Puzzle Grid of 11 Tiles">
          ${tilesHtml}
        </div>
      </section>
    `;

    // Desktop Pointer Tilt (max 5 degrees, throttled to 1 rAF, disabled on touch/lite-mode)
    const gridEl = container.querySelector('.puzzle-grid');
    if (gridEl && !document.body.classList.contains('lite-mode') && !window.matchMedia('(hover: none) or (pointer: coarse)').matches) {
      let tileTiltRaf = null;
      let activeTile = null;
      let rx = 0;
      let ry = 0;

      gridEl.querySelectorAll('.tile-puzzle').forEach(tile => {
        tile.addEventListener('mousemove', (e) => {
          if (tile.classList.contains('status-failed') || tile.disabled) return;
          if (document.body.classList.contains('lite-mode')) return;
          const rect = tile.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          activeTile = tile;
          rx = -y * 10;
          ry = x * 10;

          if (!tileTiltRaf) {
            tileTiltRaf = requestAnimationFrame(() => {
              if (activeTile) {
                activeTile.style.transform = `perspective(600px) translateY(-3px) rotateX(${rx}deg) rotateY(${ry}deg)`;
              }
              tileTiltRaf = null;
            });
          }
        }, { passive: true });

        tile.addEventListener('mouseleave', () => {
          tile.style.transform = '';
          activeTile = null;
        });
      });
    }

    // Bind clicks to puzzle tiles (save expand transition flag)
    const puzzleButtons = container.querySelectorAll('.tile-puzzle:not([disabled])');
    puzzleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const puzzleId = btn.dataset.puzzleId;
        try { sessionStorage.setItem('future_quest_expand_tile', '1'); } catch (e) {}
        router.navigate(`/puzzle/${puzzleId}`);
      });
    });

    // Bind click to Vault tile (Submit)
    const vaultBtn = container.querySelector('#tile-vault-btn');
    if (vaultBtn) {
      vaultBtn.addEventListener('click', () => {
        if (state.vaultEntered) {
          router.navigate('/vault');
        } else {
          Modal.showVaultConfirmation(() => {
            GameState.enterVault(false);
            router.navigate('/vault');
          });
        }
      });
    }

    // Bind clicks to pouch slots (navigates to puzzle if opened/solved)
    const pouchSlots = container.querySelectorAll('.pouch-slot');
    pouchSlots.forEach(slot => {
      slot.addEventListener('click', () => {
        const puzzleId = slot.dataset.puzzleId;
        if (!puzzleId) return;
        const b = state.blocks[puzzleId];
        if (b && b.status === 'FAILED') {
          showToast('This task time limit expired and is permanently locked.', 'warning');
          return;
        }
        if (isVaultEntered) {
          router.navigate('/vault');
        } else {
          router.navigate(`/puzzle/${puzzleId}`);
        }
      });
      slot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          slot.click();
        }
      });
    });
  },

  // =========================================================================
  // 3. PUZZLE SCREEN (#/puzzle/:id)
  // =========================================================================
  renderPuzzle(container, router, puzzleId) {
    this.unmountCurrentPuzzle();
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    const isBonus = false;

    let state = GameState.state;
    if (!state) {
      state = GameState.loadState();
      GameState.state = state;
    }
    if (!state && GameState.hasSession()) {
      state = {
        teamName: 'Team',
        timerStartedAt: Date.now(),
        vaultEntered: false,
        hintsRemaining: 3,
        gridOrder: [...Object.keys(CONFIG.PUZZLES), 'vault_12'],
        blocks: {},
      };
      GameState.state = state;
      GameState.saveState();
    }
    if (!state) {
      router.navigate('/landing');
      return;
    }
    state.blocks = state.blocks || {};
    if (!state.blocks[puzzleId]) {
      state.blocks[puzzleId] = {
        status: 'AVAILABLE',
        attemptsUsed: 0,
        hintUsed: false,
        timeSpentMs: 0,
        activeSince: null,
        progress: {},
      };
      GameState.saveState();
    }

    if (state.vaultEntered) {
      router.navigate('/vault');
      return;
    }

    const puzzleConfig = CONFIG.PUZZLES[puzzleId];
    if (!puzzleConfig) {
      router.navigate('/grid');
      return;
    }

    const block = state.blocks?.[puzzleId] || {};
    const difficulty = (CONFIG.TILE_DIFFICULTY && CONFIG.TILE_DIFFICULTY[puzzleId])
      || puzzleConfig.difficulty
      || block.difficulty
      || 'medium';
    let totalPuzzleSec = block.timeLimitSeconds
      || puzzleConfig.timeLimit
      || (CONFIG.DIFFICULTY_TIME && CONFIG.DIFFICULTY_TIME[difficulty])
      || (difficulty === 'easy' ? 600 : difficulty === 'medium' ? 900 : 1200);

    // Register puzzle open immediately (ensures backend timer starts and syncs)
    GameState.openPuzzle(puzzleId).then(() => {
      const updatedBlock = GameState.state?.blocks?.[puzzleId];
      const curDiff = updatedBlock?.difficulty || difficulty;
      const curLimit = updatedBlock?.timeLimitSeconds || GameState.getPuzzleTimeLimit(puzzleId) || totalPuzzleSec;
      totalPuzzleSec = curLimit;
      const mins = Math.floor(curLimit / 60);

      const badgeEl = container.querySelector('.difficulty-badge');
      if (badgeEl) {
        badgeEl.className = `difficulty-badge difficulty-${curDiff}`;
        badgeEl.innerHTML = `${getFoodBadgeSvg(curDiff)} <span>${curDiff.toUpperCase()} (${mins} MIN)</span>`;
      }

      const timerEl = document.getElementById('puzzle-countdown');
      if (timerEl && updatedBlock && updatedBlock.status !== 'SOLVED' && updatedBlock.status !== 'FAILED') {
        const curRem = GameState.getPuzzleRemainingSeconds(puzzleId);
        timerEl.textContent = this.formatTime(curRem);
      }
    }).catch(err => {
      console.warn('Could not open puzzle on server:', err);
    });

    const isNoHint = !!(CONFIG.NO_HINT_PUZZLES && CONFIG.NO_HINT_PUZZLES.includes(puzzleId));

    // Find tile index for display and determine tile label
    const questPuzzles = !CONFIG.SHUFFLE_TILES
      ? Object.keys(CONFIG.PUZZLES)
      : (state.gridOrder || []).filter(id => id !== 'vault_12');
    const tileIndex = questPuzzles.indexOf(puzzleId);
    const tileNumber = tileIndex !== -1 ? String(tileIndex + 1).padStart(2, '0') : '00';
    const tileLabel = getTileLabel(tileIndex);

    // Initial check for puzzle timer expiration
    const initialRemainingSec = GameState.getPuzzleRemainingSeconds(puzzleId);
    // Puzzle timer is active whenever player is in puzzle and puzzle is not already solved or failed
    const isBlockActive = (block.status !== 'SOLVED' && block.status !== 'FAILED');
    if (initialRemainingSec <= 0 && isBlockActive) {
      GameState.failPuzzle(puzzleId, 'TIMEOUT');
      this.showNotice(`Time expired for ${tileLabel}. The puzzle has failed.`, 'danger');
      router.navigate('/grid');
      return;
    }

    const puzzleType = puzzleConfig.type;
    const attemptsLeft = Math.max(0, CONFIG.MAX_ATTEMPTS - (block.attemptsUsed || 0));

    // How-to-play guide definitions
    const HOWTO_GUIDES = {
      ascii: [
        { num: '1', title: 'DECIMAL CODES', text: "Observe the decimal ASCII values on each active card (e.g. 65='A', 97='a')." },
        { num: '2', title: 'TABLE / STEPPER', text: 'Reference the side ASCII chart or rotate stepper/cipher dials to find characters.' },
        { num: '3', title: 'CARD LOCK', text: 'Type letters into slots. When a word is correct, it slides together and locks the word.' }
      ],
      bodmas: [
        { num: '1', title: 'BODMAS ORDER', text: 'Calculate equations following Brackets, Powers, Multiplication/Division, Addition/Subtraction.' },
        { num: '2', title: 'NUMBER TO LETTER', text: 'Convert resulting integer into a letter (1=A, 2=B ... 26=Z) using the numbered scale.' },
        { num: '3', title: 'TRAY & SLOTS', text: 'Place letters into matching target slots or drag anagram tiles into sequence.' }
      ],
      coords: [
        { num: '1', title: 'COORDINATE PAIR', text: 'Read the (Col, Row) pair. Check axis label to confirm standard or Cartesian orientation.' },
        { num: '2', title: 'CROSSHAIR SWEEP', text: 'Hover or tap on the 7×7 grid. Follow the crosshairs to align column and row.' },
        { num: '3', title: 'TRANSFER LETTER', text: 'Click target cell to fly letter into the active word chip, or trace route steps.' }
      ],
      wordsearch: [
        { num: '1', title: 'WORD TARGETS', text: 'Review target tech keywords or definition clues listed in the right-hand panel.' },
        { num: '2', title: 'DRAG & SNAP', text: 'Drag pointer across letters in any of 8 directions, or tap start and end letters.' },
        { num: '3', title: 'CAPSULE LOCK', text: 'Found terms lock in colored capsules, progress scales up, and clue cards flip.' }
      ],
      riddle: [
        { num: '1', title: 'ANALYZE RIDDLE', text: 'Carefully read the cryptic clues, tech specs, and wordplay in the riddle card.' },
        { num: '2', title: 'TYPE KEYCAPS', text: 'Type letters into the character slots or use backspace to edit your deduction.' },
        { num: '3', title: 'VERIFY & UNLOCK', text: 'Click Check Answer or complete the phrase to lock in your solution and reveal the secret clue.' }
      ]
    };

    const howToKey = `future_quest_howto_${puzzleType}`;
    let alreadySeen = false;
    try {
      alreadySeen = !!localStorage.getItem(howToKey);
    } catch (e) {}

    const isDrawerOpen = !alreadySeen;
    if (!alreadySeen) {
      try {
        localStorage.setItem(howToKey, '1');
      } catch (e) {}
    }

    const STEP_ICONS = {
      '1': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      '2': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
      '3': `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
    };

    const steps = HOWTO_GUIDES[puzzleType] || HOWTO_GUIDES.ascii;
    const howToStepsHtml = steps.map(s => `
      <div class="howto-step-card keycap">
        <div class="howto-step-header">
          <span class="howto-step-badge step-badge-${s.num} mono">
            <span class="howto-step-icon">${STEP_ICONS[s.num] || ''}</span>
            <span>STEP ${s.num}</span>
          </span>
          <h4 class="howto-step-title mono">${s.title}</h4>
        </div>
        <p class="howto-step-desc">${s.text}</p>
      </div>
    `).join('');

    const initialScalePct = Math.max(0, Math.min(1, initialRemainingSec / totalPuzzleSec));

    // Shared-element expand-in motion when opening from grid
    let expandClass = '';
    if (sessionStorage.getItem('future_quest_expand_tile') && !document.body.classList.contains('lite-mode')) {
      try { sessionStorage.removeItem('future_quest_expand_tile'); } catch (e) {}
      expandClass = 'puzzle-expand-in';
    }

    // Render Streamlined Single-Stage Screen
    container.innerHTML = `
      <section class="screen-container puzzle-screen theme-${puzzleType} ${expandClass}" data-puzzle-type="${puzzleType}" aria-labelledby="puzzle-band-task-heading">
        <!-- 1. Header Band with Flat #3A2166 Surface, matching Purple Tile -->
        <header class="puzzle-header-band" role="banner">
          <div class="puzzle-header-band-inner">
            <div class="puzzle-header-left">
              <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-back-grid" aria-label="Back to Grid">
                ${ICONS.arrowLeft} <span>Back to Grid</span>
              </button>
              <div class="puzzle-header-task-info">
                <span id="puzzle-band-task-heading" class="puzzle-band-task-label mono">TASK ${tileNumber}</span>
                <div class="difficulty-badge difficulty-${difficulty}">
                  ${getFoodBadgeSvg(difficulty)}
                  <span>${difficulty.toUpperCase()} (${Math.floor(totalPuzzleSec / 60)} MIN)</span>
                </div>
                <div class="puzzle-category-tag mono">${puzzleConfig.category}</div>
              </div>
            </div>
            
            <div class="puzzle-header-right">
              <div class="puzzle-timer-badge ${initialRemainingSec < 120 && isBlockActive ? 'timer-low' : ''}">
                <span class="timer-icon">${ICONS.clock}</span>
                <span class="timer-value mono" id="puzzle-countdown">${this.formatTime(initialRemainingSec)}</span>
              </div>
              <div class="puzzle-band-big-num mono" aria-hidden="true">${tileNumber}</div>
            </div>
          </div>

          <!-- Per-puzzle Timer Progress Scale Bar -->
          <div class="puzzle-timer-track">
            <div 
              class="puzzle-timer-scale-bar ${initialRemainingSec < 120 ? 'timer-amber' : ''}" 
              id="puzzle-timer-scale" 
              style="transform: scaleX(${initialScalePct});"
            ></div>
          </div>
        </header>

        <!-- Status Notification Banner -->
        <div id="puzzle-status-banner"></div>

        <!-- 2. Objective & How to Play Row -->
        <div class="puzzle-instruction-row">
          <div class="puzzle-instruction-text">
            <span class="instruction-label mono">OBJECTIVE:</span>
            <p class="what-to-do-text">${puzzleConfig.whatToDo || 'Analyze the technical requirements and solve the challenge below.'}</p>
          </div>
          <button type="button" class="btn-toggle-howto keycap" id="btn-toggle-howto" aria-expanded="${isDrawerOpen ? 'true' : 'false'}" aria-controls="puzzle-howto-drawer">
            <span class="howto-icon">ℹ</span>
            <span class="howto-btn-text">How to play</span>
          </button>
        </div>

        <!-- How to Play Drawer -->
        <div class="puzzle-howto-drawer ${isDrawerOpen ? 'drawer-expanded' : ''}" id="puzzle-howto-drawer" role="region" aria-label="How to play instructions">
          <div class="howto-drawer-inner">
            <div class="howto-drawer-title mono">HOW TO SOLVE THIS PUZZLE:</div>
            <div class="howto-steps-grid">${howToStepsHtml}</div>
            <div class="howto-footer-action" style="margin-top: 14px; text-align: right;">
              <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-howto-gotit">Got it, close instructions</button>
            </div>
          </div>
        </div>

        <!-- Revealed Hint Box (if used) -->
        <div id="puzzle-hint-display" class="puzzle-hint-display ${block.hintUsed ? 'hint-visible' : ''}">
          ${block.hintUsed ? `
            <div class="revealed-hint-box keycap" role="region" aria-label="Revealed Hint">
              <span class="hint-icon">${ICONS.hint}</span>
              <div class="hint-content">
                <strong class="mono">PUZZLE HINT:</strong>
                <p class="hint-text">${block.revealedHint || puzzleConfig.hint || ''}</p>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 3. Puzzle Stage: Flat full-width surface -->
        <main id="puzzle-stage" class="puzzle-stage-surface theme-${puzzleType}" data-puzzle-type="${puzzleType}">
          <!-- Dynamic Interactive Module -->
          <div id="puzzle-interactive-container"></div>
        </main>

        <!-- 4. Unlocked Technical Clue Container (slides in below stage when solved) -->
        <div id="puzzle-clue-container" class="puzzle-clue-container"></div>

        <!-- DEV-ONLY: Puzzle Testing Toolbar -->
        ${CONFIG.DEV_MODE ? `
          <div class="dev-toolbar dev-only" style="margin: 12px 16px; padding: 8px 14px; background: rgba(255, 153, 0, 0.08); border: 1px dashed #FF9900; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span class="mono" style="font-size: 11px; color: #FFB340;">/* DEV-ONLY */ Puzzle Shortcuts:</span>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm keycap dev-only" id="btn-dev-solve" style="font-size: 11px; border-color: #3FB950; color: #3FB950;">
                Mark Solved (dev)
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 5. Sticky Bottom Action Bar -->
        <footer class="puzzle-sticky-action-bar" id="puzzle-sticky-action-bar" role="region" aria-label="Puzzle Actions">
          <div class="action-bar-inner">
            <div class="action-bar-left">
              <!-- Attempts Display (Unlimited) -->
              <div class="action-bar-attempts" id="action-attempts-box" title="Unlimited attempts allowed">
                <span class="action-bar-label mono">ATTEMPTS</span>
                <div class="key-pips-row mono" id="action-attempts-pips" style="font-size: 12px; font-weight: 600; color: #F0EDF6; display: flex; align-items: center; gap: 5px;">
                  <span style="color: #60A5FA;">✦</span>
                  <span id="action-attempts-count">Unlimited (${block.attemptsUsed || 0} tried)</span>
                </div>
              </div>
              
              <!-- Hints with Lantern Icon Button -->
              <div class="action-bar-hints" id="action-hints-box">
                <button 
                  type="button" 
                  class="btn btn-secondary btn-sm keycap action-hint-btn" 
                  id="btn-use-hint"
                  ${isNoHint || state.hintsRemaining <= 0 || block.hintUsed || block.status === 'SOLVED' || block.status === 'FAILED' ? 'disabled aria-disabled="true"' : ''}
                >
                  <span class="btn-hint-lantern ${isNoHint || block.hintUsed ? 'lantern-dark' : 'lantern-lit'}">${isNoHint || block.hintUsed ? ICONS.lanternDark : ICONS.lanternLit}</span>
                  <span>${isNoHint ? 'No hints here' : (block.hintUsed ? 'Hint Used' : 'Hint')}</span>
                  ${!isNoHint ? `
                    <span class="hint-mini-pips" id="action-hint-pips">
                      ${Array.from({ length: 3 }, (_, i) => `
                        <span class="hint-mini-pip ${i < state.hintsRemaining ? 'pip-active' : 'pip-used'}">${i < state.hintsRemaining ? PUZZLE_ART.pipFilled : PUZZLE_ART.pipHollow}</span>
                      `).join('')}
                    </span>
                  ` : ''}
                </button>
              </div>
            </div>

            <div class="action-bar-center" id="action-notice-center">
              <span class="action-bar-notice" id="action-bar-notice-text"></span>
            </div>

            <div class="action-bar-right">
              ${puzzleType !== 'wordsearch' ? `
                <button 
                  type="button" 
                  class="btn btn-primary keycap action-check-btn" 
                  id="btn-check-main"
                  ${block.status === 'SOLVED' || block.status === 'FAILED' ? 'disabled' : ''}
                >
                  Check Answer
                </button>
              ` : ''}
            </div>
          </div>
        </footer>
      </section>
    `;

    // 16-Piece CSS Celebration Particle Burst
    const triggerSolveBurst = () => {
      const stage = container.querySelector('#puzzle-stage');
      if (!stage) return;
      const burstContainer = document.createElement('div');
      burstContainer.className = 'solve-burst-container';
      for (let i = 0; i < 16; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        const angle = `${i * (360 / 16)}deg`;
        const dist = `${45 + (i % 3) * 18}px`;
        p.style.setProperty('--angle', angle);
        p.style.setProperty('--dist', dist);
        burstContainer.appendChild(p);
      }
      stage.appendChild(burstContainer);
      setTimeout(() => burstContainer.remove(), 700);
    };

    // Helper: Update status banner, action bar notice, and unlocked clue view
    const renderStatusAndClue = () => {
      const currentBlock = GameState.state?.blocks[puzzleId] || block;
      const statusBanner = container.querySelector('#puzzle-status-banner');
      const clueContainer = container.querySelector('#puzzle-clue-container');
      const attemptsPipsEl = container.querySelector('#action-attempts-pips');
      const actionNotice = container.querySelector('#action-bar-notice-text');
      const checkBtnMain = container.querySelector('#btn-check-main');
      const hintBtn = container.querySelector('#btn-use-hint');
      if (hintBtn && isNoHint) {
        hintBtn.disabled = true;
        hintBtn.setAttribute('aria-disabled', 'true');
      }

      const attemptsCountEl = container.querySelector('#action-attempts-count');
      if (attemptsCountEl) {
        attemptsCountEl.textContent = `Unlimited (${currentBlock.attemptsUsed || 0} tried)`;
      }

      // Status Banners & Action Notice
      if (currentBlock.status === 'SOLVED') {
        if (checkBtnMain) checkBtnMain.disabled = true;
        if (hintBtn) hintBtn.disabled = true;
        if (actionNotice) {
          actionNotice.textContent = 'SOLVED ✓ Technical clue unlocked';
          actionNotice.className = 'action-bar-notice notice-success mono';
        }
        if (statusBanner) {
          statusBanner.innerHTML = `
            <div class="alert alert-success" role="status">
              <span class="alert-icon">${ICONS.check}</span>
              <div class="alert-content">
                <strong>Puzzle Solved:</strong> Correct answer confirmed. Technical clue unsealed below.
              </div>
            </div>
          `;
        }
      } else if (currentBlock.status === 'FAILED') {
        if (checkBtnMain) checkBtnMain.disabled = true;
        if (hintBtn) hintBtn.disabled = true;
        if (actionNotice) {
          actionNotice.textContent = 'LOCKED (Time limit expired)';
          actionNotice.className = 'action-bar-notice notice-danger mono';
        }
        if (statusBanner) {
          statusBanner.innerHTML = `
            <div class="alert alert-danger" role="alert">
              <span class="alert-icon">${ICONS.cross}</span>
              <div class="alert-content">
                <strong>Puzzle Failed:</strong> Time limit expired. This tile is permanently locked.
              </div>
            </div>
          `;
        }
      } else {
        if (statusBanner) statusBanner.innerHTML = '';
      }

      // Sealed Clue Card with 3D Flip
      if (clueContainer) {
        if (currentBlock.status === 'SOLVED' && currentBlock.unlockedClue) {
          const clue = currentBlock.unlockedClue;
          let clueInnerHtml = '';

          if (clue.type === 'spec') {
            const specRows = (clue.specs || []).map(s => `
              <tr>
                <th scope="row" class="spec-label">${s.label}</th>
                <td class="spec-value"><code>${s.value}</code></td>
              </tr>
            `).join('');

            clueInnerHtml = `
              <div class="clue-card clue-spec keycap" aria-labelledby="clue-heading">
                <div class="clue-header">
                  <span class="clue-tag mono">SPECIFICATION CLUE UNLOCKED</span>
                  <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
                </div>
                ${clue.placementTip ? `
                  <div class="clue-placement-banner">
                    <span class="placement-badge mono">💡 POSTER PLACEMENT TIP</span>
                    <p class="placement-text">${clue.placementTip}</p>
                  </div>
                ` : ''}
                <div class="clue-body">
                  <table class="spec-table">
                    <tbody>${specRows}</tbody>
                  </table>
                </div>
                <div class="clue-actions">
                  <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-copy-specs">
                    ${ICONS.copy} <span>Copy Specifications</span>
                  </button>
                </div>
              </div>
            `;
          } else if (clue.type === 'text') {
            clueInnerHtml = `
              <div class="clue-card clue-text keycap" aria-labelledby="clue-heading">
                <div class="clue-header">
                  <span class="clue-tag mono">TEXT CONTENT CLUE UNLOCKED</span>
                  <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
                </div>
                ${clue.placementTip ? `
                  <div class="clue-placement-banner">
                    <span class="placement-badge mono">💡 POSTER PLACEMENT TIP</span>
                    <p class="placement-text">${clue.placementTip}</p>
                  </div>
                ` : ''}
                <div class="clue-body">
                  <div class="clue-copy-box">
                    <pre class="clue-pre mono"><code>${clue.content}</code></pre>
                  </div>
                </div>
                <div class="clue-actions">
                  <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-copy-text">
                    ${ICONS.copy} <span>Copy Text</span>
                  </button>
                </div>
              </div>
            `;
          } else if (clue.type === 'image') {
            const isRaster = !!clue.imageUrl;
            const imgContent = isRaster 
              ? `<img src="${clue.imageUrl}" alt="${clue.title}" class="clue-raster-preview" style="max-width:100%; max-height:220px; border-radius:6px; object-fit:contain; border:1px solid #3D3063;" />`
              : (clue.svgContent || '');
            const downloadBtn = isRaster
              ? `<a href="${clue.imageUrl}" download="${clue.filename || 'clue-asset.png'}" class="btn btn-secondary btn-sm keycap">${ICONS.download} <span>Download Image Asset</span></a>`
              : `<button type="button" class="btn btn-secondary btn-sm keycap" id="btn-download-svg">${ICONS.download} <span>Download SVG Asset</span></button>`;

            clueInnerHtml = `
              <div class="clue-card clue-image keycap" aria-labelledby="clue-heading">
                <div class="clue-header">
                  <span class="clue-tag mono">${isRaster ? 'IMAGE ASSET CLUE UNLOCKED' : 'VECTOR ASSET CLUE UNLOCKED'}</span>
                  <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
                  <p class="clue-caption">${clue.caption || ''}</p>
                </div>
                ${clue.placementTip ? `
                  <div class="clue-placement-banner">
                    <span class="placement-badge mono">💡 POSTER PLACEMENT TIP</span>
                    <p class="placement-text">${clue.placementTip}</p>
                  </div>
                ` : ''}
                <div class="clue-body">
                  <div class="svg-preview-box" style="display:flex; justify-content:center; align-items:center; padding:12px; background:#0B0814; border-radius:6px;">
                    ${imgContent}
                  </div>
                </div>
                <div class="clue-actions">
                  ${downloadBtn}
                </div>
              </div>
            `;
          }

          clueContainer.innerHTML = `
            <div class="sealed-clue-card is-unsealed">
              <div class="sealed-flipper">
                <div class="sealed-front">
                  <span class="sealed-seal-icon">${ICONS.gem || ICONS.checkCircle}</span>
                  <span class="sealed-label">TECHNICAL CLUE UNSEALED</span>
                </div>
                <div class="sealed-back">
                  ${clueInnerHtml}
                </div>
              </div>
            </div>
          `;
          clueContainer.classList.add('clue-visible');

          const copySpecsBtn = clueContainer.querySelector('#btn-copy-specs');
          if (copySpecsBtn) {
            copySpecsBtn.addEventListener('click', () => {
              const specText = (clue.specs || []).map(s => `${s.label}: ${s.value}`).join('\n');
              this.copyToClipboard(specText, copySpecsBtn);
            });
          }

          const copyTextBtn = clueContainer.querySelector('#btn-copy-text');
          if (copyTextBtn) {
            copyTextBtn.addEventListener('click', () => {
              this.copyToClipboard(clue.content || '', copyTextBtn);
            });
          }

          const downloadSvgBtn = clueContainer.querySelector('#btn-download-svg');
          if (downloadSvgBtn) {
            downloadSvgBtn.addEventListener('click', () => {
              this.downloadSvg(clue.svgContent, clue.filename);
            });
          }
        } else {
          clueContainer.innerHTML = '';
          clueContainer.classList.remove('clue-visible');
        }
      }
    };

    renderStatusAndClue();

    // Mount the Interactive Module Once
    const puzzleModule = PUZZLE_REGISTRY[puzzleType];
    const interactiveContainer = container.querySelector('#puzzle-interactive-container');

    if (puzzleModule && interactiveContainer) {
      const ctx = {
        getProgress: () => {
          const b = GameState.state?.blocks[puzzleId];
          return b?.progress || {};
        },
        saveProgress: (progressObj) => {
          GameState.saveProgress(puzzleId, progressObj);
        },
        isLocked: () => {
          const b = GameState.state?.blocks[puzzleId];
          return b?.status === 'SOLVED' || b?.status === 'FAILED' || GameState.isMasterExpired();
        },
        checkAnswer: async (payload) => {
          return await GameState.submitAnswer(puzzleId, payload);
        },
        onSolved: () => {
          GameState.markSolved(puzzleId);
          triggerSolveBurst();
          showToast(`Task ${tileNumber} solved! Clue unsealed.`, 'success');
          renderStatusAndClue();
        },
        onWrongCheck: () => {
          const res = GameState.recordWrong(puzzleId);
          renderStatusAndClue();
          // Screen-edge flash feedback (opacity only)
          const flash = document.getElementById('screen-edge-flash');
          if (flash && !document.body.classList.contains('lite-mode')) {
            flash.classList.add('flash-active');
            setTimeout(() => flash.classList.remove('flash-active'), 280);
          }
          // Shake the action bar attempts row
          const attemptsBox = container.querySelector('#action-attempts-box');
          if (attemptsBox) {
            attemptsBox.classList.add('key-shake');
            setTimeout(() => attemptsBox.classList.remove('key-shake'), 400);
          }
          showToast(`Incorrect answer. You have unlimited attempts—try again!`, 'amber');
        }
      };

      puzzleModule.mount(interactiveContainer, puzzleConfig.data, ctx);
      this.activePuzzleModule = puzzleModule;
      this.activePuzzleId = puzzleId;
    }

    // Event Listeners
    const backBtn = container.querySelector('#btn-back-grid');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.unmountCurrentPuzzle();
        GameState.leavePuzzle(puzzleId);
        router.navigate('/grid');
      });
    }

    const howToBtn = container.querySelector('#btn-toggle-howto');
    const howToDrawer = container.querySelector('#puzzle-howto-drawer');
    if (howToBtn && howToDrawer) {
      howToBtn.addEventListener('click', () => {
        const isExpanded = howToDrawer.classList.toggle('drawer-expanded');
        howToBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      });
    }

    const gotItBtn = container.querySelector('#btn-howto-gotit');
    if (gotItBtn && howToDrawer) {
      gotItBtn.addEventListener('click', () => {
        howToDrawer.classList.remove('drawer-expanded');
        if (howToBtn) howToBtn.setAttribute('aria-expanded', 'false');
        try { localStorage.setItem(howToKey, '1'); } catch (e) {}
      });
    }

    const hintBtn = container.querySelector('#btn-use-hint');
    if (hintBtn && !isNoHint) {
      hintBtn.addEventListener('click', () => {
        Modal.showHintConfirmation(state.hintsRemaining, async () => {
          try {
            const res = await GameState.useHint(puzzleId);
            const hintText = (res && res.hint) || block.revealedHint || puzzleConfig.hint || '';
            const hintDisplay = container.querySelector('#puzzle-hint-display');
            if (hintDisplay && hintText) {
              hintDisplay.innerHTML = `
                <div class="revealed-hint-box keycap" role="region" aria-label="Revealed Hint">
                  <span class="hint-icon">${ICONS.hint}</span>
                  <div class="hint-content">
                    <strong class="mono">PUZZLE HINT:</strong>
                    <p class="hint-text">${hintText}</p>
                  </div>
                </div>
              `;
              hintDisplay.classList.add('hint-visible');
            }
            const hintPipsEl = container.querySelector('#action-hint-pips');
            if (hintPipsEl) {
              hintPipsEl.innerHTML = Array.from({ length: 3 }, (_, i) => `
                <span class="hint-mini-pip ${i < state.hintsRemaining ? 'pip-active' : 'pip-used'}">${i < state.hintsRemaining ? PUZZLE_ART.pipFilled : PUZZLE_ART.pipHollow}</span>
              `).join('');
            }
            hintBtn.disabled = true;
            const lanternIcon = hintBtn.querySelector('.btn-hint-lantern');
            if (lanternIcon) {
              lanternIcon.className = 'btn-hint-lantern lantern-dark';
              lanternIcon.innerHTML = ICONS.lanternDark;
            }
            const hintSpan = hintBtn.querySelector('span:nth-child(2)');
            if (hintSpan) hintSpan.textContent = 'Hint Used';
            showToast('Hint unlocked for this puzzle.', 'info');
          } catch (err) {
            console.error('Failed to use hint:', err);
            showToast('Could not fetch hint from server. Please try again.', 'danger');
          }
        });
      });
    }

    const checkBtnMain = container.querySelector('#btn-check-main');
    if (checkBtnMain) {
      checkBtnMain.addEventListener('click', () => {
        if (this.activePuzzleModule && typeof this.activePuzzleModule.checkAnswer === 'function') {
          this.activePuzzleModule.checkAnswer();
        }
      });
    }

    // /* DEV-ONLY */ Test solver button
    if (CONFIG.DEV_MODE) {
      const devSolveBtn = container.querySelector('#btn-dev-solve');
      if (devSolveBtn) {
        devSolveBtn.addEventListener('click', () => {
          GameState.markSolved(puzzleId);
          triggerSolveBurst();
          showToast(`[DEV] Task ${tileNumber} marked solved!`, 'success');
          renderStatusAndClue();
        });
      }
    }

    const backGridBottom = container.querySelector('#btn-back-grid-bottom');
    if (backGridBottom) {
      backGridBottom.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.unmountCurrentPuzzle();
        GameState.leavePuzzle(puzzleId);
        router.navigate('/grid');
      });
    }

    // 1-second interval to update puzzle countdown display smoothly
    if (isBlockActive) {
      this.activePuzzleInterval = setInterval(() => {
        const remainingSec = GameState.getPuzzleRemainingSeconds(puzzleId);
        const timerEl = document.getElementById('puzzle-countdown');
        const scaleBar = document.getElementById('puzzle-timer-scale');

        if (timerEl) {
          timerEl.textContent = this.formatTime(remainingSec);
          const badge = timerEl.closest('.puzzle-timer-badge');
          if (badge) {
            const b = GameState.state?.blocks[puzzleId];
            const activeNow = (b && (b.status === 'OPENED' || b.status === 'OPENED_IN_PROGRESS'));
            if (remainingSec < 120 && activeNow) {
              badge.classList.add('timer-low');
            } else {
              badge.classList.remove('timer-low');
            }
          }
        }

        if (scaleBar) {
          const curLimit = GameState.getPuzzleTimeLimit(puzzleId) || totalPuzzleSec;
          const pct = Math.max(0, Math.min(1, remainingSec / curLimit));
          scaleBar.style.transform = `scaleX(${pct})`;
          if (remainingSec < 120) {
            scaleBar.classList.add('timer-amber');
          } else {
            scaleBar.classList.remove('timer-amber');
          }
        }

        // Polite voice/text announcements at 2:00 and 0:30
        if (remainingSec === 120 && !this.announced120) {
          this.announced120 = true;
          showToast(`2 minutes remaining for Task ${tileNumber}`, 'amber');
        }
        if (remainingSec === 30 && !this.announced30) {
          this.announced30 = true;
          showToast(`30 seconds remaining for Task ${tileNumber}!`, 'danger');
        }

        // Handle expiration
        const b = GameState.state?.blocks[puzzleId];
        const activeNow = (b && (b.status === 'OPENED' || b.status === 'OPENED_IN_PROGRESS'));
        if (remainingSec <= 0 && activeNow) {
          GameState.failPuzzle(puzzleId, 'TIMEOUT');
          this.unmountCurrentPuzzle();
          clearInterval(this.activePuzzleInterval);
          this.activePuzzleInterval = null;
          this.showNotice(`Time expired for ${tileLabel}. The puzzle has failed.`, 'danger');
          showToast(`Time expired for Task ${tileNumber}!`, 'danger');
          router.navigate('/grid');
        }
      }, 1000);
    }
  },

  // =========================================================================
  // 4. VAULT / SUBMISSION SCREEN (#/vault)
  // =========================================================================
  renderVault(container, router, wasTimeExpired = false) {
    this.unmountCurrentPuzzle();
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    const state = GameState.state;
    if (!state || !state.vaultEntered) {
      router.navigate('/grid');
      return;
    }

    // Vault Door Reveal Ceremony (once per browser session, skipped in lite mode)
    const isLite = document.body.classList.contains('lite-mode') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const doorKey = 'future_quest_vault_doors_opened';
    if (!isLite && !sessionStorage.getItem(doorKey)) {
      sessionStorage.setItem(doorKey, '1');
      const doorOverlay = document.createElement('div');
      doorOverlay.className = 'vault-door-overlay';
      doorOverlay.innerHTML = `
        <div class="vault-door-half vault-door-left"></div>
        <div class="vault-door-half vault-door-right"></div>
      `;
      document.body.appendChild(doorOverlay);
      requestAnimationFrame(() => {
        doorOverlay.classList.add('doors-open');
      });
      setTimeout(() => {
        if (doorOverlay.parentNode) doorOverlay.remove();
      }, 1300);
    }

    const summary = GameState.getSummary();

    // Assemble Clue Inventory
    const rawGridOrder = state.gridOrder || [];
    const validQuestIds = new Set(Object.keys(CONFIG.PUZZLES));
    const gridOrder = !CONFIG.SHUFFLE_TILES
      ? Object.keys(CONFIG.PUZZLES)
      : rawGridOrder.filter(id => validQuestIds.has(id));
    let inventoryHtml = '';
    const allClueTexts = [];

    gridOrder.forEach((itemId, idx) => {

      const tileNum = idx + 1;
      const formattedNum = String(tileNum).padStart(2, '0');
      const slotLabel = getTileLabel(idx);
      const block = state.blocks[itemId];
      const isSolved = block && block.status === 'SOLVED';
      const clue = block ? block.unlockedClue : null;

      if (isSolved && clue) {
        let actionBtnHtml = '';
        let clueBodyHtml = '';

        if (clue.type === 'spec') {
          const specSummary = (clue.specs || []).map(s => `${s.label}: ${s.value}`).join(' | ');
          clueBodyHtml = `
            ${clue.placementTip ? `<div class="vault-placement-tip"><span class="tip-pill mono">💡 PLACEMENT TIP</span> <span>${clue.placementTip}</span></div>` : ''}
            <div class="vault-clue-spec-snippet"><code>${specSummary}</code></div>
          `;
          const specExport = [
            clue.placementTip ? `Placement Tip: ${clue.placementTip}` : '',
            ...(clue.specs || []).map(s => `${s.label}: ${s.value}`)
          ].filter(Boolean).join('\n');
          allClueTexts.push(`--- Task ${tileNum}: ${clue.title} (Specifications) ---\n${specExport}`);
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-sm btn-vault-copy" data-text="${encodeURIComponent(specExport)}">
              ${ICONS.copy} <span>Copy Specs</span>
            </button>
          `;
        } else if (clue.type === 'text') {
          clueBodyHtml = `
            ${clue.placementTip ? `<div class="vault-placement-tip"><span class="tip-pill mono">💡 PLACEMENT TIP</span> <span>${clue.placementTip}</span></div>` : ''}
            <div class="vault-clue-text-snippet">${clue.content}</div>
          `;
          const textExport = [
            clue.placementTip ? `Placement Tip: ${clue.placementTip}` : '',
            clue.content
          ].filter(Boolean).join('\n\n');
          allClueTexts.push(`--- Task ${tileNum}: ${clue.title} (Text) ---\n${textExport}`);
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-sm btn-vault-copy" data-text="${encodeURIComponent(textExport)}">
              ${ICONS.copy} <span>Copy Text</span>
            </button>
          `;
        } else if (clue.type === 'image') {
          const isRaster = !!clue.imageUrl;
          if (isRaster) {
            clueBodyHtml = `
              ${clue.placementTip ? `<div class="vault-placement-tip"><span class="tip-pill mono">💡 PLACEMENT TIP</span> <span>${clue.placementTip}</span></div>` : ''}
              <div class="vault-clue-image-snippet" style="text-align:center; padding:8px; background:#0B0814; border-radius:4px;"><img src="${clue.imageUrl}" alt="${clue.title}" style="max-width:100%; max-height:120px; object-fit:contain; border-radius:4px;" /></div>
            `;
            const imgExport = [
              `[Image File: ${clue.filename || clue.imageUrl}]`,
              clue.placementTip ? `Placement Tip: ${clue.placementTip}` : '',
              clue.caption ? `Caption: ${clue.caption}` : ''
            ].filter(Boolean).join('\n');
            allClueTexts.push(`--- Task ${tileNum}: ${clue.title} (Image Asset) ---\n${imgExport}`);
            actionBtnHtml = `
              <a href="${clue.imageUrl}" download="${clue.filename || 'asset.png'}" class="btn btn-secondary btn-sm">
                ${ICONS.download} <span>Download Image</span>
              </a>
            `;
          } else {
            clueBodyHtml = `
              ${clue.placementTip ? `<div class="vault-placement-tip"><span class="tip-pill mono">💡 PLACEMENT TIP</span> <span>${clue.placementTip}</span></div>` : ''}
              <div class="vault-clue-image-snippet">${clue.svgContent}</div>
            `;
            const svgExport = [
              `[Attached SVG: ${clue.filename}]`,
              clue.placementTip ? `Placement Tip: ${clue.placementTip}` : '',
              clue.caption ? `Caption: ${clue.caption}` : ''
            ].filter(Boolean).join('\n');
            allClueTexts.push(`--- Task ${tileNum}: ${clue.title} (Vector Asset) ---\n${svgExport}`);
            actionBtnHtml = `
              <button type="button" class="btn btn-secondary btn-sm btn-vault-download" data-svg="${encodeURIComponent(clue.svgContent)}" data-filename="${clue.filename}">
                ${ICONS.download} <span>Download SVG</span>
              </button>
            `;
          }
        }

        inventoryHtml += `
          <div class="inventory-card inventory-unlocked vault-slot-card ${isLite ? '' : 'stagger-in'}" style="animation-delay: ${idx * 40}ms;">
            <div class="inventory-header">
              <span class="inventory-slot-badge">${slotLabel} (${formattedNum})</span>
              <span class="inventory-status-badge status-solved">${ICONS.check} Solved</span>
            </div>
            <h4 class="inventory-title">${clue.title}</h4>
            <div class="inventory-content">${clueBodyHtml}</div>
            <div class="inventory-actions">${actionBtnHtml}</div>
          </div>
        `;
      } else {
        // Unsolved / Failed slot (no leaked clue information)
        const statusLabel = block && block.status === 'FAILED' ? 'Failed' : 'Unsolved';
        inventoryHtml += `
          <div class="inventory-card inventory-locked vault-slot-card ${isLite ? '' : 'stagger-in'}" style="animation-delay: ${idx * 40}ms;">
            <div class="inventory-header">
              <span class="inventory-slot-badge">${slotLabel} (${formattedNum})</span>
              <span class="inventory-status-badge status-locked">${ICONS.lock} ${statusLabel}</span>
            </div>
            <h4 class="inventory-title">${slotLabel}: Locked Slot</h4>
            <div class="inventory-content">
              <p class="inventory-locked-msg">This task was not completed. Associated poster specifications remain locked.</p>
            </div>
          </div>
        `;
      }
    });

    const fullExportText = allClueTexts.join('\n\n');

    container.innerHTML = `
      <section class="screen-container vault-screen" aria-labelledby="vault-page-title">
        <header class="vault-header">
          <div class="brand-institution">${CONFIG.EVENT.fullName}</div>
          <h1 id="vault-page-title" class="page-title">Submission Vault</h1>
          <p class="page-description">
            Your competition time has stopped. All puzzle locks are finalized. Review your unlocked clues, copy specifications, and submit your final entry.
          </p>
        </header>

        ${wasTimeExpired || GameState.isMasterExpired() ? `
          <div class="alert alert-danger" role="alert">
            <span class="alert-icon">${ICONS.clock}</span>
            <div class="alert-content">
              <strong>Time is up:</strong> The 2-hour contest duration has ended. The vault has locked all remaining tasks and finalized your unlocked clues.
            </div>
          </div>
        ` : ''}

        <!-- 3-STEP VAULT WORKFLOW -->

        <!-- STEP 1: Performance Summary -->
        <div class="vault-step-card" role="region" aria-label="Step 1: Contest Performance Summary">
          <div class="vault-step-header">
            <span class="vault-step-badge">STEP 1</span>
            <h2 class="vault-step-title">Contest Performance Summary</h2>
          </div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Puzzles Solved</div>
              <div class="metric-value"><strong>${summary.solved}</strong> <span class="metric-sub">/ ${summary.total}</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Hints Used</div>
              <div class="metric-value"><strong>${summary.hintsUsed}</strong> <span class="metric-sub">/ ${CONFIG.TOTAL_HINTS}</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Time Taken</div>
              <div class="metric-value mono">
                <strong>${summary.timeTakenFormatted}</strong>
                <span class="vault-frozen-badge">FROZEN</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Team / School</div>
              <div class="metric-value text-truncate" title="${state.teamName}">${state.teamName}</div>
              <div class="metric-sub text-truncate" title="${state.schoolName}">${state.schoolName}</div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Clue Inventory -->
        <div class="vault-step-card" role="region" aria-label="Step 2: Poster Assets & Specifications">
          <div class="vault-step-header">
            <span class="vault-step-badge">STEP 2</span>
            <div class="vault-clues-header-actions">
              <h2 class="vault-step-title">Unlocked Submission Assets & Specifications</h2>
              ${allClueTexts.length > 0 ? `
                <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-all-clues">
                  ${ICONS.copy} <span>Copy All Clues</span>
                </button>
              ` : ''}
            </div>
            <p class="section-subtitle">Incorporate unlocked copy, colors, and layout requirements into your final submission.</p>
          </div>
          <div class="inventory-grid">
            ${inventoryHtml}
          </div>
        </div>

        <!-- STEP 3: Submission Checklist & Call to Action -->
        <div class="vault-step-card submission-cta-section" role="region" aria-label="Step 3: Official Poster Submission">
          <div class="vault-step-header">
            <span class="vault-step-badge">STEP 3</span>
            <h2 class="vault-step-title">Official Poster Submission & Entry Confirmation</h2>
            <p class="section-subtitle">Confirm readiness before proceeding to the official competition entry portal.</p>
          </div>

          <div class="vault-submission-grid">
            <div class="vault-submission-left">
              <!-- Team Identity & Verification -->
              <div class="vault-team-id-card">
                <div class="team-id-label">Verified Competition Team</div>
                <div class="team-id-details">
                  <div class="team-id-row">
                    <span class="team-id-key">Team Name:</span>
                    <strong class="mono team-id-val">${state.teamName}</strong>
                  </div>
                  <div class="team-id-row">
                    <span class="team-id-key">School:</span>
                    <strong class="mono team-id-val">${state.schoolName}</strong>
                  </div>
                </div>
              </div>

              <!-- Pre-submission Checklist -->
              <div class="vault-checklist">
                <label class="ready-check-item">
                  <input type="checkbox" id="chk-vault-specs" class="vault-pre-check" />
                  <span class="ready-check-text">We incorporated all unlocked specifications and placement guidelines into our poster.</span>
                </label>
                <label class="ready-check-item">
                  <input type="checkbox" id="chk-vault-ready" class="vault-pre-check" />
                  <span class="ready-check-text">Our poster design is finalized and ready for judging evaluation.</span>
                </label>
              </div>
            </div>

            <div class="vault-submission-right">
              <div class="vault-submit-action-box">
                <div class="cta-reminder">
                  <span class="reminder-icon">${ICONS.check}</span>
                  <p class="reminder-text">
                    "Use the content and specs you unlocked exactly. Everything else about your design is your creative choice."
                  </p>
                </div>
                <div class="cta-actions">
                  <a 
                    href="${CONFIG.POSTER_FORM_URL}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="btn btn-primary btn-lg btn-vault-submit"
                    id="btn-vault-final-submit"
                    style="pointer-events: none; opacity: 0.5;"
                  >
                    Submit Your Poster &rarr;
                  </a>
                </div>
                <p class="cta-note">Check both readiness items to unlock submission. Form opens in a secure new tab.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    // Bind copy and download handlers in vault
    const copyAllBtn = container.querySelector('#btn-copy-all-clues');
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', () => {
        this.copyToClipboard(fullExportText, copyAllBtn);
      });
    }

    container.querySelectorAll('.btn-vault-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.dataset.text || '');
        this.copyToClipboard(text, btn);
      });
    });

    container.querySelectorAll('.btn-vault-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const svg = decodeURIComponent(btn.dataset.svg || '');
        const filename = btn.dataset.filename || 'asset.svg';
        this.downloadSvg(svg, filename);
      });
    });

    // Bind pre-submit checkboxes to enable submission button
    const vaultChecks = container.querySelectorAll('.vault-pre-check');
    const finalSubmitLink = container.querySelector('#btn-vault-final-submit');
    if (finalSubmitLink) {
      vaultChecks.forEach(chk => {
        chk.addEventListener('change', () => {
          const allOk = Array.from(vaultChecks).every(c => c.checked);
          if (allOk) {
            finalSubmitLink.style.pointerEvents = 'auto';
            finalSubmitLink.style.opacity = '1';
          } else {
            finalSubmitLink.style.pointerEvents = 'none';
            finalSubmitLink.style.opacity = '0.5';
          }
        });
      });
    }
  },

  // =========================================================================
  // 5. RULES SCREEN (#/rules)
  // =========================================================================
  renderRules(container, router) {
    this.unmountCurrentPuzzle();
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    const hasSession = GameState.hasSession();

    container.innerHTML = `
      <section class="screen-container rules-screen" aria-labelledby="rules-page-title">
        <header class="rules-header">
          <div class="brand-institution">${CONFIG.EVENT.fullName}</div>
          <h1 id="rules-page-title" class="page-title">Competition Rules & Specifications</h1>
          <p class="page-description">Future Quest 2026 Official Contest Regulations</p>
        </header>

        <!-- 6-Line Quick Facts Card -->
        <div class="rules-facts-card" role="region" aria-label="Contest Quick Facts">
          <div class="quick-fact-item">
            <span class="quick-fact-label">Eligibility</span>
            <span class="quick-fact-val mono">Grades 11 & 12</span>
          </div>
          <div class="quick-fact-item">
            <span class="quick-fact-label">Team Size</span>
            <span class="quick-fact-val mono">3 to 5 Members</span>
          </div>
          <div class="quick-fact-item">
            <span class="quick-fact-label">Master Timer</span>
            <span class="quick-fact-val mono">2 Hours (7,200s)</span>
          </div>
          <div class="quick-fact-item">
            <span class="quick-fact-label">Puzzles</span>
            <span class="quick-fact-val mono">10 Tasks + Vault</span>
          </div>
          <div class="quick-fact-item">
            <span class="quick-fact-label">Hint Allocation</span>
            <span class="quick-fact-val mono">3 Hints Total</span>
          </div>
          <div class="quick-fact-item">
            <span class="quick-fact-label">Attempts</span>
            <span class="quick-fact-val mono">Unlimited</span>
          </div>
        </div>

        <!-- Split Layout: Sticky TOC + Collapsible Accordion Rules -->
        <div class="rules-layout-split">
          <!-- Desktop Sticky TOC Sidebar -->
          <nav class="rules-toc-sidebar desktop-only" aria-label="Table of Contents">
            <div class="rules-toc-title">TABLE OF CONTENTS</div>
            <ul class="rules-toc-list">
              <li><a href="#rule-1" class="rules-toc-link">1. Eligibility</a></li>
              <li><a href="#rule-2" class="rules-toc-link">2. Master Timer</a></li>
              <li><a href="#rule-3" class="rules-toc-link">3. Puzzle Limits</a></li>
              <li><a href="#rule-4" class="rules-toc-link">4. Grid & Attempts</a></li>
              <li><a href="#rule-5" class="rules-toc-link">5. Hint Policy</a></li>
              <li><a href="#rule-6" class="rules-toc-link">6. Submission Vault</a></li>
              <li><a href="#rule-7" class="rules-toc-link">7. Final Submission & Evaluation</a></li>
            </ul>
          </nav>

          <!-- Rules Content Body with Collapsible Details -->
          <div class="rules-content-body">
            <details class="rules-accordion" id="rule-1" open>
              <summary>1. Eligibility & Team Composition</summary>
              <p class="rule-text">
                The competition is strictly open to students enrolled in 11th and 12th grades (or equivalent secondary school years). Teams must consist of <strong>3 to 5 members</strong> from the same educational institution. Each team participates using one shared team terminal.
              </p>
            </details>

            <details class="rules-accordion" id="rule-2" open>
              <summary>2. Contest Master Time Limit</summary>
              <p class="rule-text">
                The competition has a strict <strong>2-hour (7,200 seconds)</strong> master countdown. The timer begins the moment your team completes the 3-2-1 launch countdown and runs continuously in the background across tab reloads or network drops. When the master countdown reaches zero, the puzzle phase terminates immediately and your session is locked into the Submission Vault.
              </p>
            </details>

            <details class="rules-accordion" id="rule-3" open>
              <summary>3. Per-Puzzle Time Limits</summary>
              <p class="rule-text">
                Each individual puzzle carries an independent countdown based on its assigned difficulty:
              </p>
              <ul class="rule-list" style="list-style: none; padding-left: 0;">
                <li style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span class="food-badge food-badge-easy"><span class="food-badge-icon"><span class="food-badge-dot"></span></span><span class="food-badge-label">Easy</span></span>
                  <span><strong>10 minutes</strong> (600 seconds)</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span class="food-badge food-badge-medium"><span class="food-badge-icon"><span class="food-badge-dot"></span></span><span class="food-badge-label">Medium</span></span>
                  <span><strong>15 minutes</strong> (900 seconds)</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                  <span class="food-badge food-badge-hard"><span class="food-badge-icon"><span class="food-badge-dot"></span></span><span class="food-badge-label">Hard</span></span>
                  <span><strong>20 minutes</strong> (1,200 seconds)</span>
                </li>
              </ul>
              <p class="rule-text">
                A puzzle's timer begins when you first enter its screen. A puzzle's timer keeps running if the tab is closed or reloaded, and pauses only when the team clicks "Back to grid". If a puzzle timer reaches zero, the puzzle is permanently marked as <strong>FAILED</strong> and locked.
              </p>
            </details>

            <details class="rules-accordion" id="rule-4" open>
              <summary>4. Puzzle Grid & Attempt Policy</summary>
              <p class="rule-text">
                Tiles 1 through 10 are randomized in order at contest initialization. All 10 puzzle tiles are unlocked from the start and can be attempted in any order. Each puzzle permits <strong>unlimited attempts</strong>—teams have complete freedom to try as many answers as needed without being locked out. A puzzle only expires and locks if its countdown timer reaches zero.
              </p>
              <p class="rule-text">
                Some puzzles involve reading code or using your browser's developer tools. Everything you need is on the page or in your browser.
              </p>
            </details>

            <details class="rules-accordion" id="rule-5" open>
              <summary>5. Hint Allocation</summary>
              <p class="rule-text">
                Each team is allocated exactly <strong>3 hints total</strong> for the entire 2-hour competition (shared across all 10 puzzles). Spending a hint permanently reveals a clue for that puzzle. Hints are non-refundable and cannot be re-assigned.
              </p>
            </details>

            <details class="rules-accordion" id="rule-6" open>
              <summary>6. The Submission Vault Warning</summary>
              <p class="rule-text">
                The final tile is the Submission Vault. Once you confirm entry into the Submission Vault, your master timer stops and all puzzle tiles become read-only. Unsolved puzzles remain unsolved and no further answers can be submitted. You will proceed to collect your unlocked poster assets and submit your final entry.
              </p>
            </details>

            <details class="rules-accordion" id="rule-7" open>
              <summary>7. Final Poster Submission & Evaluation</summary>
              <div class="rule-text">
                <p>
                  This web terminal does not use a points system. The platform is designed solely to present the 10 puzzle challenges and unlock your team's secret clues, text fragments, color palettes, and layout specifications.
                </p>
                <p>
                  Upon entering the Submission Vault, your team reviews all unlocked specifications and confirms readiness. Clicking the submission button redirects your team to the official Google Form where you submit your final poster design. The evaluation is based on your final poster entry and how accurately it incorporates the unlocked puzzle specifications.
                </p>
              </div>
            </details>
          </div>
        </div>

        <div class="rules-actions" style="margin-top: var(--space-6);">
          ${hasSession ? `
            <a href="#/grid" class="btn btn-primary">Return to Grid</a>
          ` : `
            <a href="#/register" class="btn btn-primary">Proceed to Registration</a>
          `}
        </div>
      </section>
    `;

    // Smooth scroll for TOC links
    container.querySelectorAll('.rules-toc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const el = container.querySelector(targetId);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }
};
