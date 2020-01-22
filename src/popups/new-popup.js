import { LitElement, html } from 'lit-element';
import { TemplatePopup } from './template-popup';
import { WorkspaceManager } from '../js/WorkspaceManager';

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
    WorkspaceManager.setWorkspace(WorkspaceManager.getNewWorkspace('Grandeurs'));
    this.close();
  }

  close() {
    this.style.display = 'none';
  }
}
customElements.define('new-popup', NewPopup);
