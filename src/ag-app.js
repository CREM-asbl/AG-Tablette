import { downloadZip } from "https://cdn.jsdelivr.net/npm/client-zip/index.js";
import { html, LitElement } from 'lit';
import './auto-launch';
import './backbutton-manager';
import { app, setState } from './Core/App';
import { loadEnvironnement } from './Core/Environments/Environment';
import './Core/Manifest';
import { openFileFromServer } from './Firebase/firebase-init';

class AgApp extends LitElement {
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
      // openFileFromId(activityId);
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
      toRender.push( html`<ag-main></ag-main>`);
    } else if (!this.appLoading) {
      import('./ag-environnements');
      return html` <ag-environnements></ag-environnements> `;
    }
    return toRender;
  }

  async openEnv(e) {
    if (app?.short_name == "AG mobile" && e != "Grandeurs")
      return;
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

    AgApp.downloadTestZip(files);
  }

  static async downloadTestZip(files) {
    const blob = await downloadZip(files).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "IconesAGm.zip";
    link.click();
    link.remove();
  }
}
customElements.define('ag-app', AgApp);
