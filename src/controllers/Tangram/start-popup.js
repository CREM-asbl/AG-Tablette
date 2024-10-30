import '@components/color-button';
import '@components/popups/template-popup';
import { html, LitElement } from 'lit';

class StartPopup extends LitElement {

  static properties = {
    mode: { type: String }
  }

  render() {
    return html`
      <template-popup>
        <span slot="close"></span>
        <h2 slot="title">Bienvenue dans la partie Tangram</h2>
        <div slot="body">Que souhaitez-vous faire ?</div>
        <div slot="footer" id="button-container">
          <color-button @click="${this.reproduceSilhouette}">Reproduire une silhouette</color-button>
          <color-button @click="${this.createSilhouette}">Créer une silhouette</color-button>
        </div>
      </template-popup>
    `;
  }

  createSilhouette() {
    this.mode = 'creation'
    this.close();
  }

  async reproduceSilhouette() {
    this.mode = 'reproduction'
    this.close();
  }

  close() {
    this.dispatchEvent(new CustomEvent('close'));
    this.remove();
  }
}
customElements.define('start-popup', StartPopup);
