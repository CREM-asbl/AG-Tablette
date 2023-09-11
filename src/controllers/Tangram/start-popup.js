import { css, html, LitElement } from 'lit';
import { setState } from '../Core/App';
import { TemplatePopup } from '../popups/template-popup';

class StartPopup extends LitElement {
  static get properties() {
    return {
    };
  }

  constructor() {
    super();

    // window.addEventListener('close-popup', () => this.close());
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        #button-container {
          margin-top: 10px;
          display: flex;
        }
      `,
    ];
  }

  render() {
    return html`
      <template-popup>
        <div slot="close" style='display: none;'>
        </div>
        <h2 slot="title">Bienvenue dans la partie Tangram</h2>
        <div slot="body">
          Que souhaitez-vous faire ?
          <div id="button-container">
            <color-button @click="${this.createSilhouette}" innerText='Créer une silhouette'></color-button>
            <color-button @click="${this.reproduceSilhouette}" innerText='Reproduire une silhouette'></color-button>
          </div>
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
