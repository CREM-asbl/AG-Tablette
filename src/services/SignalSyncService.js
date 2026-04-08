import { appActions } from '../store/appState';

/**
 * Service de synchronisation entre le système d'événements legacy (Workspace)
 * et le nouveau store basé sur Signal (appState).
 * Agit comme un "Shadow State" pour faciliter la migration progressive.
 */
export class SignalSyncService {
  constructor() {
    this.listeners = [];
    this.app = null;
  }

  init(appInstance) {
    this.app = appInstance;
    const app = this.app;

    // Synchronisation du viewport (Zoom/Pan)
    this.addListener('refresh', () => this.syncViewport());
    this.addListener('refreshUpper', () => this.syncViewport());

    // Synchronisation du nom de fichier
    this.addListener('file-opened', (e) => {
      if (e.detail && e.detail.file) {
        appActions.setFilename(e.detail.file.name);
      }
    });

    // Synchronisation initiale
    this.syncViewport();

    if (import.meta.env.DEV) {
      console.log('[SignalSyncService] Initialized - Shadow State active (pruned)');
    }
  }

  syncViewport() {
    if (this.app && this.app.workspace) {
      appActions.setViewport({
        zoom: this.app.workspace.zoomLevel,
        offsetX: this.app.workspace.translateOffset.x,
        offsetY: this.app.workspace.translateOffset.y,
      });
    }
  }

  addListener(event, callback) {
    window.addEventListener(event, callback);
    this.listeners.push({ event, callback });
  }

  destroy() {
    this.listeners.forEach(({ event, callback }) => {
      window.removeEventListener(event, callback);
    });
    this.listeners = [];
  }
}

export const signalSyncService = new SignalSyncService();
