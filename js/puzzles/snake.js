/**
 * Future Quest 2026 - Apple Eats Snake (Pure Bonus Mini-Game)
 * 
 * Pure bonus arcade challenge:
 * - The player controls the APPLE. The SNAKE moves by itself.
 * - Reverse of classic Snake: Apple eats snake and the snake shrinks!
 * - Pure bonus: no clue, no timer, no attempts, no hints, no lives, no penalties.
 * - Sized to fit 360px wide with no horizontal scroll.
 * - Fixed-step game loop (~6 moves/sec initial, speeds up slightly as snake shrinks).
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

  const GRID_SIZE = 15;
  const CANVAS_SIZE = 450;
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 30px per cell

  // Root layout HTML
  root.innerHTML = `
    <div class="snake-game-wrapper" role="region" aria-label="Apple Eats Snake Bonus Arcade Game">
      <!-- HUD Top Bar -->
      <div class="snake-hud-bar">
        <div class="snake-hud-status-group" style="justify-content: space-between; width: 100%;">
          <div class="snake-stats-group" style="display: flex; gap: 16px; align-items: center;">
            <span class="snake-hud-tag mono" id="snake-score-display">SCORE: 0</span>
            <span class="snake-hud-tag mono" id="snake-segments-display" style="color: #4ADE80;">SNAKE: 8 SEGMENTS</span>
          </div>

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
          aria-label="Apple Eats Snake 15 by 15 grid. Steer the apple to chomp the snake's body and eat the head to win."
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
            <h3 class="mono" style="color: #4ADE80; margin: 8px 0;">YOU ATE THE SNAKE!</h3>
            <p class="mono text-muted" style="font-size: 1.1rem; margin-bottom: 6px;">
              Final Score: <strong id="snake-victory-score" style="color: #FBBF24;">0</strong>
            </p>
            <span class="snake-victory-sub">You devoured the entire serpent! Pure arcade glory.</span>
            <div style="margin-top: 14px;">
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

        <!-- On-Screen D-Pad (Shown on touch devices with pointer: coarse) -->
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
  const scoreDisplay = root.querySelector('#snake-score-display');
  const segmentsDisplay = root.querySelector('#snake-segments-display');
  const startBannerEl = root.querySelector('#snake-start-banner');
  const pauseOverlay = root.querySelector('#snake-pause-overlay');
  const victoryOverlay = root.querySelector('#snake-victory-overlay');
  const victoryScoreEl = root.querySelector('#snake-victory-score');
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
  // SYNTHESIZED AUDIO FX (Web Audio API)
  // -------------------------------------------------------------
  let audioCtx = null;
  const getAudioContext = () => {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  };

  const playPopSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  };

  const playBonkSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const playVictorySound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // GAME STATE
  // -------------------------------------------------------------
  let isPaused = false;
  let isWon = false;
  let isBonking = false;
  let bonkShakeTicks = 0;
  let score = 0;
  let rafId = null;
  let lastTickTime = 0;
  let mouthAnimPhase = 0; // 0..1 oscillating
  let chompFlashTicks = 0;

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

  // Snake state: head + 7 body segments
  let snake = {
    head: { x: 10, y: 7, dir: DIRS.left },
    segments: []
  };

  // Check board bounds
  const inBounds = (x, y) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

  // Speed calculation: starts at 166ms (~6 steps/sec), speeds up slightly as snake shrinks
  const getTickInterval = () => {
    const remainingSegments = snake.segments.length;
    // Base 166ms, decreases down to 124ms when only head remains
    return Math.max(124, 166 - (7 - remainingSegments) * 6);
  };

  // Find a safe empty spot for apple relocation after a bonk
  const findSafeSpot = () => {
    const occupied = new Set();
    occupied.add(`${snake.head.x},${snake.head.y}`);
    snake.segments.forEach(s => occupied.add(`${s.x},${s.y}`));

    const candidates = [];
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      for (let y = 1; y < GRID_SIZE - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          const distToHead = Math.abs(x - snake.head.x) + Math.abs(y - snake.head.y);
          if (distToHead >= 4) {
            candidates.push({ x, y });
          }
        }
      }
    }
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return { x: 2, y: 2 };
  };

  // Setup / Reset Board
  const setupGame = () => {
    apple.x = 2;
    apple.y = 7;
    apple.dir = DIRS.right;
    apple.nextDir = DIRS.right;
    apple.isMoving = false;
    isWon = false;
    isBonking = false;
    bonkShakeTicks = 0;
    chompFlashTicks = 0;
    score = 0;

    if (victoryOverlay) victoryOverlay.classList.add('hidden');
    if (startBannerEl) startBannerEl.classList.remove('hidden');

    // Build snake with 8 segments (head + 7 body segments trailing to the right)
    snake.head = { x: 10, y: 7, dir: DIRS.left };
    snake.segments = [
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 13, y: 7 },
      { x: 14, y: 7 },
      { x: 14, y: 8 },
      { x: 13, y: 8 },
      { x: 12, y: 8 }
    ];

    updateHUD();
  };

  const updateHUD = () => {
    if (scoreDisplay) scoreDisplay.textContent = `SCORE: ${score}`;
    if (segmentsDisplay) {
      const totalSegs = snake.segments.length + 1; // head + body
      segmentsDisplay.textContent = `SNAKE: ${totalSegs} SEGMENT${totalSegs === 1 ? '' : 'S'}`;
      if (segmentsDisplay.style) {
        segmentsDisplay.style.color = totalSegs === 1 ? '#FBBF24' : '#4ADE80';
      }
    }
    if (victoryScoreEl) victoryScoreEl.textContent = String(score);
  };

  // -------------------------------------------------------------
  // SNAKE AI
  // -------------------------------------------------------------
  const updateSnakePosition = () => {
    const head = snake.head;
    const currentDir = head.dir;

    const candidateDirs = [
      currentDir,
      { x: -currentDir.y, y: currentDir.x },  // turn left
      { x: currentDir.y, y: -currentDir.x }   // turn right
    ];

    // Filter valid non-colliding moves
    const validDirs = candidateDirs.filter(d => {
      const nx = head.x + d.x;
      const ny = head.y + d.y;
      if (!inBounds(nx, ny)) return false;
      // Do not hit own body segments
      if (snake.segments.some(s => s.x === nx && s.y === ny)) {
        return false;
      }
      return true;
    });

    let chosenDir = currentDir;
    if (validDirs.length > 0) {
      // Gently prefer moves that move AWAY from the apple so it is fun to chase
      const scoredDirs = validDirs.map(d => {
        const nx = head.x + d.x;
        const ny = head.y + d.y;
        const dist = Math.abs(nx - apple.x) + Math.abs(ny - apple.y);
        return { dir: d, dist };
      });
      scoredDirs.sort((a, b) => b.dist - a.dist);

      // 70% of time pick the best distancing direction, 30% wander
      if (Math.random() < 0.70) {
        chosenDir = scoredDirs[0].dir;
      } else {
        chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
      }
    } else {
      // If trapped, allow turning anywhere in bounds
      const reverseDir = { x: -currentDir.x, y: -currentDir.y };
      chosenDir = inBounds(head.x + reverseDir.x, head.y + reverseDir.y) ? reverseDir : currentDir;
    }

    head.dir = chosenDir;

    // Move body segments to follow
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

  // -------------------------------------------------------------
  // BONK ANIMATION & RELOCATION
  // -------------------------------------------------------------
  const triggerBonk = () => {
    if (isBonking || isWon) return;
    isBonking = true;
    bonkShakeTicks = 10;
    playBonkSound();
    announce("Bonk! Mind the snake's head.");

    setTimeout(() => {
      if (!activeModuleInstance || isWon) return;
      const safe = findSafeSpot();
      apple.x = safe.x;
      apple.y = safe.y;
      apple.isMoving = false;
      isBonking = false;
      bonkShakeTicks = 0;
      render();
    }, 1000);
  };

  // -------------------------------------------------------------
  // COLLISION CHECKING
  // -------------------------------------------------------------
  const checkCollisions = () => {
    if (isWon || isBonking) return;

    // 1. Check if apple touches snake body
    const bodyHitIndex = snake.segments.findIndex(s => s.x === apple.x && s.y === apple.y);
    if (bodyHitIndex !== -1) {
      // Chomp segment at bodyHitIndex and all tail segments behind it
      const chompedCount = snake.segments.length - bodyHitIndex;
      snake.segments = snake.segments.slice(0, bodyHitIndex);
      score += chompedCount * 100;
      chompFlashTicks = 5;
      playPopSound();
      updateHUD();

      const totalLeft = snake.segments.length + 1;
      if (snake.segments.length === 0) {
        announce(`Snake body devoured! Catch the head to win!`);
      } else {
        announce(`Chomped ${chompedCount} segment${chompedCount > 1 ? 's' : ''}! Snake has ${totalLeft} segments left.`);
      }
      return;
    }

    // 2. Check if apple touches snake head
    if (apple.x === snake.head.x && apple.y === snake.head.y) {
      if (snake.segments.length === 0) {
        // Only head remains: Apple eats the head to win!
        score += 500;
        isWon = true;
        playVictorySound();
        updateHUD();
        if (victoryOverlay) victoryOverlay.classList.remove('hidden');
        announce(`You ate the snake! Final score: ${score}.`);
        stopLoop();
      } else {
        // Head touched while body still exists: Bonk!
        triggerBonk();
      }
    }
  };

  // -------------------------------------------------------------
  // STEP EXECUTION (Turn-based or loop-based)
  // -------------------------------------------------------------
  const executeStep = () => {
    if (isPaused || isWon || isBonking) return;

    if (chompFlashTicks > 0) chompFlashTicks--;

    // Move apple in chosen direction
    apple.dir = apple.nextDir;
    if (apple.isMoving) {
      const nx = apple.x + apple.dir.x;
      const ny = apple.y + apple.dir.y;
      if (inBounds(nx, ny)) {
        apple.x = nx;
        apple.y = ny;
      }
    }

    // Move snake
    updateSnakePosition();

    // Check collisions
    checkCollisions();
  };

  // -------------------------------------------------------------
  // CANVAS RENDERING
  // -------------------------------------------------------------
  const render = () => {
    ctx2d.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Dark graphite background
    ctx2d.fillStyle = '#0F0C1B';
    ctx2d.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Subtle alternating tile pattern
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          ctx2d.fillStyle = 'rgba(255, 255, 255, 0.018)';
          ctx2d.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Subtle 15x15 grid lines
    ctx2d.strokeStyle = 'rgba(74, 58, 110, 0.20)';
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

    // 2. Render Snake Body Segments (matching snake-body.svg)
    for (let i = 0; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      const sx = seg.x * CELL_SIZE;
      const sy = seg.y * CELL_SIZE;

      // Base rounded rectangle (#16A34A body, #15803D border)
      ctx2d.fillStyle = '#16A34A';
      ctx2d.beginPath();
      ctx2d.roundRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6, 7);
      ctx2d.fill();
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = '#15803D';
      ctx2d.stroke();

      // Outer diamond scale pattern (#15803D)
      const cx = sx + CELL_SIZE / 2;
      const cy = sy + CELL_SIZE / 2;
      ctx2d.fillStyle = '#15803D';
      ctx2d.beginPath();
      ctx2d.moveTo(cx, cy - 9);
      ctx2d.lineTo(cx + 9, cy);
      ctx2d.lineTo(cx, cy + 9);
      ctx2d.lineTo(cx - 9, cy);
      ctx2d.closePath();
      ctx2d.fill();

      // Inner lighter diamond (#4ADE80)
      ctx2d.fillStyle = '#4ADE80';
      ctx2d.beginPath();
      ctx2d.moveTo(cx, cy - 5.5);
      ctx2d.lineTo(cx + 5.5, cy);
      ctx2d.lineTo(cx, cy + 5.5);
      ctx2d.lineTo(cx - 5.5, cy);
      ctx2d.closePath();
      ctx2d.fill();
    }

    // 3. Render Snake Head (matching snake-head.svg)
    {
      const hDir = snake.head.dir;
      let hx = snake.head.x * CELL_SIZE;
      let hy = snake.head.y * CELL_SIZE;

      // Small bonk wobble shake if bonking
      if (isBonking && bonkShakeTicks > 0) {
        bonkShakeTicks--;
        hx += (Math.random() - 0.5) * 6;
        hy += (Math.random() - 0.5) * 6;
      }

      const hcx = hx + CELL_SIZE / 2;
      const hcy = hy + CELL_SIZE / 2;

      // Tongue extending from front in facing direction
      if (!isBonking) {
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
      }

      // Head rounded tile
      ctx2d.fillStyle = isBonking ? '#EF4444' : '#16A34A';
      ctx2d.beginPath();
      ctx2d.roundRect(hx + 3, hy + 3, CELL_SIZE - 6, CELL_SIZE - 6, 8);
      ctx2d.fill();
      ctx2d.strokeStyle = isBonking ? '#B91C1C' : '#15803D';
      ctx2d.lineWidth = 2;
      ctx2d.stroke();

      // Diamond scale on head
      ctx2d.fillStyle = '#15803D';
      ctx2d.beginPath();
      ctx2d.moveTo(hcx - hDir.x * 2, hcy - hDir.y * 2 - 4);
      ctx2d.lineTo(hcx - hDir.x * 2 + 4, hcy - hDir.y * 2);
      ctx2d.lineTo(hcx - hDir.x * 2, hcy - hDir.y * 2 + 4);
      ctx2d.lineTo(hcx - hDir.x * 2 - 4, hcy - hDir.y * 2);
      ctx2d.closePath();
      ctx2d.fill();

      // Two eyes with pupils facing head movement direction
      drawSnakeEyes(hcx, hcy, hDir, isBonking);

      // Stars or bonk indicator if bonking
      if (isBonking) {
        ctx2d.fillStyle = '#FBBF24';
        ctx2d.font = 'bold 12px sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'bottom';
        ctx2d.fillText('★ BONK ★', hcx, hy - 2);
      }
    }

    // 4. Render Apple Character (matching apple.svg)
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
      const mouthSpread = isWon ? 0.05 : 0.05 + 0.32 * (0.5 + 0.5 * Math.sin(mouthAnimPhase * Math.PI));

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

  function drawSnakeEyes(cx, cy, dir, bonking) {
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
    if (bonking) {
      // Dizzy eyes when bonking
      ctx2d.font = 'bold 8px sans-serif';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText('x', e1x, e1y);
      ctx2d.fillText('x', e2x, e2y);
    } else {
      ctx2d.beginPath();
      ctx2d.arc(e1x + dir.x * 1, e1y + dir.y * 1, 1.5, 0, Math.PI * 2);
      ctx2d.arc(e2x + dir.x * 1, e2y + dir.y * 1, 1.5, 0, Math.PI * 2);
      ctx2d.fill();
    }
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

      // Animate mouth opening/closing smoothly while apple is moving
      if (apple.isMoving) {
        mouthAnimPhase += 0.09;
      }

      const tickInterval = getTickInterval();
      if (elapsed >= tickInterval) {
        lastTickTime = timestamp - (elapsed % tickInterval);
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
    if (isWon || isBonking) return;

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
      setupGame();
      startLoop();
      announce('New game started! Steer apple to eat the snake.');
    });
  }
  if (resetBoardBtn) {
    resetBoardBtn.addEventListener('click', () => {
      setupGame();
      startLoop();
      announce('Snake reset. Round restarted.');
      render();
    });
  }

  // Initial setup and immediate board draw
  setupGame();
  render();
  startLoop();

  // Active instance reference for checkAnswer()
  activeModuleInstance = {
    checkStatus: () => {
      if (isWon) {
        announce(`You ate the snake! Final score: ${score}.`);
      } else {
        announce(`In progress: Snake has ${snake.segments.length + 1} segments remaining. Score: ${score}.`);
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
