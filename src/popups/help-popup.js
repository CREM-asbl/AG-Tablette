import { css, html, LitElement } from 'lit';
import { app } from '../Core/App';
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
      Pour afficher l'aide correspondant à un des outils, opérations ou
      mouvements, sélectionnez cet élément puis cliquez à nouveau sur le menu
      d'aide.
    `;

    if (app.tool?.name) {
      this.content = html`
        <img src='images/help/${app.environment.name}/${app.tool.name}.webp'>
      `;
    }

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
          max-width: 80vw;
          max-height: calc(70 * var(--vh));
        }
        :host {
          -webkit-touch-callout: text; /* iOS Safari */
            -webkit-user-select: text; /* Safari */
             -khtml-user-select: text; /* Konqueror HTML */
               -moz-user-select: text; /* Old versions of Firefox */
                -ms-user-select: text; /* Internet Explorer/Edge */
                    user-select: text;
        }

        h3 {
          padding: 0;
        }

        img {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.5);
        }
      `,
    ];
  }

  // setText(text) {
  //   this.content = text;
  // }

  // connectedCallback() {
  //   super.connectedCallback();
  //   window.dispatchEvent(new CustomEvent('get-help-text'));
  // }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Aide</h2>
        <div id="helpPopupBody" slot="body">
          ${this.content}
        </div>
        <div slot="footer">
          <color-button @click="${() => this.close()}" innerText="Ok"></color-button>
        </div>
      </template-popup>
    `;
  }

  close() {
    this.remove();
  }
}
customElements.define('help-popup', HelpPopup);
