import '@components/color-button';
import { TemplatePopup } from '@components/popups/template-popup';
import { html, LitElement } from 'lit';
import { setState } from '../Core/App';

class StartPopup extends LitElement {

  static styles = [
    TemplatePopup.template_popup_styles()
  ]

  render() {
    return html`
      <template-popup>
        <div slot="close" style='display: none;'>
        </div>
        <h2 slot="title">Bienvenue dans la partie Tangram</h2>
        <div slot="body">Que souhaitez-vous faire ?</div>
        <div slot="footer" id="button-container">
          <color-button @click="${this.createSilhouette}" innerText='Créer une silhouette'></color-button>
          <color-button @click="${this.reproduceSilhouette}" innerText='Reproduire une silhouette'></color-button>
        </div>
      </template-popup>
    `;
  }

  createSilhouette() {
    this.close();
    setState({ tool: { name: 'createSilhouette', currentStep: 'start' } });
  }

  reproduceSilhouette() {
    this.close();
    window.dispatchEvent(new CustomEvent('open-file'));
  }

  close() {
    this.remove();
  }
}
customElements.define('start-popup', StartPopup);
