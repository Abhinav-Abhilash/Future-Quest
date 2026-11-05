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
| **Dev Reset Bar** | [`js/app.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/app.js)<br>[`styles.css`](file:///c:/Users/user/Downloads/Future%20Quest/styles.css)<br>[`js/modal.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/modal.js) | `.dev-reset-bar.dev-only`<br>`#btn-dev-reset-all`<br>`#modal-dev-reset-title` | Fixed bottom-right bar with dashed border and "Reset all progress" button. Appears on every route (landing, register, grid, puzzle, vault, rules). Opens a confirmation modal ("Reset everything? This erases all progress, timers, hints, attempts and clues on this device."), clears `localStorage.clear()`, `sessionStorage.clear()`, all running intervals/timeouts, modal/notice/toast DOM, resets `GameState` to null, removes `has-active-session`, `lite-mode`, `is-landing`, sets hash to `#/landing`, and calls `location.reload()` for a 100% clean first-time visit recreation.<br>**Action:** Delete `initDevResetBar()` and `performDevReset()` in `app.js`, modal method in `modal.js`, and `.dev-reset-bar` styles. |
| **Puzzle View Dev Toolbar** | [`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js)<br>[`styles.css`](file:///c:/Users/user/Downloads/Future%20Quest/styles.css) | `.dev-toolbar.dev-only`<br>`#btn-dev-solve`<br>`#btn-dev-fail`<br>`#btn-dev-skip` | Toolbar providing three testing shortcuts inside the puzzle screen: *Mark Solved (dev)*, *Mark Failed (dev)*, and *Skip timer to 10s*.<br>**Action:** Remove `.dev-toolbar` template and event listeners from `renderPuzzle()` in `screens.js`. |
| **Dev State Helpers** | [`js/state.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/state.js) | Methods:<br>`devSolve()`<br>`devFail()`<br>`devSkipTimer()` | Helper methods on `StateManager` that manipulate puzzle block status and timer values directly.<br>**Action:** Remove `devSolve()`, `devFail()`, and `devSkipTimer()` methods from `state.js`. |
| **Global Object Exposure** | [`js/app.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/app.js) | `window.GameState`<br>`window.CONFIG` | Diagnostic convenience that exposes game state and configuration in browser DevTools.<br>**Action:** Remove the `if (CONFIG.DEV_MODE)` block from `app.js` constructor. |
| **Tile Shuffling Test Flag** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/state.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/state.js) | `CONFIG.SHUFFLE_TILES` | Flag currently set to `false` to keep tiles in fixed sequential order (Task 1 through Task 10) for testing.<br>**Action:** Set `CONFIG.SHUFFLE_TILES = true` or remove the flag once production randomizer is active. |
| **Mock Puzzles & Answers** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/puzzles/`](file:///c:/Users/user/Downloads/Future%20Quest/js/puzzles/) | `CONFIG.PUZZLES`<br>`CONFIG.TILE_DIFFICULTY`<br>`tools/verify-puzzles.mjs`<br>`tools/test-suite.mjs`<br>`tools/check-sizes.mjs` | 10 interactive puzzle definitions with client-side verification data, hints, and clue specifications.<br>**Action:** In production, puzzle questions, math expressions, and validation hashes must be validated on the backend API server to prevent client-side inspection via browser DevTools. Remove DEV test scripts in `tools/` before deployment. |
| **Submission Form Placeholder** | [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js)<br>[`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `CONFIG.POSTER_FORM_URL` | Placeholder Google Forms endpoint for poster submissions.<br>**Action:** Update URL to the official Jain University SFT submission form. |
| **Server Audit Logging & Security** | [`server/routes/vault.js`](file:///c:/Users/user/Downloads/Future%20Quest/server/routes/vault.js) | Server-side vault logging | Client-side verification hash UI and copy buttons have been completely removed. Server records team solve counts, hints used, and timestamps for judge verification.<br>**Action:** Retain server audit log and timestamp recording in production. |
| **Final Submission Notice** | [`js/screens.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/screens.js) | `#rule-7` | Section on the Rules screen confirming that the contest does not use a points system; teams solve tasks to unlock clues, and then submit their final poster design via the official Google Form.<br>**Action:** Verify Google Form submission URL in `CONFIG.POSTER_FORM_URL`. |
| **Backend & Integration Tests** | [`tools/test-phase3-e2e.mjs`](file:///c:/Users/user/Downloads/Future%20Quest/tools/test-phase3-e2e.mjs)<br>[`server/routes/test-routes.js`](file:///c:/Users/user/Downloads/Future%20Quest/server/routes/test-routes.js)<br>[`server/db/test-connection.js`](file:///c:/Users/user/Downloads/Future%20Quest/server/db/test-connection.js) | CLI test scripts | Automated test suites that verify MongoDB Atlas connection, API endpoints, and full client integration.<br>**Action:** Dev/CI tools only. |
| **Server Admin Token & Environment** | [`server/.env`](file:///c:/Users/user/Downloads/Future%20Quest/server/.env)<br>[`.gitignore`](file:///c:/Users/user/Downloads/Future%20Quest/.gitignore) | `ADMIN_TOKEN`, `HMAC_SECRET`, `ATLAS_PUBLIC_KEY`, `ATLAS_PRIVATE_KEY` | Server secrets stored strictly in gitignored `.env`.<br>**Action:** Rotate tokens and verify Atlas IP access list before public contest launch. |

---

## 3. Real Competition Puzzles & Clue Specification Inventory (PDF-Sourced)

Four real puzzle challenges and their corresponding submission fragment clues have been sourced directly from official event PDFs and integrated into `CONFIG.PUZZLES`. Each task is labeled with an Indian FSSAI-style food badge difficulty indicator (square outline with a centered circular dot: **Green = Easy**, **Yellow = Medium**, **Red = Hard**):

### Task 1 (`puzzle_1`) - ASCII Quote Decoder
- **PDF Source:** `ASCII_Quote_Decoder.pdf`
- **Type / Difficulty:** `ascii` / Easy 🟢 (Green Food Badge)
- **Mechanic:** Decimal ASCII codes arranged horizontally by word with auto-advance, Backspace backward navigation, copy-paste word filling, live decode sentence banner, and slide-out ASCII reference chart.
- **Answer:** `"Tomorrow starts with the code you write today"`
- **Unlocked Reward:** **Clue Fragment 6 (Required Quote Sentence)**
  - **Spec Card:** Quote to Add: `"Tomorrow starts with the code you write today"`, Font: `Arial`, Size: `14pt`, Style: `Italics`, Color: `Black (#000000)`, Position: `Center, below the title`.
  - Includes quick 1-click **Copy Specification** action in both puzzle completion popup and Vault Inventory.

### Task 2 (`puzzle_2`) - Coordinates Grid Decoder
- **PDF Source:** `Coordinates_Grid_LEARN_BUILD_LEAD.pdf`
- **Type / Difficulty:** `coords` / Easy 🟢 (Green Food Badge)
- **Mechanic:** 7x7 matrix with `(column, row)` ordered coordinate chips. Interactive radar sweeps and crosshairs highlight target cells.
- **Words Spelled:**
  - Chip Group 1: `(2,1)(7,3)(3,2)(1,5)(2,4)` = `LEARN`
  - Chip Group 2: `(4,3)(6,1)(7,5)(6,4)(3,5)` = `BUILD`
  - Chip Group 3: `(2,6)(4,7)(6,6)(7,7)` = `LEAD`
- **Answer:** `"LEARN BUILD LEAD"`
- **Unlocked Reward:** **Clue Fragment 9 (Required Motto)**
  - **Spec Card:** Motto to Add: `LEARN — BUILD — LEAD` (uppercase, separated by dashes). Colors: `LEARN: Green (#22C55E)`, `BUILD: Blue (#3B82F6)`, `LEAD: Red (#EF4444)`. Position: `Lower-center, directly below body paragraph`.
  - Includes quick 1-click **Copy Specification** action.

### Task 3 (`puzzle_3`) - Code The Future BODMAS
- **PDF Source:** `Code_The_Future_BODMAS.pdf`
- **Type / Difficulty:** `bodmas` / Medium 🟡 (Yellow Food Badge)
- **Mechanic:** 13 BODMAS math expressions with superscripts evaluated through operator precedence into letter numbers (1=A, 2=B, ..., 26=Z), organized into 3 target words. Interactive A-Z reference scale highlights computed letters.
  - Word 1 (CODE - 4 eq): `(8*3)/8`=3(C), `5*3-0`=15(O), `2^3/2`=4(D), `(10/2)-0`=5(E)
  - Word 2 (THE - 3 eq): `4*5`=20(T), `2^3`=8(H), `(25/5)`=5(E)
  - Word 3 (FUTURE - 6 eq): `12/2`=6(F), `3^2+18/3`=21(U), `4^2+12/3`=20(T), `3*7`=21(U), `2^3+6-3*2`=18(R), `(15/3)`=5(E)
- **Answer:** `"CODE THE FUTURE"`
- **Unlocked Reward:** **Clue Fragment 5 (Required Headline Title)**
  - **Spec Card:** Title to Add: `CODE THE` (line 1), `FUTURE` (line 2). Font: `Arial Black`, CODE THE size: `20pt`, FUTURE size: `24pt`, Weight: `Bold display`, Color: `Yellow (#FFC928)`. Position: `Upper-center, directly below FUTURE QUEST 2026`.
  - Includes quick 1-click **Copy Specification** action.

### Task 7 (`puzzle_7`) - Treasure Hunt Word Search
- **PDF Source:** `Treasure_Hunt_Word_Search.pdf`
- **Type / Difficulty:** `wordsearch` / Hard 🔴 (Red Food Badge)
- **Mechanic:** 15x15 letter matrix containing 20 hidden technology terms in horizontal, vertical, and diagonal directions. Interactive pointer dragging selects words; found words lock into colored highlight capsules and checklist strikes through.
- **20 Words:** `AROUND`, `ARTIFICIAL`, `CENTERED`, `COMPUTING`, `DAILY`, `DATA`, `EDGE`, `FUTURE`, `INNOVATIONS`, `INTEGRATION`, `LIFE`, `QUANTUM`, `RAPID`, `REALITY`, `RESHAPE`, `ROBOTICS`, `SCIENCE`, `SUSTAINABLE`, `TECHNOLOGY`, `VIRTUAL`.
- **Answer:** Comma-separated list or word search completion.
- **Unlocked Reward:** **Clue Fragment 8 (Required Word Bank for Paragraph)**
  - **Spec Card:** Word Bank: 20 discovered technology words. Typography: Font: `Calibri`, Size: `12pt`, Style: `Italics`, Color: `Black (#000000)`. Paragraph Rule: `"Write your submission paragraph using these 20 words."`. Position: `Lower-center, below centerpiece image`.
  - Note: Does not disclose the paragraph text directly, requiring contestants to compose their own submission paragraph incorporating all 20 discovered keywords.
  - Includes quick 1-click **Copy Specification** action.

---

## 4. Full Competition Puzzle & Clue Spec Inventory (All 10 Tasks)

Every puzzle tile corresponds to a specific element of the final competition poster:

| Task # | ID | Type | Difficulty Badge | Solution | Unlocked Poster Reward |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Task 1** | `puzzle_1` | `ascii` | 🟢 Easy | `"Tomorrow starts with the code you write today"` | **Quote Subhead Spec** (`Arial`, `14pt`, `Italics`, Black) |
| **Task 2** | `puzzle_2` | `coords` | 🟢 Easy | `"LEARN BUILD LEAD"` | **Motto Spec** (`LEARN`: Green, `BUILD`: Blue, `LEAD`: Red) |
| **Task 3** | `puzzle_3` | `bodmas` | 🟡 Medium | `"CODE THE FUTURE"` | **Sub-headline Title Spec** (`Arial Black`, Yellow, `20pt/24pt`) |
| **Task 4** | `puzzle_4` | `riddle` | 🟡 Medium | `"CINNAMON BUN"` | **Mascot Icon Spec** (Green Android Bugdroid / System Architecture) |
| **Task 5** | `puzzle_5` | `ascii` | 🟡 Medium | `"WHERE HUMAN MEETS AI"` | **Centerpiece Graphic Asset** (`assets/human_meets_ai.png`, Robot & Human hand) |
| **Task 6** | `puzzle_6` | `riddle` | 🟡 Medium | `"JAIN UNIVERSITY SCHOOL OF FUTURE TECHNOLOGY"` | **Visual Cryptogram** (`assets/jain_future_tech.jpg`) & **Institution Branding Spec** (`JAIN UNIVERSITY. SCHOOL OF FUTURE TECHNOLOGY`) |
| **Task 7** | `puzzle_7` | `wordsearch` | 🔴 Hard | `20 Technology Words` | **Word Bank Spec** (20 tech words for body paragraph) |
| **Task 8** | `puzzle_8` | `riddle` | 🔴 Hard | `"ROADSTER"` | **Vehicle Spec** (Tesla Roadster / Aerospace Telemetry) |
| **Task 9** | `puzzle_9` | `riddle` | 🔴 Hard | `"DARK BLUE AND LIGHT STEEL BLUE"` | **Canvas Background Asset** (`assets/poster_background_palette.png`, gradient) |
| **Task 10** | `puzzle_10` | `coords` | 🟡 Medium | `"FUTURE QUEST"` | **Geometric Grid Alignment Spec** (Concentric Circles & Rule of Thirds Grid) |

---

## 5. Production Deployment Checklist

When preparing the platform for live competition:

1. [ ] Open [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) and set `DEV_MODE: false`.
2. [ ] Open [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) and set `SHUFFLE_TILES: true`.
3. [ ] Update `POSTER_FORM_URL` in [`js/config.js`](file:///c:/Users/user/Downloads/Future%20Quest/js/config.js) with the finalized live Google Form link.
4. [ ] Connect real puzzle and clue definitions from the secure server API endpoint (ensuring mystery difficulty is preserved until puzzle opening).
5. [ ] Confirm server-side timer validation and audit logging.
6. [ ] Confirm that no `.dev-only` elements or dev toolbars are visible on desktop or mobile viewports.

