import { app } from './Core/App';
import './Core/Manifest';
import { LitElement, html } from 'lit';
import './auto-launch';
import './backbutton-manager';

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
  }

  render() {
    if (this.environnement_selected) {
      history.pushState({ environment: app.environment.name }, "main page");
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

  setState() {
    this.environnement_selected = app.environment !== undefined;
    this.environmentLoading = app.environmentLoading;
  }
}
customElements.define('ag-app', AgApp);
