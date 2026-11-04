/**
 * Future Quest 2026 - SPA Hash Router
 * 
 * Manages client-side hash navigation, route guarding, and cleanup when leaving screens.
 */

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
      return {
        path: cleanHash,
        route: 'puzzle',
        params: { id: parts[1] }
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

    // Leaving previous puzzle route: ensure elapsed puzzle timer is paused
    if (this.currentRoute === 'puzzle' && parsed.route !== 'puzzle') {
      GameState.leavePuzzle(this.currentParams.id);
    }

    let targetRoute = parsed.route;
    let targetParams = parsed.params;

    // Route Guards
    if (!hasSession) {
      // No active session: force to #/home (rules is also accessible for preview)
      if (targetRoute !== 'home' && targetRoute !== 'rules') {
        this.navigate('/home');
        return;
      }
      if (targetRoute === '') {
        this.navigate('/home');
        return;
      }
    } else {
      // Active session exists
      if (targetRoute === '' || targetRoute === 'home') {
        // Skip entry screen if session exists
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
        if (state.vaultEntered) {
          this.navigate('/vault');
          return;
        }

        // Validate puzzle ID
        const puzzleId = targetParams.id;
        if (!state.blocks || !state.blocks[puzzleId]) {
          this.navigate('/grid');
          return;
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
