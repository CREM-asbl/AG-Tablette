import '@components/color-button';
import '@components/popups/template-popup';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { downloadFileZip, findAllFiles, findAllThemes } from '../../firebase/firebase-init';
import { getLastSyncInfo } from '../../services/activity-sync.js';
import { cachedThemes, selectedSequence } from '../../store/notions';
import { syncInProgress } from '../../store/syncState.js';
import { OptimizedSignalController, debounce, throttle } from '../../utils/signal-observer.js';
import './sync-settings-popup';
import './theme-elem';

// Déclaration pour le mode debug
declare global {
  interface Window {
    dev_mode?: boolean;
  }
}

@customElement('open-server-popup')
class OpenServerPopup extends LitElement {
  private signalController = new OptimizedSignalController(this);

  @property({ type: Array }) allThemes = []
  @property({ type: Boolean }) isDownloading = false;
  @property({ type: String }) errorMessage = '';
  @property({ type: String }) successMessage = '';
  @property({ type: Object }) lastSyncInfo = null;
  @property({ type: Boolean }) isLoadingThemes = false;
  @property({ type: Boolean }) showSyncSettings = false;

  private debouncedDownload = debounce(this.downloadAllFiles.bind(this), 500);
  private throttledLoadThemes = throttle(this.loadThemes.bind(this), 1000);

  constructor() {
    super();
    window.addEventListener('close-popup', () => this.close());
    this.loadSyncInfo();
  }

  async loadSyncInfo() {
    try {
      this.lastSyncInfo = await getLastSyncInfo();
    } catch (error) {
      console.warn('Erreur lors du chargement des informations de sync:', error);
    }
  }

  close() {
    this.dispatchEvent(new CustomEvent('closed', {
      bubbles: true,
      composed: true
    }));
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  openSyncSettings() {
    this.showSyncSettings = true;
  }

  closeSyncSettings() {
    this.showSyncSettings = false;
  }

  static styles = css`
    .popup-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      padding: 8px;
      max-height: 70vh;
      overflow: hidden;
    }

    .theme-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 50vh;
      overflow-y: auto;
      padding: 4px;
    }

    .loading-skeleton {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
    }

    .skeleton-line {
      height: 20px;
      background: linear-gradient(90deg,
        rgba(255,255,255,0.1) 0%,
        rgba(255,255,255,0.2) 50%,
        rgba(255,255,255,0.1) 100%);
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }

    .main-action color-button {
      width: 100%;
      min-height: 48px;
      font-weight: 500;
    }

    .sync-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.85em;
      color: var(--theme-text-color, #222);
      padding: 8px 12px;
      background: var(--theme-color-soft, rgba(255,255,255,0.05));
      border-radius: 6px;
    }

    .sync-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .settings-button {
  background: var(--theme-color-soft, rgba(255,255,255,0.1));
  border: 1px solid var(--theme-color, rgba(255,255,255,0.2));
  color: var(--theme-text-color, #222);
      border-radius: 4px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1em;
      flex-shrink: 0;
    }

    .settings-button:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: scale(1.05);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.success { background: #4CAF50; }
    .status-dot.warning {
      background: #FF9800;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .loading-indicator {
      height: 4px;
      background: linear-gradient(90deg,
        var(--theme-color, #4CAF50) 0%,
        rgba(76, 175, 80, 0.3) 50%,
        var(--theme-color, #4CAF50) 100%);
      border-radius: 2px;
      animation: progress 2s infinite;
    }

    @keyframes progress {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }

    .message {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.9em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .error-message {
      color: #e74c3c;
      background: rgba(231, 76, 60, 0.1);
      border: 1px solid rgba(231, 76, 60, 0.2);
    }

    .success-message {
      color: #2ecc71;
      background: rgba(46, 204, 113, 0.1);
      border: 1px solid rgba(46, 204, 113, 0.2);
    }
  `

  async loadThemes() {
    try {
      this.isLoadingThemes = true;
      this.errorMessage = '';
      this.successMessage = '';

      if (cachedThemes.get() && cachedThemes.get().length > 0) {
        if (window.dev_mode) console.log('Utilisation des thèmes en cache mémoire:', cachedThemes.get());
        this.allThemes = cachedThemes.get();
        this.scrollToOpenModule();
        return;
      }

      const themes = await findAllThemes();
      if (window.dev_mode) console.log('Thèmes récupérés:', themes);
      this.allThemes = themes;

      if (themes && themes.length > 0) {
        cachedThemes.set(themes);
        this.successMessage = `${themes.length} thèmes chargés`;
      } else if (!navigator.onLine) {
        this.errorMessage = 'Mode hors ligne - aucun thème disponible dans le cache local';
      } else {
        this.errorMessage = 'Aucun thème disponible';
      }

      this.scrollToOpenModule();
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes:', error);
      if (!navigator.onLine) {
        this.errorMessage = 'Mode hors ligne - impossible de charger les thèmes.';
      } else {
        this.errorMessage = `Erreur lors du chargement des thèmes: ${error.message}`;
      }
    } finally {
      this.isLoadingThemes = false;
    }
  }

  scrollToOpenModule() {
    setTimeout(() => {
      const currentSequence = selectedSequence.get();
      if (currentSequence) {
        const moduleElement = this.shadowRoot?.querySelector(`module-elem[title="${currentSequence}"]`);
        if (moduleElement) {
          moduleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }

  setButtonState(selector: string, loading: boolean, disabled: boolean) {
    const button = this.shadowRoot?.querySelector(selector) as any;
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
    if (this.isDownloading) {
      console.warn('[DOWNLOAD] Téléchargement déjà en cours');
      return;
    }

    try {
      this.isDownloading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { setSyncProgress, setSyncCompleted } = await import('../../store/syncState.js');
      setSyncProgress(0);

      const files = await findAllFiles();
      if (files && files.length > 0) {
        await downloadFileZip('tous_les_fichiers.zip', files.map(file => file.id));
        this.successMessage = '✅ Téléchargement terminé';
        setSyncCompleted();
      } else {
        this.errorMessage = 'Aucun fichier disponible pour le téléchargement';
        setSyncCompleted();
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement des fichiers:', error);
      this.errorMessage = `Erreur lors du téléchargement: ${error.message}`;
    } finally {
      this.isDownloading = false;
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.throttledLoadThemes();
    this.addEventListener('state-changed', this.scrollToOpenModule);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('state-changed', this.scrollToOpenModule);
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">📁 Ouvrir un fichier</h2>

        <div slot="body" class="popup-content">

          ${this.isLoadingThemes || (this.allThemes.length === 0 && !this.errorMessage) ?
        html`
            <div class="loading-skeleton" role="status" aria-live="polite">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
            </div>
          ` :
        html`
            <div class="theme-list" role="list" aria-label="Thèmes disponibles">
              ${this.allThemes.map(theme => html`<theme-elem role="listitem" .theme=${theme}></theme-elem>`)}
            </div>
          `
      }

          <div class="main-action">
            <color-button
              @click="${this.debouncedDownload}"
              ?disabled="${this.isDownloading}"
              aria-label="Télécharger tous les fichiers">
              ${this.isDownloading ? '⬇️ Téléchargement...' : '💾 Télécharger tous les fichiers'}
            </color-button>
          </div>

          ${this.isDownloading ? html`<div class="loading-indicator"></div>` : ''}

          ${this.errorMessage ? html`
            <div class="message error-message">
              <span>⚠️</span>
              <span>${this.errorMessage}</span>
            </div>
          ` : ''}

          ${this.successMessage ? html`
            <div class="message success-message">
              <span>${this.successMessage}</span>
            </div>
          ` : ''}

          <div class="sync-status">
            <div class="sync-info">
              <div class="status-dot ${syncInProgress.value ? 'warning' : 'success'}"></div>
              <span>Sync: ${syncInProgress.value ? 'En cours' : 'OK'}</span>
            </div>
            <button
              class="settings-button"
              @click="${this.openSyncSettings}"
              title="Paramètres de synchronisation"
              aria-label="Ouvrir les paramètres de synchronisation">
              ⚙️
            </button>
          </div>
        </div>
      </template-popup>

      ${this.showSyncSettings ? html`<sync-settings-popup @closed="${this.closeSyncSettings}"></sync-settings-popup>` : ''}
    `;
  }
}