import { LitElement, html } from 'lit-element';
import { app } from './js/App';

class AgApp extends LitElement {
  static get properties() {
    return {
      environnement_selected: { type: Boolean },
    };
  }

  constructor() {
    super();
    window.addEventListener('state-changed', () => {
      this.environnement_selected = app.environnement ? true : false;
    });
  }

  render() {
    if (this.environnement_selected) {
      import('./ag-tablette-app');
      return html`
        <ag-tablette-app></ag-tablette-app>
      `;
    } else {
      import('./ag-environnements');
      return html`
        <ag-environnements></ag-environnements>
      `;
    }
  }
}
customElements.define('ag-app', AgApp);
