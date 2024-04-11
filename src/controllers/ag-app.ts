import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { openFileFromServer } from '../firebase/firebase-init';
import './auto-launch';
import './backbutton-manager';
import { app, setState } from './Core/App';
import { loadEnvironnement } from './Core/Environment';
import './Core/Manifest';

/**
 * fix device-height != screen-height on pwa
 **/
if (document.body.clientHeight > screen.height) {
  document.body.style.height = `${screen.height}px`
}

export class App extends LitElement {
  @property({ type: Boolean }) appLoading
  @property({ type: Boolean }) environnement_selected

  connectedCallback() {
    super.connectedCallback();
    this.setState();
    window.addEventListener('state-changed', () => this.setState());
    this.parseURL();
  }

  parseURL() {
    console.log('parsedUrl')
    let parsedUrl = new URL(window.location.href);
    let part = parsedUrl.searchParams.get("interface");

    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      this.openEnv(part);
      return;
    }
    let activityName = parsedUrl.searchParams.get("activityName");
    if (activityName)
      openFileFromServer(activityName);
  }

  render() {
    if (this.environnement_selected) {
      history.pushState({}, "main page");
      const AGmainLoader = import('./ag-main');
      app.appLoading = false
      return html`<ag-main></ag-main>`;
    } else if (!this.appLoading) {
      import('./ag-environnements');
      return html`<ag-environnements></ag-environnements>`;
    }
    if (this.appLoading) {
      import('../components/loading-elem');
      return html`<loading-elem></loading-elem>`;
    }
  }

  async openEnv(e) {
    setState({ appLoading: true, environment: await loadEnvironnement(e) });
  }

  setState() {
    this.appLoading = app.appLoading;
    this.environnement_selected = app.environment !== undefined;
  }
}
customElements.define('ag-app', App);