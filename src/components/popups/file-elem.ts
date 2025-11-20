import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { app } from '../../controllers/Core/App';

class FileElem extends SignalWatcher(LitElement) {
  @property({ type: String }) title = '';
  @property({ type: String }) environment = '';

  private envThemeColor = '';

  static styles = css`
    :host {
      display: block;
    }

    .file-card {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 12px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
    }

    .file-card:hover {
      background-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .file-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0; /* Pour que l'ellipsis fonctionne */
    }

    .file-name {
      font-weight: 500;
      font-size: 0.9em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-info {
      font-size: 0.75em;
      opacity: 0.7;
    }

    .environment-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8em;
      padding: 4px 8px;
      border-radius: 6px;
      background-color: var(--theme-color);
      color: white;
      white-space: nowrap;
    }

    .environment-icon {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      padding: 2px;
      background-color: white;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    if (this.environment) {
      const envModule = await import(
        `../../controllers/Core/Environments/${this.environment}.js`
      );
      this.envThemeColor = envModule.default.themeColor;
      this.requestUpdate();
    }
  }

  handleClick() {
    // Vérifier si l'environnement du fichier est différent de l'environnement actuel
    // Si oui, afficher un message de confirmation avant d'ouvrir le fichier
    if (
      this.environment &&
      app.environment &&
      app.environment.name !== this.environment
    ) {
      if (
        confirm(
          `Ce fichier appartient à l'environnement "${this.environment}" qui est différent de l'environnement actuel "${app.environment.name}". Voulez-vous changer d'environnement et ouvrir ce fichier ?`,
        )
      ) {
        this.openFile();
      }
    } else {
      this.openFile();
    }
  }

  async openFile() {
    this.dispatchEvent(
      new CustomEvent('close-popup', { bubbles: true, composed: true }),
    );
    const { openFileFromServer } = await import('@db/firebase-init');
    openFileFromServer(this.title);
  }

  render() {
    const envIcon = this.environment
      ? `/images/Environnements/logo_${this.environment.toLowerCase()}_96x96.svg`
      : '';

    return html`
      <div class="file-card" @click="${this.handleClick}">
        ${this.environment
        ? html` <div
              class="environment-tag"
              style="background-color: ${this.envThemeColor ||
          'var(--theme-color)'}"
            >
              <img
                class="environment-icon"
                src="${envIcon}"
                alt="${this.environment}"
              />
              ${this.environment}
            </div>`
        : ''}
        <div class="file-content">
          <div class="file-name">${this.title}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('file-elem', FileElem);
