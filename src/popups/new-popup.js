import { LitElement, html } from 'lit-element';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

class NewPopup extends LitElement {
  static get styles() {
    return TemplatePopup.template_popup_styles();
  }

  render() {
    return html`
      <template-popup @close-popup="${() => this.close()}">
        <h2 slot="title">Nouvelle fenêtre</h2>
        <div slot="body" id="body">
          <p>
            Voulez-vous vraiment une nouvelle fenêtre ? <br />
            Attention votre travail actuel sera perdu !
          </p>
        </div>

        <div slot="footer">
          <button @click="${this.close}">Annuler</button>
          <button @click="${this.confirm}">OK</button>
        </div>
      </template-popup>
    `;
  }

  confirm() {
    app.wsManager.setWorkspace(app.wsManager.getNewWorkspace('Grandeur'));
    this.close();
  }

  close() {
    this.style.display = 'none';
  }
}
customElements.define('new-popup', NewPopup);
