import { SignalWatcher } from '@lit-labs/signals';
import { css, html, LitElement } from 'lit';
import { loadEnvironnement } from '../controllers/Core/Environment';
import '../layouts/ag-main';
import { initBugReporting } from '../services/bug-report.service';
import { appActions, appLoading, currentEnvironment } from '../store/appState';
import './ag-environnements';
import './tool-ui-container';

/**
 * fix device-height != screen-height on pwa
 **/
if (document.body.clientHeight > screen.height) {
  document.body.style.height = `${screen.height}px`;
}

export class App extends SignalWatcher(LitElement) {
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
    const parsedUrl = new URL(window.location.href);
    const part = parsedUrl.searchParams.get('interface');

    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      loadEnvironnement(part);
      return;
    }
    const activityName = parsedUrl.searchParams.get('activityName');
    if (activityName) {
      import('../firebase/firebase-init').then((module) => {
        module.openFileFromServer(activityName);
      });
    }
  }

  render() {
    const isLoading = appLoading.get();
    const environmentSelected = currentEnvironment.get() !== null;

    if (environmentSelected) {
      history.pushState({}, 'main page');
      appActions.setLoading(false);
      return html`<ag-main></ag-main>`;
    } else if (!isLoading) {
      return html`<ag-environnements></ag-environnements>`;
    }
    if (isLoading) {
      import('./loading-elem');
      return html`<loading-elem></loading-elem>`;
    }
  }
}
customElements.define('ag-app', App);
