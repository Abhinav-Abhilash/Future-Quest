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
| **Mock Puzzles & Answers** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/puzzles/`](file:///c:/Users/user/Downloads/Future%20Quest/js/puzzles/) | `CONFIG.PUZZLES`<br>`CONFIG.TILE_DIFFICULTY`<br>`tools/verify-puzzles.mjs`<br>`tools/test-suite.mjs`<br>`tools/check-sizes.mjs` | 11 interactive puzzle definitions with client-side verification data, hints, and clue specifications.<br>**Action:** In production, puzzle questions, math expressions, and validation hashes must be validated on the backend API server to prevent client-side inspection via browser DevTools. Remove DEV test scripts in `tools/` before deployment. |
| **Submission Form Placeholder** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `CONFIG.POSTER_FORM_URL` | Placeholder Google Forms endpoint for poster submissions.<br>**Action:** Update URL to the official Jain University SFT submission form. |
| **Client Verification Hash** | [`js/state.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/state.js)<br>[`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `generateVerificationHash()` | Client-side deterministic string generator used for vault display verification mockup.<br>**Action:** Replace with server-signed cryptographic HMAC token generated upon vault locking. |
| **Scoring Rubric Notice** | [`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `.scoring-placeholder-block.dev-only` | Notice box on the Rules screen indicating that official weighted scoring rules are pending committee publication.<br>**Action:** Replace placeholder block with finalized scoring rubric text. |

---

## 3. Real Competition Puzzles & Poster Clue Specification Inventory (PDF-Sourced)

Four real puzzle challenges and their corresponding poster fragment clues have been sourced directly from official event PDFs and integrated into `CONFIG.PUZZLES`:

### Task 1 (`puzzle_1`) - ASCII Quote Decoder
- **PDF Source:** `ASCII_Quote_Decoder.pdf`
- **Type / Difficulty:** `ascii` / Easy (Mystery until opened)
- **Mechanic:** Decimal ASCII codes arranged horizontally by word with auto-advance, Backspace backward navigation, copy-paste word filling, live decode sentence banner, and slide-out ASCII reference chart.
- **Answer:** `"Tomorrow starts with the code you write today"`
- **Unlocked Reward:** **Poster Fragment 6**
  - **Spec Card:** Text: `"Tomorrow starts with the code you write today"`, Font: `Arial`, Size: `14pt`, Style: `Italics`, Color: `Black (#000000)`, Position: `Center, below FUTURE`.
  - Includes quick 1-click **Copy Specification** action in both puzzle completion popup and Vault Inventory.

### Task 2 (`puzzle_2`) - Coordinates Grid Decoder
- **PDF Source:** `Coordinates_Grid_LEARN_BUILD_LEAD.pdf`
- **Type / Difficulty:** `coords` / Easy (Mystery until opened)
- **Mechanic:** 7x7 matrix with `(column, row)` ordered coordinate chips. Interactive radar sweeps and crosshairs highlight target cells.
- **Words Spelled:**
  - Chip Group 1: `(2,1)(7,3)(3,2)(1,5)(2,4)` = `LEARN`
  - Chip Group 2: `(4,3)(6,1)(7,5)(6,4)(3,5)` = `BUILD`
  - Chip Group 3: `(2,6)(4,7)(6,6)(7,7)` = `LEAD`
- **Answer:** `"LEARN BUILD LEAD"`
- **Unlocked Reward:** **Poster Fragment 9**
  - **Spec Card:** Text: `LEARN – BUILD – LEAD` (uppercase, separated by dashes). Colors: `LEARN: Green (#22C55E)`, `BUILD: Blue (#3B82F6)`, `LEAD: Red (#EF4444)`. Position: `Lower-center, directly below body paragraph`.
  - Includes quick 1-click **Copy Specification** action.

### Task 3 (`puzzle_3`) - Code The Future BODMAS
- **PDF Source:** `Code_The_Future_BODMAS.pdf`
- **Type / Difficulty:** `bodmas` / Medium (Mystery until opened)
- **Mechanic:** 13 BODMAS math expressions with superscripts evaluated through operator precedence into letter numbers (1=A, 2=B, ..., 26=Z), organized into 3 target words. Interactive A-Z reference scale highlights computed letters.
  - Word 1 (CODE - 4 eq): `(8*3)/8`=3(C), `5*3-0`=15(O), `2^3/2`=4(D), `(10/2)-0`=5(E)
  - Word 2 (THE - 3 eq): `4*5`=20(T), `2^3`=8(H), `(25/5)`=5(E)
  - Word 3 (FUTURE - 6 eq): `12/2`=6(F), `3^2+18/3`=21(U), `4^2+12/3`=20(T), `3*7`=21(U), `2^3+6-3*2`=18(R), `(15/3)`=5(E)
- **Answer:** `"CODE THE FUTURE"`
- **Unlocked Reward:** **Poster Fragment 5**
  - **Spec Card:** Text: `CODE THE` (line 1), `FUTURE` (line 2). Font: `Arial Black`, CODE THE size: `20pt`, FUTURE size: `24pt`, Weight: `Bold display`, Color: `Yellow (#FFC928)`. Position: `Upper-center, directly below FUTURE QUEST 2026`.
  - Includes quick 1-click **Copy Specification** action.

### Task 7 (`puzzle_7`) - Treasure Hunt Word Search
- **PDF Source:** `Treasure_Hunt_Word_Search.pdf`
- **Type / Difficulty:** `wordsearch` / Hard (Mystery until opened)
- **Mechanic:** 15x15 letter matrix containing 20 hidden technology terms in horizontal, vertical, and diagonal directions. Interactive pointer dragging selects words; found words lock into colored highlight capsules and checklist strikes through.
- **20 Words:** `AROUND`, `ARTIFICIAL`, `CENTERED`, `COMPUTING`, `DAILY`, `DATA`, `EDGE`, `FUTURE`, `INNOVATIONS`, `INTEGRATION`, `LIFE`, `QUANTUM`, `RAPID`, `REALITY`, `RESHAPE`, `ROBOTICS`, `SCIENCE`, `SUSTAINABLE`, `TECHNOLOGY`, `VIRTUAL`.
- **Answer:** Comma-separated list or word search completion.
- **Unlocked Reward:** **Poster Fragment 8**
  - **Spec Card:** Text: List of the 20 found technology words. Typography: Font: `Calibri`, Size: `12pt`, Style: `Italics`, Color: `Black (#000000)`. Instruction: `"Write your own paragraph using these words."`. Position: `Lower-center, below centerpiece image`.
  - Note: Does not disclose the paragraph text directly, requiring contestants to compose their own poster copy incorporating all 20 discovered keywords.
  - Includes quick 1-click **Copy Specification** action.

---

## 4. Production Deployment Checklist

When preparing the platform for live competition:

1. [ ] Open [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) and set `DEV_MODE: false`.
2. [ ] Open [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) and set `SHUFFLE_TILES: true`.
3. [ ] Update `POSTER_FORM_URL` in [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) with the finalized live Google Form link.
4. [ ] Connect real puzzle and clue definitions from the secure server API endpoint (ensuring mystery difficulty is preserved until puzzle opening).
5. [ ] Wire server-side timer validation and HMAC verification hash generation in place of client-side placeholder calculations.
6. [ ] Confirm that no `.dev-only` elements or dev toolbars are visible on desktop or mobile viewports.

