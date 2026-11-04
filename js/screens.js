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

export const Screens = {
  activePuzzleInterval: null,

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
  // 1. ENTRY SCREEN (#/home)
  // =========================================================================
  renderHome(container, router) {
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    container.innerHTML = `
      <section class="screen-container entry-screen" aria-labelledby="entry-title">
        <div class="entry-card">
          <header class="entry-header">
            <div class="brand-institution">Jain University &bull; School of Future Technology</div>
            <h1 id="entry-title" class="entry-title">Future Quest 2026</h1>
            <p class="entry-subtitle">Online Puzzle Competition for 11th & 12th Grade Teams</p>
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
                The 2-hour contest timer starts immediately when you click <strong>Start Competition</strong>. Ensure your entire team is assembled before proceeding.
              </p>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-block">Start Competition</button>
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

  // =========================================================================
  // 2. GRID SCREEN (#/grid)
  // =========================================================================
  renderGrid(container, router) {
    if (this.activePuzzleInterval) {
      clearInterval(this.activePuzzleInterval);
      this.activePuzzleInterval = null;
    }

    const state = GameState.state;
    if (!state) {
      router.navigate('/home');
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

        let innerContentHtml = '';
        let styleClass = '';

        if (index < 4) {
          // Tiles 1 to 4: Plain task tiles
          // Flat neutral tile with 1px border, labelled "Task 1", "Task 2", "Task 3", "Task 4"
          // (small label plus a larger monospace number)
          styleClass = 'tile-style-task';
          innerContentHtml = `
            <div class="tile-task-label">Task ${tileNumber}</div>
            <div class="tile-task-number mono">${formattedNum}</div>
            ${statusBadgeHtml}
          `;
        } else if (index < 8) {
          // Tiles 5 to 8: Named puzzle tiles
          // Same flat style, but each tile shows a puzzle NAME instead of "Task N",
          // with tile number small in a corner. Mock names from CONFIG.NAMED_PUZZLE_TILES.
          // Tile shows only the name and small corner number.
          styleClass = 'tile-style-named';
          const puzzleName = CONFIG.NAMED_PUZZLE_TILES[index - 4] || `Puzzle ${tileNumber}`;
          innerContentHtml = `
            <div class="tile-corner-num mono">${formattedNum}</div>
            <div class="tile-named-title">${puzzleName}</div>
            ${statusBadgeHtml}
          `;
        } else {
          // Tiles 9 to 11: Purple gradient tiles
          // Diagonal gradient: lavender top-left to deep violet to dark purple bottom-right.
          // Show only tile number, in white monospace, bottom-left. No glow, no shadow blur.
          styleClass = 'tile-style-gradient';
          innerContentHtml = `
            <div class="tile-gradient-number mono">${formattedNum}</div>
            ${statusBadgeHtml}
          `;
        }

        tilesHtml += `
          <button 
            type="button" 
            class="tile-card tile-puzzle ${styleClass} ${statusClass} ${!isClickable ? 'tile-disabled' : ''}" 
            data-puzzle-id="${itemId}"
            data-tile-index="${index}"
            data-tile-num="${tileNumber}"
            ${!isClickable ? 'disabled aria-disabled="true"' : ''}
            aria-label="Tile ${tileNumber}, Status: ${status}"
          >
            ${innerContentHtml}
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

    const renderContent = () => {
      const remainingSec = GameState.getPuzzleRemainingSeconds(puzzleId);

      // Check for puzzle timer expiration
      if (remainingSec <= 0 && block.status === 'OPENED_IN_PROGRESS') {
        GameState.failPuzzle(puzzleId, 'TIMEOUT');
        clearInterval(this.activePuzzleInterval);
        this.activePuzzleInterval = null;
        this.showNotice(`Time expired for ${tileLabel}. The puzzle has failed.`, 'danger');
        router.navigate('/grid');
        return;
      }

      const isSolved = block.status === 'SOLVED';
      const isFailed = block.status === 'FAILED';
      const isLocked = isSolved || isFailed;
      const attemptsLeft = Math.max(0, CONFIG.MAX_ATTEMPTS - (block.attemptsUsed || 0));

      // Build clue preview if solved
      let clueHtml = '';
      if (isSolved && block.unlockedClue) {
        const clue = block.unlockedClue;
        if (clue.type === 'spec') {
          const specRows = (clue.specs || []).map(s => `
            <tr>
              <th scope="row" class="spec-label">${s.label}</th>
              <td class="spec-value"><code>${s.value}</code></td>
            </tr>
          `).join('');

          clueHtml = `
            <div class="clue-card clue-spec" aria-labelledby="clue-heading">
              <div class="clue-header">
                <span class="clue-tag">SPECIFICATION CLUE UNLOCKED</span>
                <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
              </div>
              <div class="clue-body">
                <table class="spec-table">
                  <tbody>${specRows}</tbody>
                </table>
              </div>
              <div class="clue-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-specs">
                  ${ICONS.copy} <span>Copy Specifications</span>
                </button>
              </div>
            </div>
          `;
        } else if (clue.type === 'text') {
          clueHtml = `
            <div class="clue-card clue-text" aria-labelledby="clue-heading">
              <div class="clue-header">
                <span class="clue-tag">TEXT CONTENT CLUE UNLOCKED</span>
                <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
              </div>
              <div class="clue-body">
                <div class="clue-copy-box">
                  <pre class="clue-pre"><code>${clue.content}</code></pre>
                </div>
              </div>
              <div class="clue-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-text">
                  ${ICONS.copy} <span>Copy Text</span>
                </button>
              </div>
            </div>
          `;
        } else if (clue.type === 'image') {
          clueHtml = `
            <div class="clue-card clue-image" aria-labelledby="clue-heading">
              <div class="clue-header">
                <span class="clue-tag">VECTOR ASSET CLUE UNLOCKED</span>
                <h3 id="clue-heading" class="clue-title">${clue.title}</h3>
                <p class="clue-caption">${clue.caption}</p>
              </div>
              <div class="clue-body">
                <div class="svg-preview-box">
                  ${clue.svgContent}
                </div>
              </div>
              <div class="clue-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-download-svg">
                  ${ICONS.download} <span>Download SVG Asset</span>
                </button>
              </div>
            </div>
          `;
        }
      }

      container.innerHTML = `
        <section class="screen-container puzzle-screen" aria-labelledby="puzzle-title">
          <!-- Puzzle Navigation Bar -->
          <div class="puzzle-nav-row">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-back-grid">
              ${ICONS.arrowLeft} <span>Back to Grid</span>
            </button>
            <div class="puzzle-timer-badge ${remainingSec < 120 && !isLocked ? 'timer-low' : ''}">
              <span class="timer-icon">${ICONS.clock}</span>
              <span class="timer-label">Puzzle Timer:</span>
              <span class="timer-value" id="puzzle-countdown">${this.formatTime(remainingSec)}</span>
            </div>
          </div>

          <!-- Puzzle Header -->
          <div class="puzzle-header-card">
            <div class="puzzle-meta-row">
              <div class="puzzle-number-badge">TILE ${tileNumber}</div>
              <div class="difficulty-badge difficulty-${difficulty}">
                ${difficulty.toUpperCase()} (${Math.floor(CONFIG.DIFFICULTY_TIME[difficulty] / 60)} MIN)
              </div>
              <div class="category-badge">${puzzleConfig.category}</div>
            </div>
            <h1 id="puzzle-title" class="puzzle-title">${tileLabel}</h1>
          </div>

          <!-- Status Banners -->
          ${isSolved ? `
            <div class="alert alert-success" role="status">
              <span class="alert-icon">${ICONS.check}</span>
              <div class="alert-content">
                <strong>Puzzle Solved:</strong> Correct answer confirmed. Technical clue unlocked below.
              </div>
            </div>
          ` : ''}

          ${isFailed ? `
            <div class="alert alert-danger" role="alert">
              <span class="alert-icon">${ICONS.cross}</span>
              <div class="alert-content">
                <strong>Puzzle Failed:</strong> Maximum attempts exceeded or time expired. This tile is permanently locked.
              </div>
            </div>
          ` : ''}

          <!-- Puzzle Body -->
          <div class="puzzle-body-card">
            <!-- What to do block -->
            <div class="puzzle-what-to-do-block">
              <h2 class="section-title">What to do</h2>
              <p class="what-to-do-text">${puzzleConfig.whatToDo || 'Analyze the technical requirements and solve the challenge below.'}</p>
            </div>

            <!-- Problem Statement (Question) -->
            <div class="puzzle-question">
              <h2 class="section-title">Problem Statement</h2>
              <p class="question-text">${puzzleConfig.prompt}</p>
            </div>

            <!-- Hint Section -->
            <div class="puzzle-hint-section">
              ${block.hintUsed ? `
                <div class="revealed-hint-box" role="region" aria-label="Revealed Hint">
                  <div class="hint-title-row">
                    <span class="hint-icon">${ICONS.hint}</span>
                    <strong>Puzzle Hint:</strong>
                  </div>
                  <p class="hint-text">${puzzleConfig.hint}</p>
                </div>
              ` : `
                <div class="hint-action-row">
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm" 
                    id="btn-use-hint"
                    ${state.hintsRemaining <= 0 || isLocked ? 'disabled aria-disabled="true"' : ''}
                  >
                    ${ICONS.hint} <span>Use Hint (${state.hintsRemaining} left)</span>
                  </button>
                  <span class="hint-note">Using a hint permanently consumes 1 of your team's 3 total hints.</span>
                </div>
              `}
            </div>

            <!-- Answer Submission Section (Active only when in-progress) -->
            ${!isLocked ? `
              <div class="puzzle-submit-section">
                <form id="puzzle-answer-form" class="answer-form">
                  <div id="answer-feedback" class="feedback-banner" style="display: none;" role="status"></div>
                  
                  <div class="form-row">
                    <div class="input-col">
                      <label for="puzzle-answer-input" class="form-label">Your Solution</label>
                      <input 
                        type="text" 
                        id="puzzle-answer-input" 
                        class="form-input" 
                        placeholder="Enter your answer..." 
                        autocomplete="off" 
                        spellcheck="false"
                        required 
                      />
                    </div>
                    <div class="btn-col">
                      <button type="submit" class="btn btn-primary" id="btn-submit-answer">Submit Answer</button>
                    </div>
                  </div>

                  <div class="attempts-indicator">
                    Attempts remaining: <strong>${attemptsLeft} of ${CONFIG.MAX_ATTEMPTS}</strong>
                  </div>
                </form>
              </div>
            ` : ''}

            <!-- Unlocked Clue Area -->
            ${clueHtml}
          </div>

          <!-- DEV MODE TOOLS -->
          ${CONFIG.DEV_MODE ? `
            <div class="dev-toolbar" role="region" aria-label="Development Testing Tools">
              <div class="dev-label">DEV_MODE Testing Tools:</div>
              <div class="dev-buttons">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-dev-solve">Mark Solved (dev)</button>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-dev-fail">Mark Failed (dev)</button>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-dev-skip">Skip timer to 10s</button>
              </div>
            </div>
          ` : ''}
        </section>
      `;

      // Event Listeners
      const backBtn = container.querySelector('#btn-back-grid');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          GameState.leavePuzzle(puzzleId);
          router.navigate('/grid');
        });
      }

      const hintBtn = container.querySelector('#btn-use-hint');
      if (hintBtn) {
        hintBtn.addEventListener('click', () => {
          Modal.showHintConfirmation(state.hintsRemaining, () => {
            GameState.useHint(puzzleId);
            renderContent();
          });
        });
      }

      const answerForm = container.querySelector('#puzzle-answer-form');
      if (answerForm) {
        answerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = container.querySelector('#puzzle-answer-input');
          const feedback = container.querySelector('#answer-feedback');
          const rawAnswer = input.value;

          const result = GameState.submitAnswer(puzzleId, rawAnswer);

          if (result.correct) {
            renderContent();
          } else if (result.failed) {
            renderContent();
          } else {
            feedback.style.display = 'block';
            feedback.className = 'feedback-banner feedback-warning';
            feedback.textContent = `Incorrect. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} left.`;
            input.value = '';
            input.focus();
            const attemptsEl = container.querySelector('.attempts-indicator strong');
            if (attemptsEl) attemptsEl.textContent = `${result.attemptsLeft} of ${CONFIG.MAX_ATTEMPTS}`;
          }
        });
      }

      // Clue copy and download buttons
      const copySpecsBtn = container.querySelector('#btn-copy-specs');
      if (copySpecsBtn && block.unlockedClue) {
        copySpecsBtn.addEventListener('click', () => {
          const specText = (block.unlockedClue.specs || []).map(s => `${s.label}: ${s.value}`).join('\n');
          this.copyToClipboard(specText, copySpecsBtn);
        });
      }

      const copyTextBtn = container.querySelector('#btn-copy-text');
      if (copyTextBtn && block.unlockedClue) {
        copyTextBtn.addEventListener('click', () => {
          this.copyToClipboard(block.unlockedClue.content || '', copyTextBtn);
        });
      }

      const downloadSvgBtn = container.querySelector('#btn-download-svg');
      if (downloadSvgBtn && block.unlockedClue) {
        downloadSvgBtn.addEventListener('click', () => {
          this.downloadSvg(block.unlockedClue.svgContent, block.unlockedClue.filename);
        });
      }

      // Dev mode buttons
      if (CONFIG.DEV_MODE) {
        const devSolve = container.querySelector('#btn-dev-solve');
        const devFail = container.querySelector('#btn-dev-fail');
        const devSkip = container.querySelector('#btn-dev-skip');

        if (devSolve) devSolve.addEventListener('click', () => { GameState.devSolve(puzzleId); renderContent(); });
        if (devFail) devFail.addEventListener('click', () => { GameState.devFail(puzzleId); renderContent(); });
        if (devSkip) devSkip.addEventListener('click', () => { GameState.devSkipTimer(puzzleId); renderContent(); });
      }
    };

    renderContent();

    // Setup 1-second interval to update puzzle timer display smoothly
    this.activePuzzleInterval = setInterval(() => {
      const remainingSec = GameState.getPuzzleRemainingSeconds(puzzleId);
      const timerEl = document.getElementById('puzzle-countdown');
      if (timerEl) {
        timerEl.textContent = this.formatTime(remainingSec);
        const badge = timerEl.closest('.puzzle-timer-badge');
        if (badge) {
          if (remainingSec < 120 && block.status === 'OPENED_IN_PROGRESS') {
            badge.classList.add('timer-low');
          } else {
            badge.classList.remove('timer-low');
          }
        }
      }

      // Handle expiration
      if (remainingSec <= 0 && block.status === 'OPENED_IN_PROGRESS') {
        GameState.failPuzzle(puzzleId, 'TIMEOUT');
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
            <h4 class="inventory-title">Locked Content Slot</h4>
            <div class="inventory-content">
              <p class="inventory-locked-msg">This puzzle was not completed. Associated poster specifications remain locked.</p>
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
              The competition has a strict <strong>2-hour (7,200 seconds)</strong> master countdown. The timer begins the moment your team clicks <em>Start Competition</em> and runs continuously in the background across tab reloads or network drops. When the master countdown reaches zero, the puzzle phase terminates immediately and your session is locked into the Submission Vault.
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

          <!-- SCORING RULES: To be defined by competition committee -->
          <article class="rule-block scoring-placeholder-block">
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
            <a href="#/home" class="btn btn-primary">Proceed to Registration</a>
          `}
        </div>
      </section>
    `;
  }
};
