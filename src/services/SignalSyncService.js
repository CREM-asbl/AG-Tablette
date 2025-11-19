import { appActions, filename, helpSelected, historyState } from '../store/appState';

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

    // Synchronisation de l'outil actif
    this.addListener('tool-changed', () => {
      if (app.tool) {
        appActions.setActiveTool(app.tool.name);
        appActions.setCurrentStep(app.tool.currentStep);
      } else {
        appActions.setActiveTool(null);
      }
    });

    this.addListener('tool-updated', () => {
      if (app.tool) {
        appActions.setToolState({
          currentStep: app.tool.currentStep,
          // Ajouter d'autres propriétés d'état d'outil si nécessaire
        });
        appActions.setCurrentStep(app.tool.currentStep);
      }
    });

    // Synchronisation du viewport (Zoom/Pan)
    this.addListener('refresh', () => this.syncViewport());
    this.addListener('refreshUpper', () => this.syncViewport());

    // Synchronisation des settings
    this.addListener('settings-changed', () => {
      appActions.updateSettings(app.settings);
    });

    // Synchronisation de l'historique
    this.addListener('history-changed', () => {
      appActions.setHistoryState({
        canUndo: app.history.index !== -1,
        canRedo: app.history.index < app.history.steps.length - 1,
        size: app.history.steps.length,
        currentIndex: app.history.index,
      });
    });

    // Synchronisation du nom de fichier
    this.addListener('file-opened', (e) => {
      if (e.detail && e.detail.file) {
        appActions.setFilename(e.detail.file.name);
      }
    });

    this.addListener('app-started', () => {
      appActions.setStarted(true);
    });

    // Synchronisation initiale
    this.syncViewport();
    if (app.tool) {
      appActions.setActiveTool(app.tool.name);
    }
    appActions.updateSettings(app.settings);

    console.log('[SignalSyncService] Initialized - Shadow State active');
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
