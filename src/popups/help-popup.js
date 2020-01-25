import { LitElement, html, css } from 'lit-element';
import '../version-item';
import { app } from '../js/App';
import { TemplatePopup } from './template-popup';

class HelpPopup extends LitElement {
  static get properties() {
    return {

    };
  }

  constructor() {
    super();
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        version-item {
          margin-right: 8px;
        }
        div#helpPopupBody {
            max-width: 600px;
        }
      `,
    ];
  }

  render() {
    return html`
     <template-popup @close-popup="${() => (this.style.display = 'none')}">
      <h2 slot="title">Aide</h2>
      <div id="helpPopupBody" slot="body">
          <div id="helpPopupContent"></div>

          <div slot="footer">
            <version-item></version-item>
            <button @click="${() => (this.style.display = 'none')}">OK</button>
          </div>
      </div>
     </template-popup>
    `;
  }

}
customElements.define('help-popup', HelpPopup);
