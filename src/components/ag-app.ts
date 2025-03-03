import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../controllers/auto-launch';
import '../controllers/backbutton-manager';
import { app } from '../controllers/Core/App';
import { loadEnvironnement } from '../controllers/Core/Environment';
import '../controllers/Core/Manifest';
import { openFileFromServer } from '../firebase/firebase-init';

/**
 * fix device-height != screen-height on pwa
 **/
if (document.body.clientHeight > screen.height) {
  document.body.style.height = `${screen.height}px`
}

export class App extends LitElement {

  @property({ type: Boolean }) appLoading
  @property({ type: Boolean }) environnement_selected

  constructor() {
    super()
    this.parseURL()
    this.setState()
  }

  firstUpdated() {
    window.addEventListener('state-changed', () => this.setState());
  }

  async parseURL() {
    let parsedUrl = new URL(window.location.href);
    let part = parsedUrl.searchParams.get("interface");

    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      loadEnvironnement(part);
      return;
    }
    let activityName = parsedUrl.searchParams.get("activityName");
    if (activityName)
      openFileFromServer(activityName);
  }

  render() {
    if (this.environnement_selected) {
      history.pushState({}, "main page");
      import('@layouts/ag-main');
      app.appLoading = false
      return html`<ag-main></ag-main>`;
    } else if (!this.appLoading) {
      import('./ag-environnements');
      return html`<ag-environnements></ag-environnements>`;
    }
    if (this.appLoading) {
      import('./loading-elem');
      return html`<loading-elem></loading-elem>`;
    }
  }

  setState() {
    this.appLoading = app.appLoading;
    this.environnement_selected = app.environment !== undefined;
  }
}
customElements.define('ag-app', App);