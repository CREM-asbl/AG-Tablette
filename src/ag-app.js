import { app, setState } from './Core/App';
import './Core/Manifest';
import { LitElement, html } from 'lit';
import './auto-launch';
import './backbutton-manager';
import { openFileFromId } from './Firebase/firebase-init';
// import { uniqId } from './Core/Tools/general';
import { loadEnvironnement } from './Core/Environments/Environment';

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
    let activityId = parsedUrl.searchParams.get("activityId");
    if (activityId)
      openFileFromId(activityId);
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
    if (app?.short_name == "AG mobile" && (e != "Grandeurs" && e != "Cubes"))
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
}
customElements.define('ag-app', AgApp);
