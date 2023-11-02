import { html, LitElement } from 'lit';
import './auto-launch';
import './backbutton-manager';
import { app, setState } from './Core/App';
import { loadEnvironnement } from './Core/Environment';
import './Core/Manifest';
import { downloadFileZip, openFileFromServer } from './Firebase/firebase-init';

export class App extends LitElement {
  static get properties() {
    return {
      environnement_selected: { type: Boolean },
      appLoading: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.appLoading = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setState();
    window.addEventListener('state-changed', () => this.setState());
    this.parseURL();
  }

  parseURL() {
    let parsedUrl = new URL(window.location.href);
    let part = parsedUrl.searchParams.get("interface");
    if (['Grandeurs', 'Tangram', 'Cubes', 'Geometrie'].includes(part)) {
      this.openEnv(part);
      return;
    }
    let activityName = parsedUrl.searchParams.get("activityName");
    if (activityName)
      openFileFromServer(activityName);
    let generateSVGs = parsedUrl.searchParams.get("generateSVGs");
    if (generateSVGs)
      AgApp.generateSVGs(generateSVGs);
  }

  render() {
    let toRender = [];
    if (this.appLoading) {
      import('./loading-elem');
      toRender.push(html`<loading-elem></loading-elem>`);
    }
    if (this.environnement_selected) {
      history.pushState({}, "main page");
      const AGmainLoader = import('./ag-main');
      toRender.push(html`<ag-main></ag-main>`);
    } else if (!this.appLoading) {
      import('./ag-environnements');
      return html` <ag-environnements></ag-environnements> `;
    }
    return toRender;
  }

  async openEnv(e) {
    setState({ appLoading: true });
    setState({ environment: await loadEnvironnement(e) });
  }

  setState() {
    if (app.appLoading) {
      this.appLoading = true;
    }
    this.environnement_selected = app.environment !== undefined;
  }

  static async generateSVGs() {
    let listImage = await fetch('listImages.txt');
    listImage = await listImage.text();
    listImage = listImage.split('\n').filter(name => name != '');

    let files = listImage.map(image => fetch(image));

    downloadFileZip("IconesAGm.zip", files);
  }
}
customElements.define('ag-app', App);
