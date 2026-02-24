import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Composant de contrôles d'accessibilité pour compenser le blocage du zoom natif.
 * Offre des boutons de contrôle de taille de police et d'interface.
 */
@customElement('accessibility-controls')
export class AccessibilityControls extends LitElement {
  @property({ type: String }) uiScale = '100%';
  @property({ type: Boolean }) visible = false;

  static styles = css`
    :host {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--theme-color, #fff);
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease;
    }

    :host([hidden]) {
      display: none;
    }

    .toggle-button {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--theme-color, #fff);
      border: 2px solid #333;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      user-select: none;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 180px;
    }

    .control-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .control-label {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .control-buttons {
      display: flex;
      gap: 4px;
    }

    button {
      padding: 8px 12px;
      border: 1px solid #333;
      background: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      min-width: 36px;
      transition: background 0.2s ease;
      user-select: none;
    }

    button:hover {
      background: var(--button-hover-background-color, #e0e0e0);
    }

    button:active {
      background: var(--button-selected-background-color, #d0d0d0);
    }

    .reset-button {
      width: 100%;
      margin-top: 4px;
      font-size: 14px;
    }

    .scale-info {
      font-size: 12px;
      color: #666;
      text-align: center;
      margin-top: 4px;
    }
  `;

  private scaleValue = 100;

  connectedCallback() {
    super.connectedCallback();
    this.loadScale();
    this.applyScale();
  }

  private loadScale() {
    try {
      const saved = localStorage.getItem('ag-ui-scale');
      if (saved) {
        this.scaleValue = parseInt(saved, 10);
        this.uiScale = `${this.scaleValue}%`;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private saveScale() {
    try {
      localStorage.setItem('ag-ui-scale', String(this.scaleValue));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private applyScale() {
    document.documentElement.style.fontSize = `${this.scaleValue}%`;
    this.uiScale = `${this.scaleValue}%`;
    this.requestUpdate();
  }

  private increaseScale() {
    if (this.scaleValue < 150) {
      this.scaleValue += 10;
      this.applyScale();
      this.saveScale();
    }
  }

  private decreaseScale() {
    if (this.scaleValue > 80) {
      this.scaleValue -= 10;
      this.applyScale();
      this.saveScale();
    }
  }

  private resetScale() {
    this.scaleValue = 100;
    this.applyScale();
    this.saveScale();
  }

  private toggleVisibility() {
    this.visible = !this.visible;
  }

  render() {
    if (!this.visible) {
      return html`
        <button
          class="toggle-button"
          @click="${this.toggleVisibility}"
          title="Contrôles d'accessibilité"
          aria-label="Ouvrir les contrôles d'accessibilité"
        >
          ♿
        </button>
      `;
    }

    return html`
      <div class="controls">
        <div class="control-group">
          <span class="control-label">Taille UI</span>
          <div class="control-buttons">
            <button
              @click="${this.decreaseScale}"
              title="Réduire la taille"
              ?disabled="${this.scaleValue <= 80}"
              aria-label="Réduire la taille de l'interface"
            >
              −
            </button>
            <button
              @click="${this.increaseScale}"
              title="Augmenter la taille"
              ?disabled="${this.scaleValue >= 150}"
              aria-label="Augmenter la taille de l'interface"
            >
              +
            </button>
          </div>
        </div>
        <div class="scale-info">${this.uiScale}</div>
        <button
          class="reset-button"
          @click="${this.resetScale}"
          title="Réinitialiser à 100%"
          aria-label="Réinitialiser la taille de l'interface"
        >
          Réinitialiser
        </button>
        <button
          class="reset-button"
          @click="${this.toggleVisibility}"
          title="Fermer"
          aria-label="Fermer les contrôles d'accessibilité"
        >
          Fermer
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'accessibility-controls': AccessibilityControls;
  }
}
