import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';
import { goToHomePage } from '../Core/Tools/general';
import './save-warning';
import { TemplatePopup } from './template-popup';

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
          <color-button @click="${this.close}" innerText="Annuler"></color-button>
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
