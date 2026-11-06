/**
 * Future Quest 2026 - Accessible Modal Dialog Manager
 * 
 * Implements accessible focus-trapping dialogs with Escape key closing,
 * backdrop dismissal, and focus restoration.
 */

import { ICONS } from './icons.js';

class ModalManager {
  constructor() {
    this.modalRoot = null;
    this.lastActiveElement = null;
    this.keydownHandler = null;
  }

  init() {
    if (!this.modalRoot) {
      let root = document.getElementById('modal-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'modal-root';
        root.className = 'modal-root';
        document.body.appendChild(root);
      }
      this.modalRoot = root;

      // Bind backdrop and close button listener ONCE on root
      this.modalRoot.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'backdrop' || e.target.closest('[data-action="close"]')) {
          this.close();
        }
      });
    }
  }

  /**
   * Trap keyboard focus within modal container.
   */
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    this.keydownHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Close the currently open modal and restore focus.
   */
  close() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (this.modalRoot) {
      this.modalRoot.innerHTML = '';
      this.modalRoot.classList.remove('is-active');
    }

    if (this.lastActiveElement && typeof this.lastActiveElement.focus === 'function') {
      this.lastActiveElement.focus();
    }
    this.lastActiveElement = null;
  }

  /**
   * Show Vault Confirmation Modal.
   * Specific to Tile 12 interaction.
   */
  showVaultConfirmation(onConfirm) {
    this.init();
    this.lastActiveElement = document.activeElement;

    this.modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="backdrop">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-vault-title">
          <div class="modal-header">
            <h2 id="modal-vault-title" class="modal-title">Enter the Submission Vault?</h2>
            <button class="btn-icon" data-action="close" aria-label="Close dialog">
              ${ICONS.close}
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-text">
              Once you enter the vault, your timer stops and you cannot go back to the puzzles or change anything. Every unsolved puzzle stays unsolved. You will move straight to submission. This cannot be undone.
            </p>
            <div class="modal-checkbox-row">
              <label class="checkbox-label" for="vault-confirm-check">
                <input type="checkbox" id="vault-confirm-check" class="modal-checkbox" />
                <span>I understand and want to continue</span>
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-vault-confirm" disabled>Confirm & Enter Vault</button>
          </div>
        </div>
      </div>
    `;

    this.modalRoot.classList.add('is-active');
    const card = this.modalRoot.querySelector('.modal-card');
    const checkbox = document.getElementById('vault-confirm-check');
    const confirmBtn = document.getElementById('btn-vault-confirm');

    checkbox.addEventListener('change', () => {
      confirmBtn.disabled = !checkbox.checked;
    });

    confirmBtn.addEventListener('click', () => {
      if (!checkbox.checked) return;
      this.close();
      onConfirm();
    });

    this.trapFocus(card);
  }

  /**
   * Show Hint Confirmation Modal.
   */
  showHintConfirmation(hintsRemaining, onConfirm) {
    this.init();
    this.lastActiveElement = document.activeElement;

    this.modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="backdrop">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-hint-title">
          <div class="modal-header">
            <h2 id="modal-hint-title" class="modal-title">Use Puzzle Hint?</h2>
            <button class="btn-icon" data-action="close" aria-label="Close dialog">
              ${ICONS.close}
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-text">
              You have <strong>${hintsRemaining}</strong> hint${hintsRemaining === 1 ? '' : 's'} remaining for the entire contest. Use one here?
            </p>
            <p class="modal-hint-note">
              Once used, a hint cannot be refunded or re-used on other puzzles.
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-hint-confirm">Use Hint</button>
          </div>
        </div>
      </div>
    `;

    this.modalRoot.classList.add('is-active');
    const card = this.modalRoot.querySelector('.modal-card');
    const confirmBtn = document.getElementById('btn-hint-confirm');

    confirmBtn.addEventListener('click', () => {
      this.close();
      onConfirm();
    });

    this.trapFocus(card);
  }

  /**
   * Show Sign Out Confirmation Modal.
   */
  showSignOutConfirmation(onConfirm) {
    this.init();
    this.lastActiveElement = document.activeElement;

    this.modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="backdrop">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-signout-title">
          <div class="modal-header">
            <h2 id="modal-signout-title" class="modal-title">Sign Out?</h2>
            <button class="btn-icon" data-action="close" aria-label="Close dialog">
              ${ICONS.close}
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-text">
              Are you sure you want to sign out of this team session? You can sign back in or register another team.
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close">Cancel</button>
            <button type="button" class="btn btn-danger" id="btn-signout-confirm">Sign Out</button>
          </div>
        </div>
      </div>
    `;

    this.modalRoot.classList.add('is-active');
    const card = this.modalRoot.querySelector('.modal-card');
    const confirmBtn = document.getElementById('btn-signout-confirm');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.close();
        onConfirm();
      });
    }

    this.trapFocus(card);
  }

  /**
   * Show Clue Details Modal (used by Clue Pouch).
   */
  showClueModal(title, clueCardHtml, onOpenTask) {
    this.init();
    this.lastActiveElement = document.activeElement;

    this.modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="backdrop">
        <div class="modal-card modal-card-clue" role="dialog" aria-modal="true" aria-labelledby="modal-clue-title">
          <div class="modal-header">
            <h2 id="modal-clue-title" class="modal-title mono">${title}</h2>
            <button class="btn-icon" data-action="close" aria-label="Close dialog">
              ${ICONS.close}
            </button>
          </div>
          <div class="modal-body modal-body-clue">
            ${clueCardHtml}
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close">Close</button>
            ${onOpenTask ? `<button type="button" class="btn btn-primary" id="btn-modal-open-task">Open Task Screen</button>` : ''}
          </div>
        </div>
      </div>
    `;

    this.modalRoot.classList.add('is-active');
    const card = this.modalRoot.querySelector('.modal-card');
    const openBtn = document.getElementById('btn-modal-open-task');

    if (openBtn && onOpenTask) {
      openBtn.addEventListener('click', () => {
        this.close();
        onOpenTask();
      });
    }

    if (card) {
      const innerOpenBtn = card.querySelector('.btn-modal-open-task');
      if (innerOpenBtn && onOpenTask) {
        innerOpenBtn.addEventListener('click', () => {
          this.close();
          onOpenTask();
        });
      }
      this.trapFocus(card);
    }
  }
}

export const Modal = new ModalManager();

