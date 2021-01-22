import { app } from './Core/App';
import { LitElement, html } from 'lit-element';

class AgApp extends LitElement {
  static get properties() {
    return {
      environnement_selected: { type: Boolean },
    };
  }

  firstUpdated() {
    window.addEventListener('env-created', () => {
      this.environnement_selected = app.environment != undefined;
    });
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
}
customElements.define('ag-app', AgApp);
