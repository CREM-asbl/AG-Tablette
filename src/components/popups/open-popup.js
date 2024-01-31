import '@components/color-button';
import { app } from '@controllers/Core/App';
import { createElem } from '@controllers/Core/Tools/general';
import { css, html, LitElement } from 'lit';
import './open-server-popup';
import './save-warning';
import { TemplatePopup } from './template-popup';

class OpenPopup extends LitElement {

  static styles = [
    TemplatePopup.template_popup_styles(),
    css`
        [slot='body'] {
          padding: 0;
        }

        [slot='footer'] {
          padding-top: 16px;
        }
      `,
  ]

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Ouvrir un fichier</h2>
        <div slot="body" id="body">
          ${app.stepSinceSave ? html`<save-warning></save-warning>` : ''}
        </div>

        <div slot="footer">
          <color-button name="LocalOpenFile" @click="${this.openLocalFile}" innerText="Ouvrir en local"></color-button>
          <color-button name="ServerOpenFile" @click="${this.openServerFile}" innerText="Ouvrir en ligne"></color-button>
          <color-button @click="${this.close}" innerText="Annuler"></color-button>
        </div>
      </template-popup>
    `;
  }

  firstUpdated() {
    window.addEventListener('close-popup', () => this.close());
  }

  close() {
    this.remove();
  }

  openLocalFile() {
    window.dispatchEvent(new CustomEvent('local-open-file'));
    this.close();
  }

  openServerFile() {
    if (!navigator.onLine) {
      alert("Vous n'êtes pas connecté.\nVeuillez vérifier votre connexion.")
      return
    }
    createElem('open-server-popup');
    this.close();
  }
}
customElements.define('open-popup', OpenPopup);
