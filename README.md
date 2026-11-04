# Future Quest 2026 - Frontend Shell

A fast, lightweight, framework-free frontend shell for **Future Quest 2026**, an online puzzle competition hosted by **Jain University, School of Future Technology**, designed for 11th and 12th grade school teams.

Built strictly according to contest specification as a dense, practical competition terminal (similar to CTFd and LeetCode contest pages), avoiding marketing landing page tropes or AI-generated aesthetic artifacts (no gradient text, no glassmorphism, no glowing neon shadows, no emojis as icons, no floating blobs).

---

## Architecture & File Structure

```text
Future Quest/
├── index.html          # Semantic HTML5 single-page application entry point
├── styles.css          # Clean dark graphite design system and responsive grid
├── js/
│   ├── config.js       # Central CONFIG: timers, mock puzzles, mock answers, clues
│   ├── state.js        # Single state manager module with localStorage cache
│   ├── router.js       # Hash-based SPA router with guards (#/home, #/grid, #/puzzle/:id, #/vault, #/rules)
│   ├── icons.js        # Inline SVG icon definitions (lock, check, cross, hint, clock, etc.)
│   ├── modal.js        # Accessible, focus-trapping modal dialog manager
│   ├── screens.js      # View renderers for Entry, Grid, Puzzle, Vault, and Rules screens
│   └── app.js          # Main coordinator, sticky navbar updates, and master timer loop
└── README.md           # Documentation and local running instructions
```

---

## Local Run Instructions

Because the application uses standard JavaScript ES Modules (`import`/`export`), it should be served over HTTP rather than opened as a raw `file:///` URL (to adhere to browser CORS standards for modules).

### Option 1: Python (Recommended)
If Python is installed on your system:
```bash
# Navigate to the workspace folder
cd "path/to/Future Quest"

# Python 3
python -m http.server 8000
```
Then open your browser to `http://localhost:8000`.

### Option 2: Node.js / npx
If Node.js is installed:
```bash
# Using npx serve (no installation required)
npx serve .
```
Or with `http-server`:
```bash
npx http-server -p 8000
```

### Option 3: VS Code Live Server
1. Open the folder in Visual Studio Code.
2. Click **Go Live** on the bottom status bar (using the Live Server extension).

---

## Key Competition Systems

### 1. Timing System (`js/config.js`)
All timing constants reside in the `CONFIG` object:
- **Master Countdown:** 2 hours (7,200 seconds) for the entire game.
  - Stored against `timerStartedAt` to survive browser refreshes and closed tabs.
  - Switches to amber color when under 10 minutes remain.
  - Displays notifications at 10 and 5 minutes remaining.
  - Auto-terminates the puzzle phase at 0 seconds, locking all puzzles and moving directly to the Submission Vault (`#/vault`) with "Time is up".
- **Per-Puzzle Countdown & Mystery Difficulty:**
  - Mock difficulties: Easy (10 min), Medium (15 min), Hard (20 min).
  - Mock distribution: **2 easy, 5 medium, 4 hard** (easily reconfigurable in `CONFIG.TILE_DIFFICULTY`).
  - **Difficulty is a mystery:** The grid and navbar never show or hint at difficulty or time limits before a puzzle is opened (no labels, CSS classes, data attributes, tooltips, or aria-labels). Tile IDs (`puzzle_1`..`puzzle_11`) are opaque numbers and do not reveal difficulty.
  - Difficulty and the individual puzzle's time limit appear **only** on the puzzle screen after the tile has been opened, and remain visible there permanently.
  - *Production Note:* In production, difficulty and time limits must be supplied dynamically by the backend server upon tile access, as client-side code can be inspected using browser DevTools.
  - Countdown runs only while the puzzle screen is active.
  - Navigating "Back to Grid" pauses the puzzle timer and stores accumulated milliseconds (`timeSpentMs`).
  - Reloading while on the puzzle screen does **not** pause the timer (`activeSince` timestamp anchor is persisted).
  - Timing out immediately fails the puzzle permanently and returns the user to the grid.

### 2. State & Persistence (`js/state.js`)
- Persisted to `localStorage` under `future_quest_2026_state`.
- **Backend Migration Note:** `localStorage` acts as a client-side cache for this prototype. All state operations are encapsulated inside `GameState` in `js/state.js`, allowing a future REST/WebSocket backend to replace `localStorage` without altering any screen presentation logic.

### 3. Grid & Puzzle Phase
- **12 Tiles (3 columns mobile, 4 columns desktop):**
  - **Tiles 1 to 11 (Unified Purple Gradient Tiles):**
    - High-contrast diagonal gradient (`linear-gradient(135deg, #A57EF0 0%, #5A3792 40%, #3A2166 70%, #24133F 100%)`) with a thin lavender border. Strictly no glow and no shadow blur.
    - Top-left: Small white label `"Task N"` (12px, font-weight 600).
    - Bottom-left: Large white monospace number (`01` through `11`).
    - Top-right: Status corner badge (`In progress` / `Solved` / `Failed`).
    - Fully responsive: Label is kept on one line and truncates cleanly on narrow viewports without overlapping the badge.
  - **Tile 12 (Red Submit Button):** Flat solid red tile with lock icon + `"Submit"`. Clicking opens the Vault Confirmation modal.
  - **Tile States (Supported across all tiles):**
    - `UNOPENED`: Default look without badges.
    - `OPENED_IN_PROGRESS`: Opaque amber corner badge with clock icon + `"In progress"`.
    - `SOLVED`: Opaque green corner badge with check icon + `"Solved"`. Tile is locked.
    - `FAILED`: Opaque red corner badge with cross icon + `"Failed"`. Tile is dimmed and locked for good.
- **Task-Based Labeling Everywhere:**
  - `getTileLabel()` consistently returns `"Task N"` for every puzzle tile (1 to 11).
  - Puzzle screen heading, Back to grid context, and vault clue inventory slot labels all use `"Task N"`.
- **Puzzle Screen Layout:**
  - **Heading:** `"Task N"`
  - **"What to do" Block:** Contextual instruction card explaining the objective for that puzzle.
  - **Problem Statement & Input:** Mock technical question with input and `"Submit Answer"`.
  - **Timer & Hints:** Puzzle countdown in header nav row; shared 3-hint allocation with confirmation modal.
- **Attempts & Clues:**
  - Up to 3 attempts per puzzle (`MAX_ATTEMPTS = 3`). 3 incorrect attempts permanently fail the puzzle.
  - Solved puzzles unlock 1 of 3 clue types: Image (SVG download), Text (copy), or Spec (spec table copy).

### 4. Submission Vault (`#/vault`)
- Accessed via Tile 12 with an explicit confirmation modal or automatically upon master timer expiration.
- Freezes the master timer and permanently makes all puzzle tiles read-only.
- Displays performance metrics: puzzles solved, hints used, and duration.
- Contains the clue inventory (unsolved/failed puzzles show as locked slots without leaking details).
- Provides a client-side verification hash placeholder (to be cryptographically generated on the server in production).
- Directs teams to the final Google Form submission link.

### 5. Testing & Developer Tools (`DEV_MODE = true`)
When `DEV_MODE` is set to `true` in `js/config.js`, a developer toolbar appears inside the puzzle view providing:
- **Mark Solved (dev):** Instantly marks the puzzle solved and reveals its clue.
- **Mark Failed (dev):** Instantly fails the puzzle and locks it.
- **Skip timer to 10s:** Fast-forwards puzzle time to test auto-fail and timeout handling.
