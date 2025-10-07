import '@components/color-button';
import { app } from '@controllers/Core/App';
import { createElem } from '@controllers/Core/Tools/general';
import { html, LitElement } from 'lit';
import './open-server-popup';
import './save-warning';
import './template-popup';

class OpenPopup extends LitElement {
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
    createElem('open-server-popup');
    this.close();
  }
}
customElements.define('open-popup', OpenPopup);
