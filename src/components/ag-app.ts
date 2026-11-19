import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { loadEnvironnement } from '../controllers/Core/Environment';
import '../layouts/ag-main';
import '../components/popups/notification';
import { initBugReporting } from '../services/bug-report.service';
import {
  consumePendingOpenNotice,
  isIndexPath,
  redirectToIndexWithNotice,
  UNKNOWN_LINK_MESSAGE,
} from '../services/open-redirect';
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

    // Deep-link (site slug / activityName) : éviter le flash de l'écran d'accueil
    // pendant la résolution asynchrone en affichant l'écran de chargement.
    const hasDeepLinkOpen =
      parsedUrl.searchParams.has('activityName') ||
      parsedUrl.searchParams.has('slug') ||
      /^\/open(\/|$)/.test(parsedUrl.pathname);
    if (hasDeepLinkOpen) {
      appActions.setLoading(true);
    }

    if (isIndexPath(parsedUrl.pathname)) {
      const pending = consumePendingOpenNotice();
      if (pending) {
        appActions.addNotification({ message: pending, type: 'error' });
        window.setTimeout(() => notify(pending), 500);
      }
    }

    const part = parsedUrl.searchParams.get('interface');

    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      loadEnvironnement(part);
      return;
    }

    const { parseSlug } = await import('../services/site-slug-resolver');
    const slug = parseSlug(parsedUrl.pathname, parsedUrl.search);
    if (slug) {
      appActions.setLoading(true);
      try {
        const { resolveBySiteSlug } = await import('../services/site-slug-resolver');
        const result = await resolveBySiteSlug(slug);
        if (!result) {
          redirectToIndexWithNotice(UNKNOWN_LINK_MESSAGE);
          return;
        }
        if (result.kind === 'file') {
          if (!result.fileId) {
            redirectToIndexWithNotice(UNKNOWN_LINK_MESSAGE);
            return;
          }
          try {
            const { openFileFromServer } = await import('@db/firebase-init');
            await openFileFromServer(result.fileId);
          } catch (error) {
            const message = `Erreur lors du chargement: ${(error as Error)?.message ?? error}`;
            redirectToIndexWithNotice(message);
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
                const message = 'Module ouvert — environnement introuvable';
                redirectToIndexWithNotice(message);
              }
            }
          } catch (error) {
            const message = `Erreur lors du chargement: ${(error as Error)?.message ?? error}`;
            redirectToIndexWithNotice(message);
          }
        }
      } catch (error) {
        const message = `Erreur lors du chargement: ${(error as Error)?.message ?? error}`;
        redirectToIndexWithNotice(message);
      }
      return;
    }

    const activityName = parsedUrl.searchParams.get('activityName');
    if (activityName) {
      appActions.setLoading(true);
      try {
        const { openFileFromServer } = await import('@db/firebase-init');
        await openFileFromServer(activityName);
      } catch (error) {
        const message = `Erreur lors du chargement: ${(error as Error)?.message ?? error}`;
        redirectToIndexWithNotice(message);
      }
    }
  }

  render() {
    const isLoading = appLoading.get();
    const environmentSelected = currentEnvironment.get() !== null;

    if (environmentSelected) {
      return html`<ag-main></ag-main>`;
    } else if (!isLoading) {
      return html`<ag-environnements></ag-environnements>
        <notif-center></notif-center>`;
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
