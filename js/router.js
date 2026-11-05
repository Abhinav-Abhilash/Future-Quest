/**
 * Future Quest 2026 - SPA Hash Router
 * 
 * Manages client-side hash navigation, route guarding, and cleanup when leaving screens.
 */

import { CONFIG } from './config.js';
import { GameState } from './state.js';

export class Router {
  constructor(routes, onNavigate) {
    this.routes = routes;
    this.onNavigate = onNavigate;
    this.currentRoute = null;
    this.currentParams = {};

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  /**
   * Parse current hash string into route name and parameters.
   */
  parseHash() {
    const rawHash = window.location.hash.slice(1) || '';
    const cleanHash = rawHash.startsWith('/') ? rawHash.slice(1) : rawHash;
    const parts = cleanHash.split('/').filter(Boolean);

    if (parts.length === 0) {
      return { path: '', route: '', params: {} };
    }

    if (parts[0] === 'puzzle' && parts[1]) {
      let rawId = decodeURIComponent(parts.slice(1).join('_')).trim().toLowerCase().replace(/[\s\-]+/g, '_');
      if (/^\d+$/.test(rawId)) rawId = `puzzle_${rawId}`;
      if (rawId.startsWith('task_')) rawId = rawId.replace('task_', 'puzzle_');
      return {
        path: cleanHash,
        route: 'puzzle',
        params: { id: rawId }
      };
    }

    return {
      path: cleanHash,
      route: parts[0],
      params: {}
    };
  }

  /**
   * Navigate programmatically to a new hash route.
   */
  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
  }

  /**
   * Main route resolver and guard logic.
   */
  handleHashChange() {
    const parsed = this.parseHash();
    const hasSession = GameState.hasSession();
    const state = GameState.state;

    // Leaving previous puzzle or switching to a different puzzle id (e.g. by editing hash):
    // pause the previous puzzle timer so only one puzzle may have activeSince set at a time
    if (this.currentRoute === 'puzzle') {
      if (parsed.route !== 'puzzle' || parsed.params.id !== this.currentParams.id) {
        GameState.leavePuzzle(this.currentParams.id);
      }
    }

    let targetRoute = parsed.route;
    let targetParams = parsed.params;

    // Route Guards
    if (!hasSession) {
      // With no session, only #/landing, #/register and #/rules are reachable.
      // The bare URL and anything else redirects to #/landing.
      if (targetRoute !== 'landing' && targetRoute !== 'register' && targetRoute !== 'rules') {
        this.navigate('/landing');
        return;
      }
    } else {
      // With a session, #/landing, #/register and the bare URL redirect straight to #/grid.
      if (targetRoute === '' || targetRoute === 'landing' || targetRoute === 'register' || targetRoute === 'home') {
        this.navigate('/grid');
        return;
      }

      // Vault guard: #/vault is accessible ONLY if vaultEntered is true
      if (targetRoute === 'vault') {
        if (!state.vaultEntered) {
          this.navigate('/grid');
          return;
        }
      }

      // Puzzle guard: if vaultEntered is true, puzzle screens are locked
      if (targetRoute === 'puzzle') {
        if (state && state.vaultEntered) {
          this.navigate('/vault');
          return;
        }

        // Validate and normalize puzzle ID
        let puzzleId = targetParams.id;
        if (puzzleId) {
          puzzleId = decodeURIComponent(puzzleId).trim().toLowerCase().replace(/[\s\-]+/g, '_');
          if (/^\d+$/.test(puzzleId)) puzzleId = `puzzle_${puzzleId}`;
          if (puzzleId.startsWith('task_')) puzzleId = puzzleId.replace('task_', 'puzzle_');
          targetParams.id = puzzleId;
        }

        if (!state || !state.blocks || !state.blocks[puzzleId]) {
          // If block doesn't exist yet but it's a valid puzzle in CONFIG, initialize it safely
          if (state && puzzleId && CONFIG.PUZZLES && CONFIG.PUZZLES[puzzleId]) {
            state.blocks = state.blocks || {};
            state.blocks[puzzleId] = {
              status: 'AVAILABLE',
              attemptsUsed: 0,
              hintUsed: false,
              timeSpentMs: 0,
              activeSince: null,
              progress: {},
            };
          } else {
            this.navigate('/grid');
            return;
          }
        }
      }
    }

    this.currentRoute = targetRoute;
    this.currentParams = targetParams;

    if (typeof this.onNavigate === 'function') {
      this.onNavigate(targetRoute, targetParams);
    }
  }

  /**
   * Initial start of the router on page load.
   */
  start() {
    this.handleHashChange();
  }
}

