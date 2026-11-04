# Future Quest 2026 - Frontend Shell

A fast, lightweight, framework-free frontend shell for **Future Quest 2026** (`future quest'26`), an online tech treasure hunt hosted by **JAIN (Deemed-to-be University) Kochi, School of Future**, designed for 11th and 12th grade school teams.

Built as an immersive, highly performant competition terminal and interactive treasure hunt. The frontend strictly separates the **scoped landing experience** from the **core competition terminal**:
- **Competition Screens (Grid, Puzzle, Vault, Register, Rules):** Dense, practical contest interface (similar to CTFd and LeetCode contest pages) styled with a clean dark graphite neutral base (`#0d1117`), engineer blue accent (`#388bfd`), 1px borders, IBM Plex Mono tabular numbers, and unified purple gradient tiles.
- **Landing Experience (`#/landing`):** Scoped flyer-inspired palette (`--lp-*`) loaded strictly under `body.is-landing` via separate, lazy-loaded [`landing.css`](file:///c:/Users/user/Downloads/Future%20Quest/landing.css) and [`landing.js`](file:///c:/Users/user/Downloads/Future%20Quest/landing.js) with a centered airy hero and an interactive clue-card gallery.

---

## Architecture & Scoped Design System

### 1. Global / Competition Screens (`styles.css`)
- **Theme:** Dark graphite (`--bg-page: #0d1117`, `--bg-surface: #161b22`, `--bg-card: #1c2128`) with engineer blue (`--accent: #388bfd`).
- **Unified Purple Gradient Tiles (Tiles 1 to 11):** High-contrast diagonal gradient (`linear-gradient(135deg, #9068DB 0%, #5A3792 40%, #3A2166 70%, #24133F 100%)`) with a thin lavender border, `"Task N"` label, large mono number, and status badge.
- **Submit Tile (Tile 12):** Flat solid red (`#DC2626`) button with lock icon + `"Submit"`.
- **Status Colors:** Green (`#3fb950`) solved, Red (`#f85149`) failed, Amber (`#d29922`) in progress or low time.
- **Typography:** Body and UI in IBM Plex Sans / system stack; countdown timers in self-hosted **IBM Plex Mono** (500 weight).

### 2. Scoped Landing Experience (`landing.css` & `landing.js`)
- **Scoped Variables (`--lp-*`):** Flat near-black violet canvas (`--lp-bg-base: #0F0B1A`), deeper violet hero band (`--lp-hero-band-top: #2B1580`), solid yellow-orange accent (`--lp-accent-solid: #FF9900`, no gradient), golden yellow badge (`--lp-badge-yellow: #FFC928`), and flat solid card colors (violet, orange, yellow, teal, pink, deep blue).
- **Background:** Flat near-black violet with a subtle static dotted map grid pattern (CSS only, no animation). When leaving the landing page, the canvas immediately returns to dark graphite (`#0d1117`).
- **Heading Typography:** Bold geometric sans **Poppins** (700 and 800 weights) loaded **only on the landing route** inside `landing.css`.
- **Landing Nav Variant:** Minimal sticky header showing the wordmark on the left, Rules link, and a compact `"Start Event"` pill button on the right. (Pre-session registration and rules navigation remain standard without the pill).
- **Redesigned Hero:** Centered, airy layout with `"Powered by JAIN School of Future"` overhead tag, large responsive `clamp()` title with `"2026"` in solid yellow-orange, supporting copy, two pill buttons (primary min-height 48px, secondary outlined), and metadata caption.
- **Clue-Card Gallery:**
  - Two staggered rows of cards (16px radius, mixed dimensions from 180x200px to 240x260px with vertical offsets for a hand-placed look).
  - Left and right edge soft fade masks.
  - 12 unique flat solid cards referencing 12 original illustrations drawn once in an inline SVG sprite (`#art-key`, `#art-chest`, `#art-compass`, `#art-map`, `#art-lantern`, `#art-gem`, `#art-scroll`, `#art-padlock`, `#art-hourglass`, `#art-magnifier`, `#art-cipher`, `#art-torch`).
  - Top row drifts slowly left and bottom row drifts slowly right (~70s loop, `transform: translate3d` only).
  - Pauses on hover, keyboard focus, and when the tab is hidden (`visibilitychange`).
  - Started/stopped with `IntersectionObserver` so drift only runs while visible.
  - Hover tilt (max 4 degrees) and 3D flip on click/tap/Enter revealing 12 playful original one-liner riddles from `CONFIG.LANDING_RIDDLES`.
  - Three cards hide a tiny glint (`data-secret-id`). Discovering them triggers toast feedback, updates the footer tracker (`Secrets found: X/3`, persisted in `sessionStorage`), and shows `"Map decoded"` at 3/3.
  - Mobile, reduced motion, and lite mode: automatic drift is disabled and rendered as a single swipeable row (`scroll-snap-type: x mandatory`).

---

## File Structure

```text
Future Quest/
├── index.html          # Semantic HTML5 SPA entry point & static SEO landing view
├── styles.css          # Core dark graphite design system and contest screens
├── landing.css         # Scoped landing styles (hero, clue-card gallery, flyer tokens)
├── landing.js          # Scoped landing interactions (gallery drift, flips, secret glints)
├── robots.txt          # SEO crawler instructions
├── sitemap.xml         # XML sitemap for search indexing
├── DEV_CLEANUP.md      # Inventory and instructions for dev/test feature removal
├── README.md           # Documentation and run instructions
├── fonts/              # Self-hosted WOFF2 Latin font subsets (<31 KB total)
│   ├── ibm-plex-mono-500.woff2
│   ├── poppins-700.woff2
│   └── poppins-800.woff2
└── js/
    ├── config.js       # Central CONFIG: event metadata, riddles, timers, mock puzzles
    ├── state.js        # Game state manager module with localStorage persistence
    ├── router.js       # Hash-based SPA router with guards (#/landing, #/register, #/grid, #/puzzle/:id, #/vault, #/rules)
    ├── icons.js        # Standard inline SVG icon helpers
    ├── modal.js        # Accessible, focus-trapping modal dialog manager
    ├── screens.js      # Clean contest view renderers for Register, Grid, Puzzle, Vault, Rules
    └── app.js          # Main coordinator, sticky navbar, master loop, and lazy asset loader
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

---

## Competition Rules & Logic (Strictly Preserved)

1. **Master Countdown:** 2 hours (7,200 seconds) continuous timer stored against `timerStartedAt`. Automatically terminates puzzle access and enters the vault at 0 seconds.
2. **Mystery Difficulty:** Puzzles carry independent limits (Easy 10m, Medium 15m, Hard 20m) with distribution (2 easy, 5 medium, 4 hard). Difficulty and time limits are never revealed or hinted at on the grid or nav before opening.
3. **Attempts & Hints:** Maximum 3 attempts per puzzle (3 incorrect attempts permanently fail the puzzle). Shared allocation of 3 hints total for the team.
4. **Submission Vault (`#/vault`):** Freezes timer, locks tiles into read-only mode, displays clue inventory, and outputs client verification hash.
5. **Developer Reset System (`DEV_MODE = true`):** Fixed bottom-right bar with "Reset all progress" button clears all state and resets to `#/landing`. Set `CONFIG.DEV_MODE = false` for live production.
