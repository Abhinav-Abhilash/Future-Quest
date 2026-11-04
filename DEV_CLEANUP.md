# Future Quest 2026 - Developer & Test Feature Cleanup Guide

This document catalogs every developer, testing, and mock feature implemented across the Future Quest 2026 frontend shell. All developer artifacts are explicitly tagged in the codebase with `/* DEV-ONLY */` comments and `.dev-only` CSS classes for identification and removal prior to production deployment.

---

## 1. Master Toggle (`CONFIG.DEV_MODE`)

- **File:** [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) (`CONFIG.DEV_MODE`)
- **Current Value:** `true`
- **Behavior:**
  - Setting `CONFIG.DEV_MODE = false` immediately disables and hides all developer user interfaces across the platform:
    1. The fixed **Dev Reset Bar** (`#dev-reset-bar`) is completely removed from the DOM.
    2. The puzzle view **Dev Toolbar** (`.dev-toolbar`) is omitted from HTML templates.
    3. Global debugging bindings (`window.GameState`, `window.CONFIG`) are never attached to `window`.
    4. CSS fallback rule (`body:not(.dev-mode) .dev-only { display: none !important; }`) ensures any remaining dev UI elements are concealed.

---

## 2. Complete Inventory of Dev-Only & Mock Features

| Feature | Primary File(s) | HTML Class / ID | Description & Production Action |
| :--- | :--- | :--- | :--- |
| **Dev Reset Bar** | [`js/app.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/app.js)<br>[`styles.css`](file:///c:/Users/user/Downloads/Future%20Quest/styles.css)<br>[`js/modal.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/modal.js) | `.dev-reset-bar.dev-only`<br>`#btn-dev-reset-all`<br>`#modal-dev-reset-title` | Fixed bottom-right bar with dashed border and "Reset all progress" button. Opens a confirmation modal and resets all `localStorage` state, timers, notices, and intervals, redirecting to `#/landing`.<br>**Action:** Delete `initDevResetBar()` and `performDevReset()` in `app.js`, modal method in `modal.js`, and `.dev-reset-bar` styles. |
| **Puzzle View Dev Toolbar** | [`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js)<br>[`styles.css`](file:///c:/Users/user/Downloads/Future%20Quest/styles.css) | `.dev-toolbar.dev-only`<br>`#btn-dev-solve`<br>`#btn-dev-fail`<br>`#btn-dev-skip` | Toolbar providing three testing shortcuts inside the puzzle screen: *Mark Solved (dev)*, *Mark Failed (dev)*, and *Skip timer to 10s*.<br>**Action:** Remove `.dev-toolbar` template and event listeners from `renderPuzzle()` in `screens.js`. |
| **Dev State Helpers** | [`js/state.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/state.js) | Methods:<br>`devSolve()`<br>`devFail()`<br>`devSkipTimer()` | Helper methods on `StateManager` that manipulate puzzle block status and timer values directly.<br>**Action:** Remove `devSolve()`, `devFail()`, and `devSkipTimer()` methods from `state.js`. |
| **Global Object Exposure** | [`js/app.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/app.js) | `window.GameState`<br>`window.CONFIG` | Diagnostic convenience that exposes game state and configuration in browser DevTools.<br>**Action:** Remove the `if (CONFIG.DEV_MODE)` block from `app.js` constructor. |
| **Tile Shuffling Test Flag** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/state.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/state.js) | `CONFIG.SHUFFLE_TILES` | Flag currently set to `false` to keep tiles in fixed sequential order (Task 1 through Task 11) for testing.<br>**Action:** Set `CONFIG.SHUFFLE_TILES = true` or remove the flag once production randomizer is active. |
| **Mock Puzzles & Answers** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/puzzles/`](file:///c:/Users/user/Downloads/Future%20Quest/js/puzzles/) | `CONFIG.PUZZLES`<br>`CONFIG.TILE_DIFFICULTY`<br>`tools/verify-puzzles.mjs`<br>`tools/test-suite.mjs`<br>`tools/check-sizes.mjs` | 11 interactive puzzle definitions (ASCII decoder, BODMAS math, Coordinates grid, Word search) with client-side verification data, hints, and clue specifications.<br>**Action:** In production, puzzle questions, math expressions, and validation hashes must be validated on the backend API server to prevent client-side inspection via browser DevTools. Remove DEV test scripts in `tools/` before deployment. |
| **Submission Form Placeholder** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `CONFIG.POSTER_FORM_URL` | Placeholder Google Forms endpoint for poster submissions.<br>**Action:** Update URL to the official Jain University SFT submission form. |
| **Client Verification Hash** | [`js/state.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/state.js)<br>[`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `generateVerificationHash()` | Client-side deterministic string generator used for vault display verification mockup.<br>**Action:** Replace with server-signed cryptographic HMAC token generated upon vault locking. |
| **Scoring Rubric Notice** | [`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `.scoring-placeholder-block.dev-only` | Notice box on the Rules screen indicating that official weighted scoring rules are pending committee publication.<br>**Action:** Replace placeholder block with finalized scoring rubric text. |

---

## 3. Production Deployment Checklist

When preparing the platform for live competition:

1. [ ] Open [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) and set `DEV_MODE: false`.
2. [ ] Open [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) and set `SHUFFLE_TILES: true`.
3. [ ] Update `POSTER_FORM_URL` in [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) with the finalized live Google Form link.
4. [ ] Connect real puzzle and clue definitions from the secure server API endpoint (ensuring mystery difficulty is preserved until puzzle opening).
5. [ ] Wire server-side timer validation and HMAC verification hash generation in place of client-side placeholder calculations.
6. [ ] Confirm that no `.dev-only` elements or dev toolbars are visible on desktop or mobile viewports.

