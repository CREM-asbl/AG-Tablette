import '@components/color-button';
import '@components/popups/template-popup';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getLastSyncInfo, smartSync } from '../../services/activity-sync.js';
import { cachedThemes } from '../../store/notions';
import { syncInProgress, syncProgress } from '../../store/syncState.js';
import { debounce } from '../../utils/signal-observer.js';

/**
 * Service pour les opérations IndexedDB
 * Sépare la logique métier de la présentation
 */
class CacheService {
  /**
   * Vide le cache IndexedDB
   * @returns {Promise<void>}
   */
  static async clearCache(): Promise<void> {
    try {
      const db = await window.indexedDB.open('agTabletteDB');
      const tx = db.result.transaction(['activities'], 'readwrite');
      await tx.objectStore('activities').clear();
      console.log('[CACHE] Cache local vidé avec succès');
    } catch (error) {
      console.error('[CACHE] Erreur lors du vidage du cache:', error);
      throw new Error(`Impossible de vider le cache: ${error.message}`);
    }
  }

  /**
   * Vérifie la disponibilité du cache
   * @returns {Promise<boolean>}
   */
  static async isCacheAvailable(): Promise<boolean> {
    try {
      await window.indexedDB.open('agTabletteDB');
      return true;
    } catch {
      return false;
    }
  }
}

@customElement('sync-settings-popup')
class SyncSettingsPopup extends LitElement {
  @property({ type: String }) errorMessage = '';
  @property({ type: String }) successMessage = '';
  @property({ type: Object }) lastSyncInfo = null;
  @property({ type: Boolean }) showClearCacheConfirmation = false;
  @property({ type: Boolean }) isSyncing = false;

  private debouncedForceSync = debounce(this.forceSync.bind(this), 1000);
  private debouncedClearCache = debounce(this.clearCache.bind(this), 300);

  constructor() {
    super();
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
  }

  static styles = css`
    .popup-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      max-width: 500px;
      padding: 16px;
        color: var(--theme-text-color, #222);
    }

    .section {
      background: var(--theme-color-soft, #e6f9e6);
      border-radius: 14px;
      padding: 22px 20px 18px 20px;
      border: 1.5px solid var(--theme-color, #b2e6b2);
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 1.1em;
      font-weight: 600;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--theme-text-color, #222);
      background: none;
    }

    .sync-details {
          color: var(--theme-text-color, #222);
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
      font-size: 0.9em;
    }

    .detail-item {
      padding: 8px 12px;
      background: var(--theme-color-soft, rgba(255,255,255,0.05));
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .detail-label {
      font-weight: 600;
      color: var(--theme-label-color, #2e6c2e);
      font-size: 0.92em;
      margin-bottom: 2px;
    }

    .detail-value {
      color: var(--theme-value-color, #1a3a1a);
      font-weight: 500;
      font-size: 1.05em;
    }

    .status-indicator {
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--theme-color-soft, rgba(255,255,255,0.05));
      border-radius: 8px;
      margin-bottom: 16px;
      color: var(--theme-text-color, #222);
    }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-dot.success {
      background: #4CAF50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
    }

    .status-dot.warning {
      background: #FF9800;
      box-shadow: 0 0 8px rgba(255, 152, 0, 0.4);
      animation: pulse 2s infinite;
    }

    .status-dot.error {
      background: #F44336;
      box-shadow: 0 0 8px rgba(244, 67, 54, 0.4);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: none;
      box-shadow: none;
    }

   .primary-action {
      grid-column: 1 / -1;
    }

    .primary-action color-button {
      width: 100%;
      min-height: 48px;
      font-weight: 600;
      border-radius: 8px;
      background: var(--theme-color, #4CAF50);
      color: #fff;
      border: none;
      box-shadow: 0 2px 8px rgba(44,62,80,0.10);
      transition: box-shadow 0.2s, background 0.2s;
    }
    .primary-action color-button:hover {
      background: var(--theme-color-dark, #388e3c);
      box-shadow: 0 4px 16px rgba(44,62,80,0.16);
    }
    .cache-explanation {
      color: var(--theme-text-color, #222);
      margin-bottom: 16px;
      font-size: 0.92em;
      font-weight: 500;
    }

    .message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9em;
      margin: 8px 0;
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

    .warning-message {
      color: #f39c12;
      background: rgba(243, 156, 18, 0.1);
      border: 1px solid rgba(243, 156, 18, 0.2);
    }

    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .confirmation-dialog {
      background: var(--bg-color, rgba(44, 62, 80, 0.95));
      color: rgba(255, 255, 255, 0.9);
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .confirmation-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      justify-content: center;
    }

    .loading-indicator {
      height: 4px;
      background: linear-gradient(90deg,
        var(--theme-color, #4CAF50) 0%,
        rgba(76, 175, 80, 0.3) 50%,
        var(--theme-color, #4CAF50) 100%);
      border-radius: 2px;
      animation: progress 2s infinite;
      margin: 8px 0;
    }

    @keyframes progress {
      0% { opacity: 0.6; transform: scaleX(0.8); }
      50% { opacity: 1; transform: scaleX(1); }
      100% { opacity: 0.6; transform: scaleX(0.8); }
    }
  `

  async forceSync() {
    try {
      this.isSyncing = true;
      this.errorMessage = '';
      this.successMessage = '';

      const result = await smartSync({ force: true });

      if (result === 'completed') {
        this.successMessage = '🔄 Synchronisation forcée terminée avec succès';
        await this.loadSyncInfo();
      } else if (result === 'recent') {
        this.successMessage = '✅ Synchronisation déjà récente, aucune action nécessaire';
      } else {
        this.errorMessage = 'Erreur lors de la synchronisation forcée';
      }
    } catch (error) {
      this.errorMessage = `Erreur lors de la synchronisation: ${error.message}`;
    } finally {
      this.isSyncing = false;
    }
  }

  showClearCacheDialog() {
    this.showClearCacheConfirmation = true;
  }

  cancelClearCache() {
    this.showClearCacheConfirmation = false;
  }

  async confirmClearCache() {
    this.showClearCacheConfirmation = false;
    await this.clearCache();
  }

  async clearCache() {
    try {
      this.errorMessage = '';
      this.successMessage = '';

      const cacheAvailable = await CacheService.isCacheAvailable();
      if (!cacheAvailable) {
        this.errorMessage = 'Cache non disponible ou déjà vide';
        return;
      }

      await CacheService.clearCache();
      cachedThemes.set([]);

      this.successMessage = '🗑️ Cache local vidé avec succès';
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      this.errorMessage = `Erreur lors du vidage du cache: ${error.message}`;
    }
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">⚙️ Paramètres de synchronisation</h2>
        <div slot="body" class="popup-content">

          <!-- Section Statut de synchronisation -->
          <div class="section">
            <h3 class="section-title">📊 Statut de synchronisation</h3>

            <div class="status-indicator">
               <span>
                ${syncInProgress.value
        ? `🔄 Synchronisation en cours (${Math.min(syncProgress.value ?? 0, 100)}%)`
        : '✅ Synchronisation complète'
      }
              </span>
            </div>

            ${this.lastSyncInfo ? html`
              <div class="sync-details">
                <div class="detail-item">
                  <div class="detail-label">Dernière synchronisation</div>
                  <div class="detail-value">${this.lastSyncInfo.lastSyncDate.toLocaleDateString()} à ${this.lastSyncInfo.lastSyncDate.toLocaleTimeString()}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Statut</div>
                  <div class="detail-value">${this.lastSyncInfo.nextSyncDue ? '⚠️ Sync recommandée' : '✅ À jour'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Activités synchronisées</div>
                  <div class="detail-value">${this.lastSyncInfo.syncedFilesCount}/${this.lastSyncInfo.totalFilesCount}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Thèmes disponibles</div>
                  <div class="detail-value">${this.lastSyncInfo.totalThemesCount} thèmes</div>
                </div>
              </div>
            ` : html`
              <div class="message warning-message">
                <span>⚠️</span>
                <span>Aucune synchronisation détectée</span>
              </div>
            `}

            <div class="primary-action">
              <color-button
                @click="${this.debouncedForceSync}"
                ?disabled="${this.isSyncing || syncInProgress.value}"
              >
                ${this.lastSyncInfo?.nextSyncDue ? '🔄 Synchroniser maintenant' : '🔧 Forcer la synchronisation'}
              </color-button>
            </div>

            ${this.isSyncing ? html`<div class="loading-indicator"></div>` : ''}
          </div>

          <!-- Section Gestion du cache -->
          <div class="section">
            <h3 class="section-title">💾 Gestion du cache local</h3>

            <p style="font-size: 0.9em; color: var(--theme-value-color, #1a3a1a); margin-bottom: 16px;">
              Le cache local améliore les performances en stockant les données.
              Videz-le si vous rencontrez des problèmes ou pour libérer de l'espace.
            </p>

            <div class="actions-grid">
              <color-button @click="${this.showClearCacheDialog}">
                🗑️ Vider le cache
              </color-button>
              <color-button @click="${() => window.location.reload()}">
                🔄 Recharger l'app
              </color-button>
            </div>
          </div>

          <!-- Messages d'état -->
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
        </div>
      </template-popup>

      <!-- Dialog de confirmation pour vider le cache -->
      ${this.showClearCacheConfirmation ? html`
        <div class="confirmation-overlay" @click="${this.cancelClearCache}">
          <div class="confirmation-dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>🗑️ Vider le cache local</h3>
            <p>Cette action supprimera toutes les données mises en cache localement. Vous devrez les retélécharger lors de votre prochaine utilisation.</p>
            <p><strong>Êtes-vous sûr de vouloir continuer ?</strong></p>
            <div class="confirmation-actions">
              <color-button @click="${this.cancelClearCache}" style="background: #6c757d;">
                ❌ Annuler
              </color-button>
              <color-button @click="${this.confirmClearCache}" style="background: #dc3545;">
                🗑️ Vider le cache
              </color-button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}