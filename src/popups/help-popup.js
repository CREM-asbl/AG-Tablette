import { LitElement, html, css } from 'lit-element';
import '../version-item';
import { TemplatePopup } from './template-popup';

class HelpPopup extends LitElement {
  static get properties() {
    return {
      content: String,
    };
  }

  constructor() {
    super();

    this.content = html`
      Pour afficher l'aide correspondant à un des outils, opérations ou mouvements, sélectionnez cet
      élément puis cliquez à nouveau sur le menu d'aide.
    `;

    window.addEventListener('close-popup', () => this.close());
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

  setText(text) {
    this.content = text;
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Aide</h2>
        <div id="helpPopupBody" slot="body">
          <div id="helpPopupContent">
            ${this.content}
          </div>

          <div slot="footer">
            <version-item></version-item>
            <button @click="${() => this.close()}">OK</button>
          </div>
        </div>
      </template-popup>
    `;
  }

  close() {
    this.remove();
  }
}
customElements.define('help-popup', HelpPopup);
