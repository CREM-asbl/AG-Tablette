import { html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import '../controllers/auto-launch';
import '../controllers/backbutton-manager';
import { app } from '../controllers/Core/App';
import { loadEnvironnement } from '../controllers/Core/Environment';
import '../controllers/Core/Manifest';
import { appLoading, currentEnvironment } from '../store/appState';
// import { openFileFromServer } from '../firebase/firebase-init'; // Moved to dynamic import

/**
 * fix device-height != screen-height on pwa
 **/
if (document.body.clientHeight > screen.height) {
  document.body.style.height = `${screen.height}px`;
}

export class App extends SignalWatcher(LitElement) {

  constructor() {
    super();
    this.parseURL();
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
      import('@layouts/ag-main');
      app.appLoading = false;
      return html`<ag-main></ag-main>`;
    } else if (!isLoading) {
      import('./ag-environnements');
      return html`<ag-environnements></ag-environnements>`;
    }
    if (isLoading) {
      import('./loading-elem');
      return html`<loading-elem></loading-elem>`;
    }
  }
}
customElements.define('ag-app', App);
