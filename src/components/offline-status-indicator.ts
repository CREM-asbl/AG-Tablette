// Composant pour afficher le statut de connexion et de synchronisation
// Composant offline-status-indicator supprimé
  static styles = css`
    :host {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 1000;
      font-family: system-ui, sans-serif;
    }

    .status-indicator {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .online {
      background-color: #4caf50;
    }

    .offline {
      background-color: #f44336;
    }

    .syncing {
      background-color: #ff9800;
    }

    .sync-icon {
      width: 16px;
      height: 16px;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .status-text {
      font-weight: 500;
    }
  `;

constructor() {
  super();
  this.isOnline = navigator.onLine;
  this.isSyncing = false;
  this.lastSyncTime = null;

  // Écouter les changements de connexion
  window.addEventListener('online', () => {
    this.isOnline = true;
  });

  window.addEventListener('offline', () => {
    this.isOnline = false;
  });

  // Écouter la synchronisation
  window.addEventListener('activities-synced', (event) => {
    this.lastSyncTime = new Date().toLocaleTimeString();
    this.isSyncing = false;
  });

  // Vérifier périodiquement le statut de synchronisation
  setInterval(() => {
    this.isSyncing = isSyncInProgress();
  }, 1000);
}

render() {
  if (this.isSyncing) {
    return html`
        <div class="status-indicator syncing">
          <div class="sync-icon">⟳</div>
          <span class="status-text">Synchronisation...</span>
        </div>
      `;
  }

  if (!this.isOnline) {
    return html`
        <div class="status-indicator offline">
          <span>📴</span>
          <span class="status-text">Mode hors ligne</span>
        </div>
      `;
  }

  return html`
      <div class="status-indicator online">
        <span>📶</span>
        <span class="status-text">En ligne</span>
        ${this.lastSyncTime ? html`
          <span style="font-size: 12px; opacity: 0.9;">
            Sync: ${this.lastSyncTime}
          </span>
        ` : ''}
      </div>
    `;
}
}

customElements.define('offline-status-indicator.js', OfflineStatusIndicator);