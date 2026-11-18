import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { loadEnvironnement } from '../controllers/Core/Environment';
import '../layouts/ag-main';
import { initBugReporting } from '../services/bug-report.service';
import { appActions, appLoading, currentEnvironment } from '../store/appState';
import { selectedModule, selectedTheme } from '@store/notions';
import './ag-environnements';
import './tool-ui-container';

/**
 * fix device-height != screen-height on pwa
 **/
if (document.body.clientHeight > screen.height) {
  document.body.style.height = `${screen.height}px`;
}

export class App extends SignalWatcher(LitElement) {
  private _environmentTransitioned = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.initCoreServices();
    this.parseURL();
  }

  bootstrapControllerSideEffects() {
    void Promise.allSettled([
      import('../controllers/auto-launch'),
      import('../controllers/backbutton-manager'),
      import('../controllers/Core/Manifest'),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.warn('Erreur lors du bootstrap des controllers:', result.reason);
        }
      });
    });
  }

  initCoreServices() {
    const globalWindow = window as Window & {
      __agCoreServicesInitialized?: boolean;
    };

    if (globalWindow.__agCoreServicesInitialized) return;
    globalWindow.__agCoreServicesInitialized = true;

    initBugReporting({
      mode: import.meta.env.DEV ? 'off' : 'silent',
      sampleRate: 0.2,
      maxPerSession: 10,
      minIntervalMs: 5000,
    });

    // Initialisation du service de synchronisation Signal
    // On importe dynamiquement 'app' pour ne pas polluer l'UI avec le moteur legacy
    Promise.all([
      import('../services/SignalSyncService'),
      import('../controllers/Core/App')
    ]).then(([{ signalSyncService }, { app }]) => {
      signalSyncService.init(app);
    });

    this.bootstrapControllerSideEffects();
  }

  async parseURL() {
    const globalWindow = window as Window & { __agOpenHandled?: boolean };
    if (globalWindow.__agOpenHandled) return;
    globalWindow.__agOpenHandled = true;

    const notify = (message: string) => {
      window.dispatchEvent(
        new CustomEvent('show-notif', { detail: { message } }),
      );
    };

    const parsedUrl = new URL(window.location.href);
    const part = parsedUrl.searchParams.get('interface');

    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      loadEnvironnement(part);
      return;
    }

    const { parseSlug } = await import('../services/site-slug-resolver');
    const slug = parseSlug(parsedUrl.pathname, parsedUrl.search);
    if (slug) {
      try {
        const { resolveBySiteSlug } = await import('../services/site-slug-resolver');
        const result = await resolveBySiteSlug(slug);
        if (!result) {
          notify('Lien inconnu — https://ag.crem.be');
          return;
        }
        if (result.kind === 'file') {
          if (!result.fileId) {
            notify('Lien inconnu — https://ag.crem.be');
            return;
          }
          try {
            const { openFileFromServer } = await import('@db/firebase-init');
            await openFileFromServer(result.fileId);
          } catch (error) {
            notify(
              `Erreur lors du chargement: ${(error as Error)?.message ?? error}`,
            );
          }
        } else if (result.kind === 'module') {
          if (result.themeId && selectedTheme.get() !== result.themeId) {
            selectedTheme.set(result.themeId);
          }
          if (result.moduleId && selectedModule.get() !== result.moduleId) {
            selectedModule.set(result.moduleId);
          }
          try {
            const firebase = await import('@db/firebase-init');
            if (result.moduleId) {
              const files = await firebase.getFilesDocFromModule(
                firebase.getModuleDocFromModuleName(result.moduleId),
              );
              const environment = files?.find(
                (file: any) => file?.environment,
              )?.environment;
              if (environment) {
                await loadEnvironnement(environment);
              } else {
                notify('Module ouvert — environnement introuvable');
              }
            }
          } catch (error) {
            notify(
              `Erreur lors du chargement: ${(error as Error)?.message ?? error}`,
            );
          }
        }
      } catch (error) {
        notify(
          `Erreur lors du chargement: ${(error as Error)?.message ?? error}`,
        );
      }
      return;
    }

    const activityName = parsedUrl.searchParams.get('activityName');
    if (activityName) {
      try {
        const { openFileFromServer } = await import('@db/firebase-init');
        await openFileFromServer(activityName);
      } catch (error) {
        notify(
          `Erreur lors du chargement: ${(error as Error)?.message ?? error}`,
        );
      }
    }
  }

  render() {
    const isLoading = appLoading.get();
    const environmentSelected = currentEnvironment.get() !== null;

    if (environmentSelected) {
      return html`<ag-main></ag-main>`;
    } else if (!isLoading) {
      return html`<ag-environnements></ag-environnements>`;
    }
    if (isLoading) {
      import('./loading-elem');
      return html`<loading-elem></loading-elem>`;
    }
  }

  updated() {
    const environmentSelected = currentEnvironment.get() !== null;
    if (environmentSelected && !this._environmentTransitioned) {
      this._environmentTransitioned = true;
      history.pushState({}, 'main page');
      appActions.setLoading(false);
    } else if (!environmentSelected) {
      this._environmentTransitioned = false;
    }
  }
}
customElements.define('ag-app', App);
