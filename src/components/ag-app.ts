import { SignalWatcher } from '@lit-labs/signals';
import { html, LitElement, css } from 'lit';
import '../controllers/auto-launch';
import '../controllers/backbutton-manager';
import { app } from '../controllers/Core/App';
import { loadEnvironnement } from '../controllers/Core/Environment';
import '../controllers/Core/Manifest';
import { initBugReporting } from '../services/bug-report.service';
import { signalSyncService } from '../services/SignalSyncService';
import { appLoading, currentEnvironment } from '../store/appState';
import './tool-ui-container';
import './ag-environnements';
import '../layouts/ag-main';

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
      app.appLoading = false;
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
