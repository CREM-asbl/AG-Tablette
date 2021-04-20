import { LitElement, html } from 'lit-element';
import { TemplatePopup } from './template-popup';

class NewPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
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
        <h2 slot="title">Nouvelle fenêtre</h2>
        <div slot="body" id="body">
          <p>
            Voulez-vous vraiment une nouvelle fenêtre ? <br />
            Attention votre travail actuel sera perdu !
          </p>
        </div>

        <div slot="footer">
          <button @click="${this.close}">Annuler</button>
          <button id="focus" @click="${this.confirm}">OK</button>
        </div>
      </template-popup>
    `;
  }

  confirm() {
    window.dispatchEvent(new CustomEvent('new-window'));
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('new-popup', NewPopup);
