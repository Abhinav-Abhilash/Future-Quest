/**
 * Future Quest 2026 - Apple Eats Snake (Pure Bonus Mini-Game)
 * 
 * Pure bonus arcade challenge:
 * - The player controls the APPLE.
 * - A SNAKE wanders the board and avoids walls.
 * - The apple EATS the snake segment by segment in order to spell "CHOMP".
 * - Pure bonus: no clue, no timer, no attempts, no hints, no lives, no penalties.
 * - Wrong-order bites simply bounce back safely.
 * - Sized to fit 360px wide with no horizontal scroll.
 * - Fixed-step game loop (~6 moves/sec) via requestAnimationFrame.
 * - Turn-based mode for prefers-reduced-motion or body.lite-mode.
 * - Accessible with keyboard, swipe, touch D-pad, and polite aria-live announcements.
 */

import { PUZZLE_ART } from './art.js';
import { isReducedMotion } from './popup.js';

let activeCleanup = null;
let activeModuleInstance = null;

export function unmount() {
  if (activeCleanup) {
    try {
      activeCleanup();
    } catch (e) {
      console.warn('Error during snake unmount:', e);
    }
    activeCleanup = null;
  }
  activeModuleInstance = null;
}

export function checkAnswer() {
  if (activeModuleInstance && typeof activeModuleInstance.checkStatus === 'function') {
    activeModuleInstance.checkStatus();
  }
}

export function mount(root, data, ctx) {
  unmount();

  const targetWord = (data && data.targetWord ? data.targetWord : 'CHOMP').toUpperCase();
  const wordLength = targetWord.length;
  const GRID_SIZE = 15;
  const CANVAS_SIZE = 450;
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 30px per cell

  let collected = [];

  // Root layout HTML
  root.innerHTML = `
    <div class="snake-game-wrapper" role="region" aria-label="Apple Eats Snake Bonus Arcade Game">
      <!-- HUD Top Bar -->
      <div class="snake-hud-bar">
        <div class="snake-target-info">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span class="snake-hud-tag mono">TARGET WORD: ${targetWord}</span>
            <span class="snake-hud-tag mono" id="snake-progress-count">COLLECTED: 0 / ${wordLength}</span>
          </div>
          <div class="snake-word-strip" id="snake-word-strip" aria-label="Collected letters progress">
            <!-- Dynamic letter chips rendered below -->
          </div>
        </div>

        <div class="snake-hud-status-group" style="justify-content: flex-end;">
          <div class="snake-controls-group">
            <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-snake-pause" aria-label="Pause or resume game">
              <span id="snake-pause-text">Pause</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm keycap" id="btn-snake-reset-board" aria-label="Spawn a new snake">
              New Snake
            </button>
          </div>
        </div>
      </div>

      <!-- Canvas Stage & Overlays -->
      <div class="snake-canvas-container" id="snake-canvas-box">
        <!-- Start banner: disappears on first move -->
        <div class="snake-start-banner" id="snake-start-banner">
          Press any arrow key or tap to start
        </div>

        <canvas 
          id="snake-canvas" 
          width="${CANVAS_SIZE}" 
          height="${CANVAS_SIZE}" 
          tabindex="0" 
          role="application"
          aria-label="Apple Eats Snake grid. 15 by 15. Use Arrow keys or WASD to guide the apple. Eat snake segments in order."
        ></canvas>

        <!-- Pause Overlay -->
        <div class="snake-pause-overlay hidden" id="snake-pause-overlay" aria-hidden="true">
          <div class="snake-pause-modal keycap">
            <h3 class="mono">GAME PAUSED</h3>
            <p>Press <kbd>Space</kbd> or click Resume to continue.</p>
            <button type="button" class="btn btn-primary keycap" id="btn-snake-resume">Resume</button>
          </div>
        </div>

        <!-- Celebration Overlay (Bonus Win) -->
        <div class="snake-victory-overlay hidden" id="snake-victory-overlay" aria-hidden="true">
          <div class="snake-victory-modal keycap">
            <div class="snake-victory-icon">${PUZZLE_ART.apple}</div>
            <h3 class="mono">WORD ASSEMBLED!</h3>
            <p class="mono text-success" style="font-size: 1.4rem; letter-spacing: 0.15em;"><strong>${targetWord}</strong></p>
            <span class="snake-victory-sub">Bonus mini-game complete! Great reflexes.</span>
            <div style="margin-top: 12px;">
              <button type="button" class="btn btn-primary keycap" id="btn-snake-play-again">Play Again</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls Guidance & Touch D-Pad -->
      <div class="snake-bottom-panel">
        <div class="snake-keyboard-guide">
          <span class="guide-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> to steer</span>
          <span class="guide-item"><kbd>Space</kbd> to Pause</span>
        </div>

        <!-- On-Screen D-Pad (Shown on touch devices) -->
        <div class="snake-dpad" role="group" aria-label="On-screen directional controls">
          <button type="button" class="dpad-btn dpad-up" data-dir="up" aria-label="Move Up">▲</button>
          <div class="dpad-row">
            <button type="button" class="dpad-btn dpad-left" data-dir="left" aria-label="Move Left">◀</button>
            <button type="button" class="dpad-btn dpad-center" aria-hidden="true">●</button>
            <button type="button" class="dpad-btn dpad-right" data-dir="right" aria-label="Move Right">▶</button>
          </div>
          <button type="button" class="dpad-btn dpad-down" data-dir="down" aria-label="Move Down">▼</button>
        </div>
      </div>

      <!-- Screen Reader Live Region -->
      <div class="sr-only" id="snake-live-announcer" aria-live="polite" aria-atomic="true"></div>
    </div>
  `;

  const canvas = root.querySelector('#snake-canvas');
  const ctx2d = canvas.getContext('2d');
  const wordStripEl = root.querySelector('#snake-word-strip');
  const progressCountEl = root.querySelector('#snake-progress-count');
  const startBannerEl = root.querySelector('#snake-start-banner');
  const pauseOverlay = root.querySelector('#snake-pause-overlay');
  const victoryOverlay = root.querySelector('#snake-victory-overlay');
  const pauseBtn = root.querySelector('#btn-snake-pause');
  const pauseText = root.querySelector('#snake-pause-text');
  const resumeBtn = root.querySelector('#btn-snake-resume');
  const playAgainBtn = root.querySelector('#btn-snake-play-again');
  const resetBoardBtn = root.querySelector('#btn-snake-reset-board');
  const announcer = root.querySelector('#snake-live-announcer');

  const announce = (msg) => {
    if (announcer) {
      announcer.textContent = msg;
    }
  };

  // -------------------------------------------------------------
  // GAME STATE
  // -------------------------------------------------------------
  let isPaused = false;
  let isWon = false;
  let rafId = null;
  let lastTickTime = 0;
  const TICK_INTERVAL_MS = 166; // ~6 moves per second
  let mouthAnimPhase = 0; // 0..1 oscillating
  let popAnimTicks = 0;

  // Directions
  const DIRS = {
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 },
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 }
  };

  // Apple state
  let apple = {
    x: 2,
    y: 7,
    dir: DIRS.right,
    nextDir: DIRS.right,
    isMoving: false
  };

  // Snake state: head + segments with target letter sequence
  let snake = {
    head: { x: 10, y: 7, dir: DIRS.left },
    segments: []
  };

  // Helper: init or reset board
  const setupSnakeAndApple = () => {
    apple.x = 2;
    apple.y = 7;
    apple.dir = DIRS.right;
    apple.nextDir = DIRS.right;
    apple.isMoving = false;
    popAnimTicks = 0;
    collected = [];
    isWon = false;

    if (victoryOverlay) victoryOverlay.classList.add('hidden');
    if (startBannerEl) startBannerEl.classList.remove('hidden');

    // Build snake with all segments of target word
    const letters = targetWord.split('');
    snake.head = { x: 10, y: 7, dir: DIRS.left };
    snake.segments = [];

    // Snake body trails to the right of head initially
    for (let i = 0; i < letters.length; i++) {
      const segX = Math.min(GRID_SIZE - 1, 11 + i);
      const segY = 7;
      snake.segments.push({
        x: segX,
        y: segY,
        letter: letters[i],
        targetOrderIndex: i
      });
    }

    updateHUD();
  };

  // Helper: update Word Strip and Progress count in DOM
  const updateHUD = () => {
    if (!wordStripEl) return;

    if (progressCountEl) {
      progressCountEl.textContent = `COLLECTED: ${collected.length} / ${wordLength}`;
    }

    const nextTargetIndex = collected.length;
    let chipsHtml = '';
    for (let i = 0; i < wordLength; i++) {
      const char = targetWord[i];
      if (i < collected.length) {
        chipsHtml += `
          <div class="snake-letter-chip chip-collected" title="Letter ${char} collected">
            <span class="chip-char mono">${char}</span>
            <span class="chip-status-icon">✓</span>
          </div>
        `;
      } else if (i === nextTargetIndex) {
        chipsHtml += `
          <div class="snake-letter-chip chip-next" title="Next letter to eat: ${char}">
            <span class="chip-tag mono">NEXT</span>
            <span class="chip-char mono">${char}</span>
          </div>
        `;
      } else {
        chipsHtml += `
          <div class="snake-letter-chip chip-pending" title="Future letter: ${char}">
            <span class="chip-char mono">${char}</span>
          </div>
        `;
      }
    }
    wordStripEl.innerHTML = chipsHtml;
  };

  // Helper: check if a cell is inside board bounds
  const inBounds = (x, y) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

  // Helper: Snake wall-avoiding wander algorithm
  const updateSnakePosition = () => {
    const head = snake.head;
    const currentDir = head.dir;

    const candidateDirs = [
      currentDir,
      { x: -currentDir.y, y: currentDir.x },  // turn left
      { x: currentDir.y, y: -currentDir.x }   // turn right
    ];

    const validDirs = candidateDirs.filter(d => {
      const nx = head.x + d.x;
      const ny = head.y + d.y;
      if (!inBounds(nx, ny)) return false;
      if (snake.segments.length > 0 && snake.segments[0].x === nx && snake.segments[0].y === ny) {
        return false;
      }
      return true;
    });

    let chosenDir = currentDir;
    if (validDirs.length > 0) {
      if (validDirs.includes(currentDir) && Math.random() < 0.70) {
        chosenDir = currentDir;
      } else {
        chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
      }
    } else {
      const reverseDir = { x: -currentDir.x, y: -currentDir.y };
      chosenDir = inBounds(head.x + reverseDir.x, head.y + reverseDir.y) ? reverseDir : currentDir;
    }

    head.dir = chosenDir;

    let prevX = head.x;
    let prevY = head.y;
    head.x += chosenDir.x;
    head.y += chosenDir.y;

    for (let i = 0; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      const curX = seg.x;
      const curY = seg.y;
      seg.x = prevX;
      seg.y = prevY;
      prevX = curX;
      prevY = curY;
    }
  };

  // Helper: handle collisions between apple and snake
  const checkCollisions = () => {
    if (isWon) return;

    const nextRequiredIndex = collected.length;

    // 1. Check if apple collided with snake head
    if (apple.x === snake.head.x && apple.y === snake.head.y) {
      handleWrongEat();
      return;
    }

    // 2. Check if apple collided with any body segment
    for (let i = 0; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      if (apple.x === seg.x && apple.y === seg.y) {
        if (seg.targetOrderIndex === nextRequiredIndex) {
          handleCorrectEat(i, seg);
        } else {
          handleWrongEat();
        }
        return;
      }
    }
  };

  // Eaten in correct sequence
  const handleCorrectEat = (segIndex, seg) => {
    const eatenLetter = seg.letter;
    snake.segments.splice(segIndex, 1);
    collected.push(eatenLetter);
    updateHUD();

    mouthAnimPhase = 1;
    popAnimTicks = 6;
    announce(`Chomped letter ${eatenLetter}! (${collected.length} of ${wordLength} collected)`);

    // Check if full word completed
    if (collected.length === wordLength) {
      isWon = true;
      if (victoryOverlay) victoryOverlay.classList.remove('hidden');
      announce(`All done! Target word ${targetWord} fully assembled.`);
      stopLoop();
    }
  };

  // Wrong segment hit or head collision (forgiving pop-back, no penalty)
  const handleWrongEat = () => {
    // Pop apple back 1 step if possible
    const backX = apple.x - apple.dir.x;
    const backY = apple.y - apple.dir.y;
    if (inBounds(backX, backY)) {
      apple.x = backX;
      apple.y = backY;
    }
    const nextChar = targetWord[collected.length];
    announce(`Oops! Eat the segments in order. Next letter is ${nextChar}.`);
  };

  // Turn-based or continuous step execution
  const executeStep = () => {
    if (isPaused || isWon) return;

    if (popAnimTicks > 0) {
      popAnimTicks--;
    }

    // Update apple position
    apple.dir = apple.nextDir;
    if (apple.isMoving) {
      const nx = apple.x + apple.dir.x;
      const ny = apple.y + apple.dir.y;
      if (inBounds(nx, ny)) {
        apple.x = nx;
        apple.y = ny;
      }
    }

    // Update snake
    updateSnakePosition();

    // Check interactions
    checkCollisions();
  };

  // -------------------------------------------------------------
  // CANVAS DRAWING PRIMITIVES
  // -------------------------------------------------------------
  const render = () => {
    ctx2d.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Dark graphite high-tech background
    ctx2d.fillStyle = '#0F0C1B';
    ctx2d.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Subtle 15x15 grid lines
    ctx2d.strokeStyle = 'rgba(74, 58, 110, 0.22)';
    ctx2d.lineWidth = 1;
    for (let c = 0; c <= GRID_SIZE; c++) {
      ctx2d.beginPath();
      ctx2d.moveTo(c * CELL_SIZE, 0);
      ctx2d.lineTo(c * CELL_SIZE, CANVAS_SIZE);
      ctx2d.stroke();

      ctx2d.beginPath();
      ctx2d.moveTo(0, c * CELL_SIZE);
      ctx2d.lineTo(CANVAS_SIZE, c * CELL_SIZE);
      ctx2d.stroke();
    }

    // 2. Render Snake Body Segments
    const nextTargetOrderIndex = collected.length;
    for (let i = 0; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      const sx = seg.x * CELL_SIZE;
      const sy = seg.y * CELL_SIZE;
      const isNextTarget = seg.targetOrderIndex === nextTargetOrderIndex;

      // Outer glowing ring for the NEXT target segment
      if (isNextTarget) {
        ctx2d.save();
        ctx2d.strokeStyle = '#FBBF24';
        ctx2d.lineWidth = 3;
        ctx2d.shadowColor = '#F59E0B';
        ctx2d.shadowBlur = 10;
        ctx2d.strokeRoundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 8);
        ctx2d.restore();
      }

      // Base segment tile
      ctx2d.fillStyle = '#16A34A';
      ctx2d.beginPath();
      ctx2d.roundRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6, 6);
      ctx2d.fill();
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = isNextTarget ? '#FBBF24' : '#15803D';
      ctx2d.stroke();

      // Inner diamond scale pattern
      const cx = sx + CELL_SIZE / 2;
      const cy = sy + CELL_SIZE / 2;
      ctx2d.fillStyle = isNextTarget ? '#FEF08A' : '#4ADE80';
      ctx2d.beginPath();
      ctx2d.moveTo(cx, cy - 7);
      ctx2d.lineTo(cx + 7, cy);
      ctx2d.lineTo(cx, cy + 7);
      ctx2d.lineTo(cx - 7, cy);
      ctx2d.closePath();
      ctx2d.fill();

      // Segment letter on top
      ctx2d.font = 'bold 13px "Courier New", monospace';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillStyle = '#0F172A';
      ctx2d.fillText(seg.letter, cx, cy + 0.5);
    }

    // 3. Render Snake Head
    {
      const hx = snake.head.x * CELL_SIZE;
      const hy = snake.head.y * CELL_SIZE;
      const hcx = hx + CELL_SIZE / 2;
      const hcy = hy + CELL_SIZE / 2;
      const hDir = snake.head.dir;

      // Tongue extending in head's facing direction
      ctx2d.save();
      ctx2d.strokeStyle = '#DC2626';
      ctx2d.lineWidth = 2;
      ctx2d.lineCap = 'round';
      ctx2d.beginPath();
      const txStart = hcx + hDir.x * (CELL_SIZE / 2 - 2);
      const tyStart = hcy + hDir.y * (CELL_SIZE / 2 - 2);
      const txEnd = txStart + hDir.x * 7;
      const tyEnd = tyStart + hDir.y * 7;
      ctx2d.moveTo(txStart, tyStart);
      ctx2d.lineTo(txEnd, tyEnd);
      if (hDir.x !== 0) {
        ctx2d.lineTo(txEnd + hDir.x * 3, tyEnd - 3);
        ctx2d.moveTo(txEnd, tyEnd);
        ctx2d.lineTo(txEnd + hDir.x * 3, tyEnd + 3);
      } else {
        ctx2d.lineTo(txEnd - 3, tyEnd + hDir.y * 3);
        ctx2d.moveTo(txEnd, tyEnd);
        ctx2d.lineTo(txEnd + 3, tyEnd + hDir.y * 3);
      }
      ctx2d.stroke();
      ctx2d.restore();

      // Head rounded tile
      ctx2d.fillStyle = '#16A34A';
      ctx2d.beginPath();
      ctx2d.roundRect(hx + 3, hy + 3, CELL_SIZE - 6, CELL_SIZE - 6, 8);
      ctx2d.fill();
      ctx2d.strokeStyle = '#15803D';
      ctx2d.lineWidth = 2;
      ctx2d.stroke();

      // Two eyes with pupils
      drawSnakeEyes(hcx, hcy, hDir);
    }

    // 4. Render Apple Character
    {
      const ax = apple.x * CELL_SIZE;
      const ay = apple.y * CELL_SIZE;
      const acx = ax + CELL_SIZE / 2;
      const acy = ay + CELL_SIZE / 2;

      ctx2d.save();

      // Stem at top
      ctx2d.fillStyle = '#78350F';
      ctx2d.fillRect(acx - 1.5, ay + 2, 3, 5);

      // Green Leaf on top
      ctx2d.fillStyle = '#16A34A';
      ctx2d.beginPath();
      ctx2d.ellipse(acx + 4, ay + 3, 4, 2, Math.PI / 6, 0, Math.PI * 2);
      ctx2d.fill();

      // Apple Body with animated mouth wedge facing direction
      const baseRadius = (CELL_SIZE - 8) / 2;
      const facingAngle = apple.dir ? apple.dir.angle : 0;
      const mouthSpread = isWon ? 0.05 : 0.05 + 0.30 * (0.5 + 0.5 * Math.sin(mouthAnimPhase * Math.PI));

      ctx2d.fillStyle = '#DC2626';
      ctx2d.beginPath();
      ctx2d.moveTo(acx, acy);
      ctx2d.arc(
        acx, 
        acy, 
        baseRadius, 
        facingAngle + mouthSpread, 
        facingAngle + (Math.PI * 2 - mouthSpread)
      );
      ctx2d.closePath();
      ctx2d.fill();

      // Darker shading contour on one side
      ctx2d.fillStyle = '#B91C1C';
      ctx2d.beginPath();
      ctx2d.arc(acx - 2, acy + 1, baseRadius * 0.75, Math.PI * 0.6, Math.PI * 1.4);
      ctx2d.fill();

      // Eye with white specular reflection highlight
      const eyeOffsetX = Math.cos(facingAngle - Math.PI / 3) * (baseRadius * 0.55);
      const eyeOffsetY = Math.sin(facingAngle - Math.PI / 3) * (baseRadius * 0.55);
      const eyeX = acx + eyeOffsetX;
      const eyeY = acy + eyeOffsetY;

      ctx2d.fillStyle = '#0F172A';
      ctx2d.beginPath();
      ctx2d.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.fillStyle = '#FFFFFF';
      ctx2d.beginPath();
      ctx2d.arc(eyeX + 0.7, eyeY - 0.7, 1, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.restore();
    }
  };

  function drawSnakeEyes(cx, cy, dir) {
    ctx2d.fillStyle = '#FFFFFF';
    const perpX = -dir.y;
    const perpY = dir.x;
    const eyeDist = 6;

    // Left eye
    const e1x = cx + perpX * eyeDist + dir.x * 2;
    const e1y = cy + perpY * eyeDist + dir.y * 2;
    ctx2d.beginPath();
    ctx2d.arc(e1x, e1y, 3, 0, Math.PI * 2);
    ctx2d.fill();

    // Right eye
    const e2x = cx - perpX * eyeDist + dir.x * 2;
    const e2y = cy - perpY * eyeDist + dir.y * 2;
    ctx2d.beginPath();
    ctx2d.arc(e2x, e2y, 3, 0, Math.PI * 2);
    ctx2d.fill();

    // Pupils
    ctx2d.fillStyle = '#0F172A';
    ctx2d.beginPath();
    ctx2d.arc(e1x + dir.x * 1, e1y + dir.y * 1, 1.5, 0, Math.PI * 2);
    ctx2d.arc(e2x + dir.x * 1, e2y + dir.y * 1, 1.5, 0, Math.PI * 2);
    ctx2d.fill();
  }

  // -------------------------------------------------------------
  // ANIMATION LOOP & TURN-BASED DISPATCH
  // -------------------------------------------------------------
  const isTurnBased = () => isReducedMotion();

  const gameLoop = (timestamp) => {
    if (isWon) {
      render();
      return;
    }

    if (!isPaused && !isTurnBased()) {
      if (!lastTickTime) lastTickTime = timestamp;
      const elapsed = timestamp - lastTickTime;

      // Animate mouth smoothly
      mouthAnimPhase += 0.08;

      if (elapsed >= TICK_INTERVAL_MS) {
        lastTickTime = timestamp - (elapsed % TICK_INTERVAL_MS);
        executeStep();
      }
    }

    render();
    rafId = requestAnimationFrame(gameLoop);
  };

  const startLoop = () => {
    if (!rafId) {
      lastTickTime = performance.now();
      rafId = requestAnimationFrame(gameLoop);
    }
  };

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // -------------------------------------------------------------
  // INPUT CONTROLS
  // -------------------------------------------------------------
  const triggerDirection = (dirKey) => {
    if (isWon) return;

    const newDir = DIRS[dirKey];
    if (!newDir) return;

    apple.nextDir = newDir;
    apple.isMoving = true;

    if (startBannerEl) {
      startBannerEl.classList.add('hidden');
    }

    // In turn-based mode (reduced motion / lite mode), move 1 step per command
    if (isTurnBased()) {
      executeStep();
      render();
    }
  };

  const togglePause = () => {
    if (isWon) return;
    isPaused = !isPaused;
    if (pauseOverlay) {
      pauseOverlay.classList.toggle('hidden', !isPaused);
      pauseOverlay.setAttribute('aria-hidden', isPaused ? 'false' : 'true');
    }
    if (pauseText) {
      pauseText.textContent = isPaused ? 'Resume' : 'Pause';
    }
    announce(isPaused ? 'Game paused' : 'Game resumed');
    if (!isPaused) {
      lastTickTime = performance.now();
    }
  };

  const handleKeyDown = (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    const key = e.key;
    if (['ArrowUp', 'KeyW', 'w', 'W'].includes(key)) {
      e.preventDefault();
      triggerDirection('up');
    } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(key)) {
      e.preventDefault();
      triggerDirection('down');
    } else if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(key)) {
      e.preventDefault();
      triggerDirection('left');
    } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(key)) {
      e.preventDefault();
      triggerDirection('right');
    } else if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      togglePause();
    }
  };

  // Touch Swipe on Canvas
  let touchStartX = 0;
  let touchStartY = 0;
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 20) {
      if (absX > absY) {
        triggerDirection(dx > 0 ? 'right' : 'left');
      } else {
        triggerDirection(dy > 0 ? 'down' : 'up');
      }
    }
  };

  // On-screen D-Pad listeners
  const dpadBtns = root.querySelectorAll('.dpad-btn[data-dir]');
  const dpadHandlers = [];
  dpadBtns.forEach(btn => {
    const handler = (e) => {
      e.preventDefault();
      const dir = btn.getAttribute('data-dir');
      triggerDirection(dir);
    };
    btn.addEventListener('pointerdown', handler);
    dpadHandlers.push({ el: btn, fn: handler });
  });

  // Visibility change: pause if user switches tabs
  const handleVisibilityChange = () => {
    if (document.hidden && !isPaused && !isWon) {
      togglePause();
    }
  };

  // Attach DOM Listeners
  window.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      setupSnakeAndApple();
      startLoop();
      announce('New game started! Steer apple to collect CHOMP.');
    });
  }
  if (resetBoardBtn) {
    resetBoardBtn.addEventListener('click', () => {
      setupSnakeAndApple();
      startLoop();
      announce('Snake reset. Round restarted.');
      render();
    });
  }

  // Initial setup and immediate board draw
  setupSnakeAndApple();
  render();
  startLoop();

  // Active instance reference for checkAnswer()
  activeModuleInstance = {
    checkStatus: () => {
      if (isWon) {
        announce('Target word CHOMP already fully assembled!');
      } else {
        announce(`In progress: ${collected.length} of ${wordLength} letters collected. Next letter: ${targetWord[collected.length]}.`);
      }
    }
  };

  // Register cleanup handler
  activeCleanup = () => {
    stopLoop();
    window.removeEventListener('keydown', handleKeyDown);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    dpadHandlers.forEach(({ el, fn }) => el.removeEventListener('pointerdown', fn));
  };
}
