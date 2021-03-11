import { app } from './Core/App';
import { LitElement, html } from 'lit-element';
import './auto-launch'

import { openFileFromId } from './Core/Database/requests';

class AgApp extends LitElement {
  static get properties() {
    return {
      environnement_selected: { type: Boolean },
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
    let activityId = parsedUrl.searchParams.get("activityId");
    if (activityId)
      openFileFromId(activityId);
  }

  render() {
    if (this.environnement_selected) {
      import('./ag-main');
      return html` <ag-main></ag-main> `;
    } else {
      import('./ag-environnements');
      return html` <ag-environnements></ag-environnements> `;
    }
  }

  setState() {
    this.environnement_selected = app.environment !== undefined;
  }
}
customElements.define('ag-app', AgApp);
