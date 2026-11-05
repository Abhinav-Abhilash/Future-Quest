/**
 * Future Quest 2026 - Puzzle Art & Reward Icons
 * 
 * Standalone inline SVG strings for reward popups, pawns, reticles, pips, and puzzle decorations.
 * Strictly flat SVG strings (no gradients, no blur, no external sprite dependencies).
 */

export const PUZZLE_ART = {
  gem: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 12L2 9z"/>
    <path d="M11 3v6l-5 12"/>
    <path d="M13 3v6l5 12"/>
    <path d="M2 9h20"/>
  </svg>`,

  key: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="7.5" cy="15.5" r="4.5"/>
    <path d="m10.7 12.3 8.8-8.8"/>
    <path d="m15.5 7.5 2 2"/>
    <path d="m18 5 2 2"/>
  </svg>`,

  scroll: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M8 21h12a2 2 0 0 0 2-2v-2H10a2 2 0 1 1 0-4h12V4a2 2 0 0 0-2-2H8a4 4 0 0 0-4 4v11a4 4 0 0 0 4 4z"/>
    <path d="M19 17v4"/>
    <path d="M8 7h8"/>
    <path d="M8 11h6"/>
  </svg>`,

  compass: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.15"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>`,

  chest: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="10" rx="1"/>
    <path d="M3 11a9 9 0 0 1 18 0"/>
    <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
    <path d="M12 16.5V18"/>
  </svg>`,

  padlock: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
  </svg>`,

  // Tactical / Game Interaction Art
  pawn: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" stroke="none" aria-hidden="true">
    <circle cx="12" cy="5.5" r="3.25"/>
    <path d="M8.5 9.5h7l-1 4.5h1.5l1.5 6.5H6.5l1.5-6.5h1.5z"/>
  </svg>`,

  reticle: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="6.5"/>
    <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
  </svg>`,

  pipFilled: `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5"/>
  </svg>`,

  pipHollow: `<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
    <circle cx="6" cy="6" r="4.25"/>
  </svg>`,

  arrowDown: `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M8 2v10m-3.5-3.5 3.5 3.5 3.5-3.5"/>
  </svg>`,

  // Apple Eats Snake Arcade Characters
  apple: `<svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
    <path d="M31 16 C31 10 35 5 40 4 C39 8 36 12 33 16 Z" fill="#78350F" />
    <path d="M34 11 C40 7 47 8 49 13 C44 16 37 15 34 11 Z" fill="#16A34A" stroke="#15803D" stroke-width="1" />
    <path d="M32 15 C44 15 54 19 58 25 L34 37 L58 49 C54 54 44 59 32 58 C20 59 6 52 6 37 C6 21 20 15 32 15 Z" fill="#DC2626" />
    <path d="M32 15 C20 15 6 21 6 37 C6 46 12 53 18 57 C13 52 10 44 10 37 C10 23 20 17 32 15 Z" fill="#B91C1C" />
    <circle cx="36" cy="25" r="3.5" fill="#0F172A" />
    <circle cx="37.2" cy="24" r="1.2" fill="#FFFFFF" />
  </svg>`,

  snakeHead: `<svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
    <path d="M48 32 H55 L59 28 M55 32 L59 36" stroke="#DC2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <rect x="4" y="4" width="48" height="56" rx="14" fill="#16A34A" stroke="#15803D" stroke-width="4" />
    <polygon points="18,32 25,25 32,32 25,39" fill="#15803D" />
    <circle cx="30" cy="22" r="7" fill="#FFFFFF" />
    <circle cx="32" cy="22" r="3.5" fill="#0F172A" />
    <circle cx="30" cy="42" r="7" fill="#FFFFFF" />
    <circle cx="32" cy="42" r="3.5" fill="#0F172A" />
  </svg>`,

  snakeBody: `<svg viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="14" fill="#16A34A" stroke="#15803D" stroke-width="4" />
    <polygon points="32,12 52,32 32,52 12,32" fill="#15803D" />
    <polygon points="32,20 44,32 32,44 20,32" fill="#4ADE80" />
  </svg>`
};

export const ART_KEYS = ['gem', 'key', 'scroll', 'compass', 'chest', 'padlock'];
