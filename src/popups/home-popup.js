import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import { goToHomePage } from '../Core/Tools/general';
import { app } from '../Core/App';
import './save-warning';

class HomePopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        [slot='body'] {
          padding: 0;
        }

        [slot='footer'] {
          padding-top: 16px;
        }
      `,
    ];
  }

  updated() {
    window.setTimeout(
      () => this.shadowRoot.querySelector('#focus').focus(),
      200,
    );
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">
          ${'Accueil'}
        </h2>
        <div slot="body" id="body">
          ${app.stepSinceSave ? html`
            <save-warning></save-warning>
          ` : ''}
        </div>

        <div slot="footer">
          <color-button @click="${this.goToHomePage}" innerText="Page d'accueil"></color-button>
          <color-button @click="${this.newWindow}" innerText="Espace de travail vide"></color-button>
          <color-button id="focus" @click="${this.close}" innerText="Annuler"></color-button>
        </div>
      </template-popup>
    `;
  }

  goToHomePage() {
    goToHomePage();
  }

  newWindow() {
    window.dispatchEvent(new CustomEvent('new-window'));
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('home-popup', HomePopup);
