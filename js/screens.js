/**
 * Future Quest 2026 - Screens & Views
 * 
 * Implements rendering and event binding for:
 * - Entry Screen (#/home)
 * - Grid Screen (#/grid)
 * - Puzzle Screen (#/puzzle/:id)
 * - Vault Screen (#/vault)
 * - Rules Screen (#/rules)
 */

import { CONFIG, getTileLabel } from './config.js';
import { GameState } from './state.js';
import { ICONS } from './icons.js';
import { Modal } from './modal.js';
import { PUZZLE_REGISTRY } from './puzzles/index.js';
import { PUZZLE_ART } from './puzzles/art.js';

export const Screens = {
  activePuzzleInterval: null,
  activePuzzleModule: null,
  activePuzzleId: null,

  /**
   * Safely unmount active interactive puzzle module.
   */
  unmountCurrentPuzzle() {
    if (this.activePuzzleModule && typeof this.activePuzzleModule.unmount === 'function') {
      try {
        this.activePuzzleModule.unmount();
      } catch (e) {
        console.warn('Error unmounting puzzle module:', e);
      }
    }
    this.activePuzzleModule = null;
    this.activePuzzleId = null;
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
  },

  // =========================================================================
  // 0. LANDING SCREEN (#/landing)
  // =========================================================================
  renderLanding(container, router) {
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    // Build static 12-tile preview (tiles 1 to 11 purple gradient, tile 12 flat red Submit)
    let previewTilesHtml = '';
    for (let i = 1; i <= 11; i++) {
      const numStr = String(i).padStart(2, '0');
      previewTilesHtml += `
        <div class="preview-tile preview-tile-gradient">
          <span class="preview-tile-tag">Task ${i}</span>
          <span class="preview-tile-num mono">${numStr}</span>
        </div>
      `;
    }
    previewTilesHtml += `
      <div class="preview-tile preview-tile-submit">
        <span class="preview-submit-icon">${ICONS.lock}</span>
        <span class="preview-submit-label">Submit</span>
      </div>
    `;

    container.innerHTML = `
      <section class="screen-container landing-screen" aria-labelledby="landing-title">
        <header class="landing-header">
          <div class="brand-institution">Jain University - School of Future Technology</div>
          <h1 id="landing-title" class="landing-title">Future Quest 2026</h1>
          <p class="landing-sentence">
            An online puzzle round for school teams. Solve puzzles, collect clues, then rebuild the hidden poster.
          </p>
          <div class="landing-actions">
            <a href="#/register" class="btn btn-primary btn-lg">Start Event</a>
            <a href="#/rules" class="btn btn-secondary btn-lg">Read the rules</a>
          </div>
        </header>

        <!-- Compact Facts Row (Monospace Values) -->
        <div class="landing-facts-grid" role="region" aria-label="Contest Facts">
          <div class="fact-cell">
            <span class="fact-label">Eligibility</span>
            <span class="fact-val mono">Grades 11 and 12</span>
          </div>
          <div class="fact-cell">
            <span class="fact-label">Team Size</span>
            <span class="fact-val mono">Teams of 3 to 5</span>
          </div>
          <div class="fact-cell">
            <span class="fact-label">Duration</span>
            <span class="fact-val mono">2 hours</span>
          </div>
          <div class="fact-cell">
            <span class="fact-label">Format</span>
            <span class="fact-val mono">11 puzzles + submission</span>
          </div>
        </div>

        <!-- How it Works & Before You Start -->
        <div class="landing-details-grid">
          <div class="landing-card">
            <h2 class="landing-section-title">How it works</h2>
            <ol class="landing-steps-list">
              <li class="landing-step-item">
                <span class="step-badge mono">1</span>
                <span class="step-text">Register your team.</span>
              </li>
              <li class="landing-step-item">
                <span class="step-badge mono">2</span>
                <span class="step-text">Open any task in any order and solve it before its timer runs out.</span>
              </li>
              <li class="landing-step-item">
                <span class="step-badge mono">3</span>
                <span class="step-text">Every solved task unlocks a clue for the poster.</span>
              </li>
              <li class="landing-step-item">
                <span class="step-badge mono">4</span>
                <span class="step-text">Open Submit when you are done and send your poster.</span>
              </li>
            </ol>
          </div>

          <div class="landing-card">
            <h2 class="landing-section-title">Before you start</h2>
            <ul class="landing-checklist">
              <li class="landing-check-item">
                <span class="check-icon">${ICONS.check}</span>
                <span class="check-text">Whole team present</span>
              </li>
              <li class="landing-check-item">
                <span class="check-icon">${ICONS.check}</span>
                <span class="check-text">One shared device</span>
              </li>
              <li class="landing-check-item">
                <span class="check-icon">${ICONS.check}</span>
                <span class="check-text">Stable internet</span>
              </li>
              <li class="landing-check-item">
                <span class="check-icon">${ICONS.check}</span>
                <span class="check-text">The timer cannot be paused once it starts</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Static Non-clickable Grid Preview -->
        <div class="landing-preview-card">
          <div class="landing-preview-header">
            <h2 class="landing-section-title" style="border:none; padding:0; margin:0;">Grid preview</h2>
            <span class="text-muted" style="font-size: 11px; font-family: var(--font-mono);">12 Slots &bull; Fixed Preview</span>
          </div>
          <div class="landing-preview-grid" aria-hidden="true">
            ${previewTilesHtml}
          </div>
        </div>
      </section>
    `;
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
            <div class="brand-institution">Jain University - School of Future Technology</div>
            <h1 id="register-title" class="entry-title">Future Quest 2026</h1>
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

            <div class="entry-notice">
              <span class="notice-icon">${ICONS.clock}</span>
              <p class="notice-text">
                The 2-hour contest timer starts immediately when you click <strong>Begin Round</strong>. Ensure your entire team is assembled before proceeding.
              </p>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-block">Begin Round</button>
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

      if (!isValid) {
        alertError.textContent = 'Please fill out all required fields before starting.';
        alertError.style.display = 'block';
        return;
      }

      GameState.initSession(teamVal, schoolVal);
      router.navigate('/grid');
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

    const state = GameState.state;
    if (!state) {
      router.navigate('/landing');
      return;
    }

    // Check all OPENED_IN_PROGRESS puzzles so any expired puzzle becomes FAILED immediately
    GameState.checkExpiredPuzzles();

    const isVaultEntered = state.vaultEntered;

    // NOTE: Difficulty is a mystery. The grid and the nav bar never show or hint at
    // difficulty or time limits before a puzzle is opened. No difficulty in tile labels,
    // CSS classes, data attributes, tooltips, or aria-labels. Tile IDs (puzzle_1..11)
    // are opaque and do not reveal difficulty.
    // Build 12 tiles
    let tilesHtml = '';
    const gridOrder = state.gridOrder || [];

    gridOrder.forEach((itemId, index) => {
      const tileNumber = index + 1;
      const formattedNum = String(tileNumber).padStart(2, '0');

      if (itemId === 'vault_12' || index === 11) {
        // Tile 12: Red Submit Button
        // Solid red button (flat red, no gradient), full tile size, with label "Submit" and small lock icon.
        // It is never shuffled and is always in the last (bottom-right) slot.
        tilesHtml += `
          <button 
            type="button" 
            class="tile-card tile-style-submit"
            id="tile-vault-btn"
            aria-label="Tile 12: Submit (Opens Vault Confirmation)"
          >
            <div class="tile-submit-content">
              <span class="submit-icon">${ICONS.lock}</span>
              <span class="submit-label">Submit</span>
            </div>
          </button>
        `;
      } else {
        // Tiles 1..11
        const block = state.blocks[itemId] || { status: 'UNOPENED' };
        const status = block.status; // UNOPENED, OPENED_IN_PROGRESS, SOLVED, FAILED

        let statusClass = 'status-unopened';
        let statusBadgeHtml = '';
        let isClickable = true;

        if (status === 'OPENED_IN_PROGRESS') {
          statusClass = 'status-in-progress';
          statusBadgeHtml = `
            <div class="tile-corner-badge badge-in-progress" aria-label="Status: In progress">
              <span class="badge-icon">${ICONS.clock}</span>
              <span class="badge-text">In progress</span>
            </div>
          `;
        } else if (status === 'SOLVED') {
          statusClass = 'status-solved';
          statusBadgeHtml = `
            <div class="tile-corner-badge badge-solved" aria-label="Status: Solved">
              <span class="badge-icon">${ICONS.check}</span>
              <span class="badge-text">Solved</span>
            </div>
          `;
        } else if (status === 'FAILED') {
          statusClass = 'status-failed';
          statusBadgeHtml = `
            <div class="tile-corner-badge badge-failed" aria-label="Status: Failed">
              <span class="badge-icon">${ICONS.cross}</span>
              <span class="badge-text">Failed</span>
            </div>
          `;
          isClickable = false; // Failed tiles are locked for good
        }

        if (isVaultEntered) {
          isClickable = false; // All tiles read-only once vault entered
        }

        let statusHumanLabel = 'Unopened';
        if (status === 'OPENED_IN_PROGRESS') {
          statusHumanLabel = 'In progress';
        } else if (status === 'SOLVED') {
          statusHumanLabel = 'Solved';
        } else if (status === 'FAILED') {
          statusHumanLabel = 'Failed';
        }

        tilesHtml += `
          <button 
            type="button" 
            class="tile-card tile-puzzle tile-style-gradient ${statusClass} ${!isClickable ? 'tile-disabled' : ''}" 
            data-puzzle-id="${itemId}"
            data-tile-index="${index}"
            data-tile-num="${tileNumber}"
            ${!isClickable ? 'disabled aria-disabled="true"' : ''}
            aria-label="Task ${tileNumber}, Status: ${statusHumanLabel}"
          >
            <div class="tile-task-tag">Task ${tileNumber}</div>
            <div class="tile-gradient-number mono">${formattedNum}</div>
            ${statusBadgeHtml}
          </button>
        `;
      }
    });

    container.innerHTML = `
      <section class="screen-container grid-screen" aria-labelledby="grid-page-title">
        <header class="grid-header">
          <div class="grid-header-main">
            <h1 id="grid-page-title" class="page-title">Puzzle Grid</h1>
            <p class="page-description">
              Select any open tile to solve its puzzle. Solve puzzles to unlock clues and technical specifications for your final poster submission.
            </p>
          </div>
          ${isVaultEntered ? `
            <div class="alert alert-info">
              <strong>Contest Read-Only:</strong> You have entered the submission vault. Puzzle tiles are frozen.
              <a href="#/vault" class="text-link" style="margin-left: 8px;">Go to Vault</a>
            </div>
          ` : ''}
        </header>

        <div class="puzzle-grid" role="region" aria-label="Puzzle Grid of 12 Tiles">
          ${tilesHtml}
        </div>
      </section>
    `;

    // Bind clicks to puzzle tiles
    const puzzleButtons = container.querySelectorAll('.tile-puzzle:not([disabled])');
    puzzleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const puzzleId = btn.dataset.puzzleId;
        router.navigate(`/puzzle/${puzzleId}`);
      });
    });

    // Bind click to Vault tile (Tile 12)
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

    const state = GameState.state;
    if (!state || !state.blocks[puzzleId]) {
      router.navigate('/grid');
      return;
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

    // Register puzzle open (starts activeSince if unopened/in-progress)
    // NOTE: Difficulty is a mystery until opened. In production, difficulty and time
    // limits must come from the server later, since anything in client code can be read with DevTools.
    // They appear only on the puzzle screen after the tile has been opened and stay visible afterwards.
    const block = GameState.openPuzzle(puzzleId);
    const difficulty = CONFIG.TILE_DIFFICULTY[puzzleId] || 'easy';

    // Find tile index in gridOrder for display and determine tile label
    const tileIndex = (state.gridOrder || []).indexOf(puzzleId);
    const tileNumber = tileIndex !== -1 ? String(tileIndex + 1).padStart(2, '0') : '00';
    const tileLabel = getTileLabel(tileIndex);

    // Initial check for puzzle timer expiration
    const initialRemainingSec = GameState.getPuzzleRemainingSeconds(puzzleId);
    if (initialRemainingSec <= 0 && block.status === 'OPENED_IN_PROGRESS') {
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
        { num: '3', title: 'CARD LOCK', text: 'Type letters into slots. When a word is correct, it slides together and stamps the poster.' }
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

    const steps = HOWTO_GUIDES[puzzleType] || HOWTO_GUIDES.ascii;
    const howToStepsHtml = steps.map(s => `
      <div class="howto-step-card keycap">
        <div class="howto-step-header">
          <span class="step-badge mono">STEP ${s.num}</span>
          <span class="step-title">${s.title}</span>
        </div>
        <p class="step-desc">${s.text}</p>
      </div>
    `).join('');

    // Render Streamlined Single-Stage Screen
    container.innerHTML = `
      <section class="screen-container puzzle-screen" aria-labelledby="puzzle-band-task-heading">
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
                  ${difficulty.toUpperCase()} (${Math.floor(CONFIG.DIFFICULTY_TIME[difficulty] / 60)} MIN)
                </div>
                <div class="puzzle-category-tag mono">${puzzleConfig.category}</div>
              </div>
            </div>
            
            <div class="puzzle-header-right">
              <div class="puzzle-timer-badge ${initialRemainingSec < 120 && block.status === 'OPENED_IN_PROGRESS' ? 'timer-low' : ''}">
                <span class="timer-icon">${ICONS.clock}</span>
                <span class="timer-value mono" id="puzzle-countdown">${this.formatTime(initialRemainingSec)}</span>
              </div>
              <div class="puzzle-band-big-num mono" aria-hidden="true">${tileNumber}</div>
            </div>
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
          </div>
        </div>

        <!-- Revealed Hint Box (if used) -->
        <div id="puzzle-hint-display" class="puzzle-hint-display ${block.hintUsed ? 'hint-visible' : ''}">
          ${block.hintUsed ? `
            <div class="revealed-hint-box keycap" role="region" aria-label="Revealed Hint">
              <span class="hint-icon">${ICONS.hint}</span>
              <div class="hint-content">
                <strong class="mono">PUZZLE HINT:</strong>
                <p class="hint-text">${puzzleConfig.hint}</p>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 3. Puzzle Stage: Flat full-width surface -->
        <main id="puzzle-stage" class="puzzle-stage-surface">
          <!-- Dynamic Interactive Module -->
          <div id="puzzle-interactive-container"></div>
        </main>

        <!-- 4. Unlocked Technical Clue Container (slides in below stage when solved) -->
        <div id="puzzle-clue-container" class="puzzle-clue-container"></div>

        <!-- 5. Sticky Bottom Action Bar -->
        <footer class="puzzle-sticky-action-bar" id="puzzle-sticky-action-bar" role="region" aria-label="Puzzle Actions">
          <div class="action-bar-inner">
            <div class="action-bar-left">
              <div class="action-bar-attempts" id="action-attempts-box" title="${attemptsLeft} attempts remaining">
                <span class="action-bar-label mono">ATTEMPTS</span>
                <div class="action-pips" id="action-attempts-pips">
                  ${Array.from({ length: CONFIG.MAX_ATTEMPTS }, (_, i) => `
                    <span class="action-pip ${i < attemptsLeft ? 'pip-remaining' : 'pip-spent'}">${i < attemptsLeft ? PUZZLE_ART.pipFilled : PUZZLE_ART.pipHollow}</span>
                  `).join('')}
                </div>
              </div>
              
              <div class="action-bar-hints" id="action-hints-box">
                <button 
                  type="button" 
                  class="btn btn-secondary btn-sm keycap action-hint-btn" 
                  id="btn-use-hint"
                  ${state.hintsRemaining <= 0 || block.hintUsed || block.status === 'SOLVED' || block.status === 'FAILED' ? 'disabled aria-disabled="true"' : ''}
                >
                  <span class="btn-hint-icon">${ICONS.hint}</span>
                  <span>${block.hintUsed ? 'Hint Used' : 'Hint'}</span>
                  <span class="hint-mini-pips" id="action-hint-pips">
                    ${Array.from({ length: 3 }, (_, i) => `
                      <span class="hint-mini-pip ${i < state.hintsRemaining ? 'pip-active' : 'pip-used'}">${i < state.hintsRemaining ? PUZZLE_ART.pipFilled : PUZZLE_ART.pipHollow}</span>
                    `).join('')}
                  </span>
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

        <!-- DEV-ONLY: DEV MODE TOOLS -->
        ${CONFIG.DEV_MODE ? `
          <div class="dev-toolbar dev-only" role="region" aria-label="Development Testing Tools">
            <div class="dev-label">DEV_MODE Testing Tools:</div>
            <div class="dev-buttons">
              <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-dev-solve">Mark Solved (dev)</button>
              <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-dev-fail">Mark Failed (dev)</button>
              <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-dev-skip">Skip timer to 10s</button>
            </div>
          </div>
        ` : ''}
      </section>
    `;

    // Helper: Update status banner, action bar notice, and unlocked clue view
    const renderStatusAndClue = () => {
      const currentBlock = GameState.state?.blocks[puzzleId] || block;
      const statusBanner = container.querySelector('#puzzle-status-banner');
      const clueContainer = container.querySelector('#puzzle-clue-container');
      const attemptsPipsEl = container.querySelector('#action-attempts-pips');
      const actionNotice = container.querySelector('#action-bar-notice-text');
      const checkBtnMain = container.querySelector('#btn-check-main');
      const hintBtn = container.querySelector('#btn-use-hint');

      const remAttempts = Math.max(0, CONFIG.MAX_ATTEMPTS - (currentBlock.attemptsUsed || 0));
      if (attemptsPipsEl) {
        attemptsPipsEl.innerHTML = Array.from({ length: CONFIG.MAX_ATTEMPTS }, (_, i) => `
          <span class="action-pip ${i < remAttempts ? 'pip-remaining' : 'pip-spent'}">${i < remAttempts ? PUZZLE_ART.pipFilled : PUZZLE_ART.pipHollow}</span>
        `).join('');
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
                <strong>Puzzle Solved:</strong> Correct answer confirmed. Technical clue unlocked below.
              </div>
            </div>
          `;
        }
      } else if (currentBlock.status === 'FAILED') {
        if (checkBtnMain) checkBtnMain.disabled = true;
        if (hintBtn) hintBtn.disabled = true;
        if (actionNotice) {
          actionNotice.textContent = 'LOCKED (Maximum attempts exceeded or time expired)';
          actionNotice.className = 'action-bar-notice notice-danger mono';
        }
        if (statusBanner) {
          statusBanner.innerHTML = `
            <div class="alert alert-danger" role="alert">
              <span class="alert-icon">${ICONS.cross}</span>
              <div class="alert-content">
                <strong>Puzzle Failed:</strong> Maximum attempts exceeded or time expired. This tile is permanently locked.
              </div>
            </div>
          `;
        }
      } else {
        if (statusBanner) statusBanner.innerHTML = '';
      }

      // Clue Box with slide-in animation
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
            clueInnerHtml = `
              <div class="clue-card clue-image keycap" aria-labelledby="clue-heading">
                <div class="clue-header">
                  <span class="clue-tag mono">VECTOR ASSET CLUE UNLOCKED</span>
                  <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
                  <p class="clue-caption">${clue.caption}</p>
                </div>
                <div class="clue-body">
                  <div class="svg-preview-box">
                    ${clue.svgContent}
                  </div>
                </div>
                <div class="clue-actions">
                  <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-download-svg">
                    ${ICONS.download} <span>Download SVG Asset</span>
                  </button>
                </div>
              </div>
            `;
          }

          clueContainer.innerHTML = clueInnerHtml;
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
        onSolved: () => {
          GameState.markSolved(puzzleId);
          renderStatusAndClue();
        },
        onWrongCheck: () => {
          const res = GameState.recordWrong(puzzleId);
          renderStatusAndClue();
          if (res.failed) {
            this.showNotice(`Maximum attempts reached for ${tileLabel}. The puzzle has failed.`, 'danger');
          }
        }
      };

      puzzleModule.mount(interactiveContainer, puzzleConfig.data, ctx);
      this.activePuzzleModule = puzzleModule;
      this.activePuzzleId = puzzleId;
    }

    // Event Listeners
    const backBtn = container.querySelector('#btn-back-grid');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
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

    const hintBtn = container.querySelector('#btn-use-hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        Modal.showHintConfirmation(state.hintsRemaining, () => {
          GameState.useHint(puzzleId);
          const hintDisplay = container.querySelector('#puzzle-hint-display');
          if (hintDisplay && puzzleConfig.hint) {
            hintDisplay.innerHTML = `
              <div class="revealed-hint-box keycap" role="region" aria-label="Revealed Hint">
                <span class="hint-icon">${ICONS.hint}</span>
                <div class="hint-content">
                  <strong class="mono">PUZZLE HINT:</strong>
                  <p class="hint-text">${puzzleConfig.hint}</p>
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
          const hintSpan = hintBtn.querySelector('span:nth-child(2)');
          if (hintSpan) hintSpan.textContent = 'Hint Used';
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

    // DEV-ONLY: Testing buttons
    if (CONFIG.DEV_MODE) {
      const devSolve = container.querySelector('#btn-dev-solve');
      const devFail = container.querySelector('#btn-dev-fail');
      const devSkip = container.querySelector('#btn-dev-skip');

      if (devSolve) devSolve.addEventListener('click', () => {
        GameState.markSolved(puzzleId);
        renderStatusAndClue();
      });
      if (devFail) devFail.addEventListener('click', () => {
        GameState.failPuzzle(puzzleId, 'DEV');
        renderStatusAndClue();
      });
      if (devSkip) devSkip.addEventListener('click', () => {
        GameState.devSkipTimer(puzzleId);
      });
    }

    // 1-second interval to update puzzle countdown display smoothly
    this.activePuzzleInterval = setInterval(() => {
      const remainingSec = GameState.getPuzzleRemainingSeconds(puzzleId);
      const timerEl = document.getElementById('puzzle-countdown');
      if (timerEl) {
        timerEl.textContent = this.formatTime(remainingSec);
        const badge = timerEl.closest('.puzzle-timer-badge');
        if (badge) {
          const b = GameState.state?.blocks[puzzleId];
          if (remainingSec < 120 && b && b.status === 'OPENED_IN_PROGRESS') {
            badge.classList.add('timer-low');
          } else {
            badge.classList.remove('timer-low');
          }
        }
      }

      // Handle expiration
      const b = GameState.state?.blocks[puzzleId];
      if (remainingSec <= 0 && b && b.status === 'OPENED_IN_PROGRESS') {
        GameState.failPuzzle(puzzleId, 'TIMEOUT');
        this.unmountCurrentPuzzle();
        clearInterval(this.activePuzzleInterval);
        this.activePuzzleInterval = null;
        this.showNotice(`Time expired for ${tileLabel}. The puzzle has failed.`, 'danger');
        router.navigate('/grid');
      }
    }, 1000);
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

    const summary = GameState.getSummary();
    const verificationHash = GameState.generateVerificationHash();

    // Assemble Clue Inventory
    const gridOrder = state.gridOrder || [];
    let inventoryHtml = '';

    gridOrder.forEach((itemId, idx) => {
      if (itemId === 'vault_12') return;

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
          clueBodyHtml = `<div class="vault-clue-spec-snippet"><code>${specSummary}</code></div>`;
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-sm btn-vault-copy" data-text="${encodeURIComponent((clue.specs || []).map(s => `${s.label}: ${s.value}`).join('\n'))}">
              ${ICONS.copy} <span>Copy Specs</span>
            </button>
          `;
        } else if (clue.type === 'text') {
          clueBodyHtml = `<div class="vault-clue-text-snippet">${clue.content}</div>`;
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-sm btn-vault-copy" data-text="${encodeURIComponent(clue.content)}">
              ${ICONS.copy} <span>Copy Text</span>
            </button>
          `;
        } else if (clue.type === 'image') {
          clueBodyHtml = `<div class="vault-clue-image-snippet">${clue.svgContent}</div>`;
          actionBtnHtml = `
            <button type="button" class="btn btn-secondary btn-sm btn-vault-download" data-svg="${encodeURIComponent(clue.svgContent)}" data-filename="${clue.filename}">
              ${ICONS.download} <span>Download SVG</span>
            </button>
          `;
        }

        inventoryHtml += `
          <div class="inventory-card inventory-unlocked">
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
          <div class="inventory-card inventory-locked">
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

    container.innerHTML = `
      <section class="screen-container vault-screen" aria-labelledby="vault-page-title">
        <header class="vault-header">
          <div class="brand-institution">Jain University &bull; School of Future Technology</div>
          <h1 id="vault-page-title" class="page-title">Submission Vault</h1>
          <p class="page-description">
            Your competition time has stopped. All puzzle locks are finalized. Review your unlocked clues and submit your final poster design.
          </p>
        </header>

        ${wasTimeExpired || GameState.isMasterExpired() ? `
          <div class="alert alert-danger" role="alert">
            <span class="alert-icon">${ICONS.clock}</span>
            <div class="alert-content">
              <strong>Time is up:</strong> The 2-hour contest duration has ended. The vault has locked your final score.
            </div>
          </div>
        ` : ''}

        <!-- Performance Summary Grid -->
        <div class="metrics-grid" role="region" aria-label="Contest Performance Summary">
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
            <div class="metric-value mono"><strong>${summary.timeTakenFormatted}</strong></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Team / School</div>
            <div class="metric-value text-truncate" title="${state.teamName}">${state.teamName}</div>
            <div class="metric-sub text-truncate" title="${state.schoolName}">${state.schoolName}</div>
          </div>
        </div>

        <!-- Clue Inventory -->
        <div class="vault-section">
          <div class="vault-section-header">
            <h2 class="section-title">Unlocked Poster Assets & Specifications</h2>
            <p class="section-subtitle">Incorporate unlocked copy, colors, and layout requirements into your final submission.</p>
          </div>
          <div class="inventory-grid">
            ${inventoryHtml}
          </div>
        </div>

        <!-- Verification Hash -->
        <div class="vault-section verification-section">
          <div class="vault-section-header">
            <h2 class="section-title">Submission Verification Hash</h2>
            <p class="section-subtitle">
              Copy this verification code and paste it into the submission form. It cryptographically locks your solve count, timestamps, and identity.
            </p>
          </div>

          <!--
            NOTE: This verification hash is generated client-side as a prototype placeholder.
            In production, this verification hash must be cryptographically generated and signed
            on the server (e.g. HMAC-SHA256) so it cannot be forged by client manipulation.
          -->
          <div class="hash-box-row">
            <div class="hash-display">
              <span class="hash-label">VERIFICATION HASH:</span>
              <code class="hash-code" id="verification-hash-val">${verificationHash}</code>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-hash">
              ${ICONS.copy} <span>Copy Hash</span>
            </button>
          </div>
        </div>

        <!-- Submission Call to Action -->
        <div class="vault-section submission-cta-section">
          <div class="cta-card">
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
                class="btn btn-primary btn-lg"
              >
                Submit Your Poster &rarr;
              </a>
            </div>
            <p class="cta-note">Submission form opens in a secure new tab. Ensure all required files and hashes are submitted.</p>
          </div>
        </div>
      </section>
    `;

    // Bind copy and download handlers in vault
    const copyHashBtn = container.querySelector('#btn-copy-hash');
    if (copyHashBtn) {
      copyHashBtn.addEventListener('click', () => {
        this.copyToClipboard(verificationHash, copyHashBtn);
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
          <div class="brand-institution">Jain University &bull; School of Future Technology</div>
          <h1 id="rules-page-title" class="page-title">Competition Rules & Specifications</h1>
          <p class="page-description">Future Quest 2026 Official Contest Regulations</p>
        </header>

        <div class="rules-card">
          <article class="rule-block">
            <h2 class="rule-heading">1. Eligibility & Team Composition</h2>
            <p class="rule-text">
              The competition is strictly open to students enrolled in 11th and 12th grades (or equivalent secondary school years). Teams must consist of <strong>3 to 5 members</strong> from the same educational institution. Each team participates using one shared team terminal.
            </p>
          </article>

          <article class="rule-block">
            <h2 class="rule-heading">2. Contest Master Time Limit</h2>
            <p class="rule-text">
              The competition has a strict <strong>2-hour (7,200 seconds)</strong> master countdown. The timer begins the moment your team clicks <em>Begin Round</em> and runs continuously in the background across tab reloads or network drops. When the master countdown reaches zero, the puzzle phase terminates immediately and your session is locked into the Submission Vault.
            </p>
          </article>

          <article class="rule-block">
            <h2 class="rule-heading">3. Per-Puzzle Time Limits</h2>
            <p class="rule-text">
              Each individual puzzle carries an independent countdown based on its assigned difficulty:
            </p>
            <ul class="rule-list">
              <li><strong>Easy:</strong> 10 minutes (600 seconds)</li>
              <li><strong>Medium:</strong> 15 minutes (900 seconds)</li>
              <li><strong>Hard:</strong> 20 minutes (1,200 seconds)</li>
            </ul>
            <p class="rule-text">
              A puzzle's timer begins when you first enter its screen. A puzzle's timer keeps running if the tab is closed or reloaded, and pauses only when the team clicks "Back to grid". If a puzzle timer reaches zero, the puzzle is permanently marked as <strong>FAILED</strong> and locked.
            </p>
          </article>

          <article class="rule-block">
            <h2 class="rule-heading">4. Puzzle Grid & Attempt Policy</h2>
            <p class="rule-text">
              Tiles 1 through 11 are randomized in order at contest initialization. All 11 puzzle tiles are unlocked from the start and can be attempted in any order. Each puzzle permits a maximum of <strong>3 attempts</strong>. Entering 3 incorrect answers permanently marks the puzzle as <strong>FAILED</strong>.
            </p>
          </article>

          <article class="rule-block">
            <h2 class="rule-heading">5. Hint Allocation</h2>
            <p class="rule-text">
              Each team is allocated exactly <strong>3 hints total</strong> for the entire 2-hour competition (shared across all 11 puzzles). Spending a hint permanently reveals a clue for that puzzle. Hints are non-refundable and cannot be re-assigned.
            </p>
          </article>

          <article class="rule-block">
            <h2 class="rule-heading">6. Tile 12 & The Submission Vault Warning</h2>
            <p class="rule-text">
              Tile 12 is the Submission Vault. Once you confirm entry into the Submission Vault, your master timer stops and all puzzle tiles become read-only. Unsolved puzzles remain unsolved and no further answers can be submitted. You will proceed to collect your unlocked poster assets and your cryptographic verification hash.
            </p>
          </article>

          <!-- DEV-ONLY: SCORING RULES placeholder to be finalized by committee -->
          <article class="rule-block scoring-placeholder-block dev-only">
            <h2 class="rule-heading">7. Scoring & Evaluation Rubric</h2>
            <div class="alert alert-neutral">
              <strong>[SCORING RUBRIC NOTICE]</strong> The official weighted scoring rubric (balancing puzzle solve count, completion speed, and poster technical compliance) will be published by the Jain University SFT Evaluation Committee prior to the round commencement.
            </div>
          </article>
        </div>

        <div class="rules-actions">
          ${hasSession ? `
            <a href="#/grid" class="btn btn-primary">Return to Grid</a>
          ` : `
            <a href="#/register" class="btn btn-primary">Proceed to Registration</a>
          `}
        </div>
      </section>
    `;
  }
};
