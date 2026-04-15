import { SignalWatcher } from '@lit-labs/signals';
import { appActions, helpSelected } from '@store/appState';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';

/**
 * Popup de choix d'aide
 * Permet à l'utilisateur de choisir entre :
 * 1. Consulter le guide utilisateur (mode normal)
 * 2. Activer le mode débutant (aide contextuelle avec popovers)
 * 3. Désactiver le mode débutant
 */
class HelpModeChooser extends SignalWatcher(LitElement) {
  static properties = {
    toolname: String,
  };

  static styles = css`
    :host {
      --popup-bg: white;
      --popup-border-radius: 12px;
      --popup-box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      --popup-padding: 24px;
      --button-border-radius: 8px;
      --button-padding: 12px 20px;
      --button-font-size: 16px;
      --button-transition: all 0.2s ease;
    }

    .help-mode-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--popup-bg);
      border-radius: var(--popup-border-radius);
      box-shadow: var(--popup-box-shadow);
      padding: var(--popup-padding);
      max-width: 500px;
      width: 90%;
      z-index: var(--z-ui-modal);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -55%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: var(--z-ui-modal-overlay);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
      padding: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #666;
      margin: 0 0 28px 0;
      padding: 0;
      line-height: 1.5;
    }

    .button-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    button {
      padding: var(--button-padding);
      font-size: var(--button-font-size);
      border: none;
      border-radius: var(--button-border-radius);
      cursor: pointer;
      transition: var(--button-transition);
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
    }

    .btn-guide {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .btn-guide:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-guide:active {
      transform: translateY(0);
    }

    .btn-contextual {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-contextual:hover {
      background: #f5f7ff;
      transform: translateY(-2px);
    }

    .btn-contextual:active {
      transform: translateY(0);
    }

    .btn-toggle {
      background: white;
      color: #e74c3c;
      border: 2px solid #e74c3c;
    }

    .btn-toggle:hover {
      background: #ffebee;
      transform: translateY(-2px);
    }

    .btn-toggle:active {
      transform: translateY(0);
    }

    .btn-toggle.active {
      background: #27ae60;
      color: white;
      border-color: #27ae60;
    }

    .btn-toggle.active:hover {
      background: #229954;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f7ff;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #333;
    }

    .status-indicator.active {
      background: #e8f5e9;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e74c3c;
    }

    .status-dot.active {
      background: #27ae60;
    }

    .icon {
      font-size: 18px;
    }
  `;

  firstUpdated() {
    this.addEventListener('close-popup', () => this.close());
    // Fermer au clic sur l'overlay
    this.shadowRoot.querySelector('.overlay').addEventListener('click', () => this.close());
  }

  chooseGuide() {
    // Ouvrir le guide utilisateur
    window.dispatchEvent(
      new CustomEvent('help-mode-choice', {
        detail: { choice: 'guide', toolname: this.toolname },
      }),
    );
    this.close();
  }

  toggleBeginnerMode() {
    // Toggle le mode débutant
    appActions.setHelpSelected(!helpSelected.get());
    // Fermer tous les guides contextuels existants
    const existingGuides = document.querySelectorAll('contextual-guide');
    existingGuides.forEach(guide => guide.remove());
    // Pas besoin de fermer le popup, l'utilisateur peut voir le changement d'état
    this.requestUpdate();
  }

  close() {
    this.remove();
  }

  render() {
    const isBeginnerMode = helpSelected.get();

    return html`
      <div class="overlay"></div>
      <div class="help-mode-popup">
        <h2 class="title">Aide</h2>
        <p class="subtitle">Gérez vos préférences d'assistance</p>

        <!-- Statut du mode débutant -->
        <div class="status-indicator ${isBeginnerMode ? 'active' : ''}">
          <span class="status-dot ${isBeginnerMode ? 'active' : ''}"></span>
          <span>${isBeginnerMode ? 'Mode débutant activé' : 'Mode débutant désactivé'}</span>
        </div>

        <div class="button-container">
          <!-- Toggle mode débutant -->
          <button
            class="btn-toggle ${isBeginnerMode ? 'active' : ''}"
            @click="${() => this.toggleBeginnerMode()}"
          >
            <span class="icon">${isBeginnerMode ? '✓' : '○'}</span>
            <span>${isBeginnerMode ? 'Désactiver le mode débutant' : 'Activer le mode débutant'}</span>
          </button>

          <!-- Guide utilisateur -->
          <button class="btn-guide" @click="${() => this.chooseGuide()}">
            <span class="icon">📚</span>
            <span>Consulter le guide utilisateur</span>
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('help-mode-chooser', HelpModeChooser);
export { HelpModeChooser };

