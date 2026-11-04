# Future Quest 2026 - Frontend Shell

A fast, lightweight, framework-free frontend shell for **Future Quest 2026** (`future quest'26`), an online tech treasure hunt hosted by **JAIN (Deemed-to-be University) Kochi, School of Future**, designed for 11th and 12th grade school teams.

Built as an immersive, highly performant competition terminal and interactive treasure hunt. The frontend balances an engaging visual style inspired by the official event flyer with a dense, practical competition interface (similar to CTFd and LeetCode contest platforms). It strictly adheres to performance, accessibility, and SEO best practices (zero external font requests, self-hosted WOFF2 Latin subsets, crawler-readable semantic HTML, zero-flash session routing, and responsive layouts).

---

## Brand Theme & Design System

The visual identity is directly derived from the official **Future Quest 2026** event flyer:

- **Page Base:** Near-black violet (`#0F0B1A`) providing deep contrast.
- **Hero Band:** Rich deep violet gradient (`#2B1580` down to `#0F0B1A`).
- **Primary Accent:** Radiant orange-to-yellow gradient (`#FF8A00` to `#FFC21A`), reserved strictly for primary interactive actions, grand prize figures, and key highlights.
- **Badge Highlights:** Golden yellow (`#FFC928`).
- **Submit Tile:** Flat solid red (`#DC2626`).
- **Tile Styles:** High-contrast purple gradient (`linear-gradient(135deg, #9068DB 0%, #5A3792 40%, #3A2166 70%, #24133F 100%)`) with a thin lavender border.
- **Status Colors (Dedicated Meaning):** Green (`#10B981`) for solved, Red (`#EF4444`) for failed, Amber (`#F59E0B`) for in-progress or low time. Status colors are never reused for decorative styling.
- **Typography:**
  - Headings: Bold rounded geometric sans **Poppins** (700 and 800 weights), matching the flyer's wordmark.
  - Body: Native system UI font stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`) for crisp legibility and zero font overhead.
  - Timers & Numbers: **IBM Plex Mono** (500 weight) for stable tabular countdowns.
  - **Self-Hosted WOFF2 Latin Subsets:** Stored directly in `fonts/` (<31 KB total for all 3 fonts). Zero Google Fonts network requests, `font-display: swap`, and preloading on the primary heading font.

---

## Architecture & File Structure

```text
Future Quest/
├── index.html          # Semantic HTML5 SPA entry point & static SEO landing view
├── styles.css          # Design system, brand tokens, animations, and responsive rules
├── robots.txt          # SEO crawler instructions
├── sitemap.xml         # XML sitemap for search indexing
├── DEV_CLEANUP.md      # Inventory and instructions for dev/test feature removal
├── README.md           # Documentation and run instructions
├── fonts/              # Self-hosted WOFF2 Latin font subsets (<31 KB total)
│   ├── poppins-700.woff2
│   ├── poppins-800.woff2
│   └── ibm-plex-mono-500.woff2
└── js/
    ├── config.js       # Central CONFIG: event metadata, timers, mock puzzles, clue data
    ├── state.js        # Game state manager module with localStorage persistence
    ├── router.js       # Hash-based SPA router with guards (#/landing, #/register, #/grid, #/puzzle/:id, #/vault, #/rules)
    ├── icons.js        # Inline SVG icons (key, chest, compass, lantern, trophy, etc.)
    ├── fx.js           # Lightweight FX and interaction engine (spotlight, counters, route draw, bursts)
    ├── modal.js        # Accessible, focus-trapping modal dialog manager
    ├── screens.js      # View renderers for Register, Grid, Puzzle, Vault, and Rules screens
    └── app.js          # Main coordinator, sticky navbar updates, master timer loop, and FX wiring
```

---

## Local Run Instructions

Because the application uses standard JavaScript ES Modules (`import`/`export`), it should be served over HTTP rather than opened as a raw `file:///` URL (to adhere to browser CORS standards for modules).

### Option 1: Python (Recommended)
```bash
# Navigate to the workspace folder
cd "path/to/Future Quest"

# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000`.

### Option 2: Node.js / npx
```bash
npx serve .
# or
npx http-server -p 8000
```

### Option 3: VS Code Live Server
1. Open the repository in Visual Studio Code.
2. Click **Go Live** on the bottom status bar (using the Live Server extension).

---

## Key Competition Systems

### 1. Timing System (`js/config.js`)
All timing constants reside in the `CONFIG` object:
- **Master Countdown:** 2 hours (7,200 seconds) for the entire game.
  - Stored against `timerStartedAt` to survive browser refreshes and closed tabs.
  - Progress bar under nav visualizes elapsed master time.
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
- **Zero-Flash Session Guard:** A minimal inline script in `<head>` checks `localStorage` and immediately adds `.has-active-session` to `document.documentElement` if a game is in progress. CSS rules immediately suppress the static landing page before the first paint, preventing any visual flicker.
- **Backend Migration Note:** `localStorage` acts as a client-side cache for this prototype. All state operations are encapsulated inside `GameState` in `js/state.js`, allowing a future REST/WebSocket backend to replace `localStorage` without altering any screen presentation logic.

### 3. Grid & Puzzle Phase
- **12 Tiles (3 columns mobile, 4 columns desktop):**
  - **Tiles 1 to 11 (Unified Purple Gradient Tiles):**
    - High-contrast diagonal gradient with a thin lavender border.
    - Top-left: Small white label `"Task N"` (12px, font-weight 600).
    - Bottom-left: Large white monospace number (`01` through `11`).
    - Top-right: Status corner badge (`In progress` / `Solved` / `Failed`).
    - Fully responsive: Label is kept on one line and truncates cleanly on narrow viewports without overlapping the badge.
  - **Tile 12 (Red Submit Button):** Flat solid red tile with lock icon + `"Submit"`. Clicking opens the Vault Confirmation modal. Pulses when all 11 puzzles have been attempted.
  - **Tile States (Supported across all tiles):**
    - `UNOPENED`: Default look without badges.
    - `OPENED_IN_PROGRESS`: Amber corner badge with clock icon + `"In progress"`.
    - `SOLVED`: Green corner badge with check icon + `"Solved"`. Tile is locked.
    - `FAILED`: Red corner badge with cross icon + `"Failed"`. Tile is dimmed and locked for good.
- **Puzzle Screen Layout:**
  - **Heading:** `"Task N"` with difficulty badge and category badge.
  - **Progress Bar:** 3px timer progress bar tracking remaining puzzle time.
  - **"What to do" Block:** Contextual instruction card explaining the objective for that puzzle.
  - **Problem Statement & Input:** Mock technical question with input and `"Submit Answer"`.
  - **Attempts Keys Display:** 3 interactive key icons (intact vs broken) showing remaining attempts.
  - **Hint Lanterns Display:** 3 interactive lantern icons (lit vs dark) showing team hints remaining.
  - **Solve Moment:** 16-piece CSS particle burst and clue unlocked notification.

### 4. Interactive Treasure Hunt FX Engine (`js/fx.js`)
- **Lantern Hero Spotlight:** Dynamic radial lighting follows cursor/touch on the landing hero, revealing 3 hidden ancient glyphs (key, compass, gem).
- **Prize Figures Count-Up:** Animated count-up from ₹0 to ₹50,000 using `IntersectionObserver`.
- **Dotted Route Draw:** Self-drawing route path showing the 4 steps of the contest.
- **3D Preview Tile Flips:** Interactive preview tiles on the landing page that flip 180° on click and subtly tilt on hover.
- **Clue Pouch Strip:** Sticky horizontal inventory strip beneath the navigation bar displaying collected clue gems and locked slots.
- **Lite Mode / Reduced Motion:** Respects `prefers-reduced-motion: reduce`, detects low-end devices (`hardwareConcurrency <= 4`), and includes a user toggle button ("Effects: Standard / Minimal") stored in `localStorage`.

### 5. Submission Vault (`#/vault`)
- Accessed via Tile 12 with an explicit confirmation modal or automatically upon master timer expiration.
- Freezes the master timer and permanently makes all puzzle tiles read-only.
- Displays performance metrics: puzzles solved, hints used, and duration.
- Contains the clue inventory (unsolved/failed puzzles show as locked slots without leaking details).
- Provides a client-side verification hash placeholder (to be cryptographically generated on the server in production).
- Directs teams to the final Google Form submission link.

### 6. Testing & Developer Tools (`DEV_MODE = true`)
When `DEV_MODE` is set to `true` in `js/config.js`, the following testing tools are active (see `DEV_CLEANUP.md` for complete cleanup documentation):
- **Dev Reset Bar (`#dev-reset-bar`):** A fixed bar at the bottom-right of every screen with a `DEV` tag and "Reset all progress" button. Opens a confirmation modal that clears `localStorage`, resets all timers, secret glyphs, and notice flags, and returns the platform to `#/landing` in a clean state.
- **Puzzle Screen Toolbar:**
  - **Mark Solved (dev):** Instantly marks the puzzle solved and reveals its clue.
  - **Mark Failed (dev):** Instantly fails the puzzle and locks it.
  - **Skip timer to 10s:** Fast-forwards puzzle time to test auto-fail and timeout handling.
