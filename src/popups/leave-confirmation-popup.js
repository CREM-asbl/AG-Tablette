import { LitElement, html } from 'lit-element';
import { TemplatePopup } from './template-popup';

class LeaveConfirmationPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  updated() {
    window.setTimeout(() => this.shadowRoot.querySelector("#focus").focus(), 200);
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">${this.actionAfter == 'new' ? 'Nouvelle fenêtre' : 'Ouvrir un fichier'}</h2>
        <div slot="body" id="body">
          <p>
            Voulez-vous partir sans enregistrer votre travail ? <br />
            Attention votre travail actuel sera perdu !
          </p>
        </div>

        <div slot="footer">
          <button @click="${this.confirm}">Oui</button>
          <button id="focus" @click="${this.close}">Annuler</button>
          <button @click="${this.saveWork}">Enregistrer</button>
        </div>
      </template-popup>
    `;
  }

  saveWork() {
    window.dispatchEvent(new CustomEvent('save-file', {detail: {actionAfter: this.actionAfter}}));
    this.close();
  }

  confirm() {
    if (this.actionAfter == 'new')
      window.dispatchEvent(new CustomEvent('new-window'));
    else if (this.actionAfter == 'open')
      window.dispatchEvent(new CustomEvent('open-file'));
    this.close();
  }

  close() {
    this.remove();
  }
}
customElements.define('leave-confirmation-popup', LeaveConfirmationPopup);
