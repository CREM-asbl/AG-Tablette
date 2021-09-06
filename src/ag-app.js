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
      environmentLoading: { type: Boolean },
    };
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
    if (part) {
      this.openEnv(part);
      return;
    }
    let activityId = parsedUrl.searchParams.get("activityId");
    if (activityId)
      openFileFromId(activityId);
  }

  render() {
    if (this.environnement_selected) {
      history.pushState({}, "main page");
      import('./ag-main');
      return html` <ag-main></ag-main> `;
    } else if (!this.environmentLoading) {
      import('./ag-environnements');
      return html` <ag-environnements></ag-environnements> `;
    } else {
      return html`
        <div>
          Loading
        </div>
      `;
    }
  }

  async openEnv(e) {
    if (app?.short_name == "AG Mobile" && e != "Grandeurs")
      return;
    this.setState({ environmentLoading: true });
    setState({ environment: await loadEnvironnement(e) });
  }

  setState() {
    this.environnement_selected = app.environment !== undefined;
    this.environmentLoading = app.environmentLoading;
  }
}
customElements.define('ag-app', AgApp);
