import '@components/color-button';
import '@components/popups/template-popup';
import { SignalWatcher } from '@lit-labs/signals';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { downloadFileZip, findAllFiles, findAllThemes } from '../../firebase/firebase-init';
import { cachedThemes, selectedSequence } from '../../store/notions';
import './theme-elem';

@customElement('open-server-popup')
class OpenServerPopup extends SignalWatcher(LitElement) {
  @property({ type: Array }) allThemes = []
  @property({ type: Boolean }) isDownloading = false;
  @property({ type: String }) errorMessage = '';
  @property({ type: String }) successMessage = '';

  constructor() {
    super();
    window.addEventListener('close-popup', () => this.close());
  }

  close() {
    this.dispatchEvent(new CustomEvent('closed', {
      bubbles: true,
      composed: true
    }));
    // Retirer l'élément du DOM si nécessaire
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  static styles = css`
    .popup-content {
      display: grid;
      gap: 16px;
      width: 100%;
      padding: 8px;
    }

    .loading-indicator {
      width: 100%;
      height: 8px;
      margin: 0.5rem 0;
      border-radius: 4px;
      animation: pulse 1.5s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }

    .theme-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 50vh;
      overflow-y: auto;
      padding: 8px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
    }

    .theme-list::-webkit-scrollbar {
      width: 8px;
    }

    .theme-list::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }

    .theme-list::-webkit-scrollbar-thumb {
      background-color: var(--theme-color);
      border-radius: 4px;
    }

    .download-progress {
      height: 6px;
      margin: 0.5rem 0;
      border-radius: 4px;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.9em;
      margin-top: 0.5rem;
      padding: 8px;
      background-color: rgba(231, 76, 60, 0.1);
      border-radius: 4px;
      border-left: 3px solid #e74c3c;
    }

    .success-message {
      color: #2ecc71;
      font-size: 0.9em;
      margin-top: 0.5rem;
      padding: 8px;
      background-color: rgba(46, 204, 113, 0.1);
      border-radius: 4px;
      border-left: 3px solid #2ecc71;
    }

    .download-all {
      margin-top: 0.5rem;
      display: flex;
      justify-content: center;
    }

    .download-all color-button {
      width: 100%;
      max-width: 300px;
      transition: transform 0.2s ease;
    }

    .download-all color-button:hover {
      transform: translateY(-2px);
    }

    .section-title {
      font-size: 1.1em;
      font-weight: 500;
      margin: 0;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
  `

  async connectedCallback() {
    super.connectedCallback();
    await this.loadThemes();
    this.addEventListener('state-changed', this.scrollToOpenModule);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('state-changed', this.scrollToOpenModule);
  }

  // Méthode pour faire défiler vers le module ouvert
  scrollToOpenModule() {
    setTimeout(() => {
      const currentSequence = selectedSequence.get();
      if (currentSequence) {
        const moduleElement = this.shadowRoot?.querySelector(`module-elem[title="${currentSequence}"]`);
        if (moduleElement) {
          moduleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100); // Petit délai pour laisser le temps au DOM de se mettre à jour
  }

  async loadThemes() {
    try {
      this.errorMessage = '';
      this.allThemes = [];

      // Vérifier d'abord si des thèmes sont déjà en cache mémoire
      if (cachedThemes.get() && cachedThemes.get().length > 0) {
        console.log('Utilisation des thèmes en cache mémoire:', cachedThemes.get());
        this.allThemes = cachedThemes.get();
        this.scrollToOpenModule();
        return;
      }

      // Sinon charger depuis findAllThemes (qui gère IndexedDB + serveur)
      const themes = await findAllThemes();
      console.log('Thèmes récupérés:', themes);
      this.allThemes = themes;

      // Mise à jour du cache des thèmes en mémoire
      if (themes && themes.length > 0) {
        cachedThemes.set(themes);
      } else if (!navigator.onLine) {
        this.errorMessage = 'Mode hors ligne - aucun thème disponible dans le cache local';
      } else {
        this.errorMessage = 'Aucun thème disponible';
      }

      this.scrollToOpenModule();
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes:', error);
      if (!navigator.onLine) {
        this.errorMessage = 'Mode hors ligne - impossible de charger les thèmes. Vérifiez votre cache local.';
      } else {
        this.errorMessage = `Erreur lors du chargement des thèmes: ${error.message}`;
      }
    }
  }

  /**
   * Gère l'état du bouton de téléchargement
   * @param {string} selector - Le sélecteur CSS du bouton
   * @param {boolean} loading - Indique si le bouton doit afficher l'état de chargement
   * @param {boolean} disabled - Indique si le bouton doit être désactivé
   */
  setButtonState(selector, loading, disabled) {
    const button = this.shadowRoot?.querySelector(selector);
    if (button) {
      if (loading) {
        button.setAttribute('loading', 'true');
      } else {
        button.removeAttribute('loading');
      }
      button.disabled = disabled;
    }
  }

  async downloadAllFiles() {
    try {
      this.isDownloading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Mettre le bouton en état de chargement
      this.setButtonState('.download-all color-button', true, true);

      const files = await findAllFiles();
      if (files && files.length > 0) {
        await downloadFileZip('tous_les_fichiers.zip', files.map(file => file.id));
        this.successMessage = 'Téléchargement terminé avec succès';
      } else {
        this.errorMessage = 'Aucun fichier disponible pour le téléchargement';
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement des fichiers:', error);
      this.errorMessage = `Erreur lors du téléchargement: ${error.message}`;
    } finally {
      this.isDownloading = false;
      this.setButtonState('.download-all color-button', false, false);
    }
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" class="popup-content">
          ${this.allThemes.length === 0 ?
        html`
              <div class="loading-container" role="status" aria-live="polite">
                <p>Chargement des thèmes...</p>
                <progress class="loading-indicator"></progress>
              </div>
            ` :
        html`
              <h3 class="section-title">Thèmes disponibles</h3>
              <div class="theme-list" role="list">
                ${this.allThemes.map(theme => html`<theme-elem role="listitem" .theme=${theme}></theme-elem>`)}
              </div>
            `
      }

          <div class="download-all">
            <color-button @click="${this.downloadAllFiles}" aria-busy="${this.isDownloading}">
              ${this.isDownloading ? 'Téléchargement en cours...' : 'Télécharger tous les fichiers'}
            </color-button>
          </div>

          ${this.isDownloading ? html`<progress class="download-progress" role="progressbar"></progress>` : ''}
          ${this.errorMessage ? html`<div class="error-message" role="alert">${this.errorMessage}</div>` : ''}
          ${this.successMessage ? html`<div class="success-message" role="status">${this.successMessage}</div>` : ''}
        </div>
      </template-popup>
    `;
  }
}