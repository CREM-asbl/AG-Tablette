import { LitElement, html, css } from 'lit';
import { TemplatePopup } from './template-popup';
import { goToHomePage } from '../Core/Tools/general';

class HomePopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        p {
          text-align: center;
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
          ${'Nouvelle fenêtre'}
        </h2>
        <div slot="body" id="body">
          <p>
            Voulez-vous partir sans enregistrer votre travail ? <br />
            Attention votre travail actuel sera perdu !
          </p>
        </div>

        <div slot="footer">
          <button @click="${this.goToHomePage}">Page d'accueil</button>
          <button @click="${this.newWindow}">Espace de travail vide</button>
          <button id="focus" @click="${this.close}">Annuler</button>
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
