import { LitElement, html } from 'lit-element';
import { TemplatePopup } from './template-popup';
import { WorkspaceManager } from '../js/WorkspaceManager';
import { Workspace } from '../js/Objects/Workspace';

class NewPopup extends LitElement {
  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());

    window.addEventListener('open-new-popup', () => (this.style.display = 'block'));
  }

  static get styles() {
    return TemplatePopup.template_popup_styles();
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
          <button @click="${this.confirm}">OK</button>
        </div>
      </template-popup>
    `;
  }

  confirm() {
    WorkspaceManager.setWorkspace(new Workspace());
    this.close();
  }

  close() {
    this.style.display = 'none';
  }
}
customElements.define('new-popup', NewPopup);
