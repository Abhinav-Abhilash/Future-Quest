/**
 * Future Quest 2026 - Puzzle Art & Reward Icons
 * 
 * Standalone inline SVG strings for reward popups and puzzle decorations.
 * Strictly flat SVG strings (no gradients, no external sprite dependencies).
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
  </svg>`
};

export const ART_KEYS = ['gem', 'key', 'scroll', 'compass', 'chest', 'padlock'];
