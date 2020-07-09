import { app } from './Core/App';
import { LitElement, html } from 'lit-element';

class AgApp extends LitElement {
  static get properties() {
    return {
      environnement_selected: { type: Boolean },
    };
  }

  firstUpdated() {
    window.addEventListener(
      'env-created',
      () => (this.environnement_selected = app.environment ? true : false)
    );
  }

  render() {
    if (this.environnement_selected) {
      import('./ag-tablette-app');
      return html` <ag-tablette-app></ag-tablette-app> `;
    } else {
      import('./ag-environnements');
      return html` <ag-environnements></ag-environnements> `;
    }
  }
}
customElements.define('ag-app', AgApp);
