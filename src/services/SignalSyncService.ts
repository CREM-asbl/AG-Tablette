import { appActions, viewport } from '../store/appState';

/**
 * Interface minimale pour le moteur legacy (App.js / Workspace.js)
 */
interface LegacyWorkspace {
  zoomLevel: number;
  translateOffset: {
    x: number;
    y: number;
  };
}

interface LegacyApp {
  workspace: LegacyWorkspace;
}

/**
 * Service de synchronisation entre le système d'événements legacy (Workspace)
 * et le nouveau store basé sur Signal (appState).
 * Agit comme un "Shadow State" pour faciliter la migration progressive.
 */
export class SignalSyncService {
  private listeners: Array<{ event: string; callback: EventListener }> = [];
  private app: LegacyApp | null = null;

  /**
   * Initialise le service avec l'instance de l'application legacy
   * @param appInstance - L'instance globale de l'application (moteur legacy)
   */
  public init(appInstance: LegacyApp): void {
    this.app = appInstance;

    // Synchronisation du viewport (Zoom/Pan)
    this.addListener('refresh', () => this.syncViewport());
    this.addListener('refreshUpper', () => this.syncViewport());

    // Synchronisation du nom de fichier
    this.addListener('file-opened', (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.file) {
        appActions.setFilename(customEvent.detail.file.name);
      }
    });

    // Synchronisation initiale
    this.syncViewport();

    if (import.meta.env.DEV) {
      console.log('[SignalSyncService] Initialized - Shadow State active (TS)');
    }
  }

  /**
   * Synchronise les données du viewport vers le store de signaux
   */
  public syncViewport(): void {
    if (this.app && this.app.workspace) {
      const newZoom = this.app.workspace.zoomLevel;
      const newOffsetX = this.app.workspace.translateOffset.x;
      const newOffsetY = this.app.workspace.translateOffset.y;
      const current = viewport.get();
      if (
        current.zoom !== newZoom ||
        current.offsetX !== newOffsetX ||
        current.offsetY !== newOffsetY
      ) {
        appActions.setViewport({ zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY });
      }
    }
  }

  /**
   * Ajoute un écouteur d'événement et le suit pour le nettoyage
   */
  private addListener(event: string, callback: EventListener): void {
    window.addEventListener(event, callback);
    this.listeners.push({ event, callback });
  }

  /**
   * Nettoie tous les écouteurs d'événements
   */
  public destroy(): void {
    this.listeners.forEach(({ event, callback }) => {
      window.removeEventListener(event, callback);
    });
    this.listeners = [];
    this.app = null;
  }
}

export const signalSyncService = new SignalSyncService();
