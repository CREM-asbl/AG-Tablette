import '@components/color-button';
import { app } from '@controllers/Core/App';
import '@controllers/version-item';
import { css, html, LitElement } from 'lit';
import { TemplatePopup } from './template-popup';

class HelpPopup extends LitElement {
  static get properties() {
    return {
      content: String,
      toolname: String,
    };
  }

  constructor() {
    super();

    window.addEventListener('close-popup', () => this.close());

    this.tools = [...app.tools,
    { name: 'home', title: 'Accueil' },
    { name: 'save', title: 'Enregistrer' },
    { name: 'open', title: 'Ouvrir' },
    { name: 'settings', title: 'Paramètres' },
    { name: 'undo', title: 'Annuler-refaire' },
    { name: 'redo', title: 'Annuler-refaire' },
    { name: 'replay', title: 'Rejouer' },
    ]
  }

  static get styles() {
    return [
      TemplatePopup.template_popup_styles(),
      css`
        version-item {
          margin-right: 8px;
        }
        div#helpPopupBody {
          max-width: 70dvw;
          max-height: 70dvh;
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

  firstUpdated() {
    let tool = this.tools.find(tool => tool.name == this.toolname);
    if (tool.type == undefined && tool.name != 'create') {
      this.content = html`
        <img src='images/help/OutilsGeneraux/${this.toolname}.webp' onerror='this.src = "images/help/default.png"'>
      `;
    } else {
      this.content = html`
        <img src='images/help/${app.environment.name}/${this.toolname}.webp' onerror='this.src = "images/help/default.png"'>
      `;
    }
  }

  render() {
    return html`
      <template-popup>
        <h2 slot="title">Aide ${this.toolname ? ' - ' + this.tools.find(tool => tool.name == this.toolname).title : ''}</h2>
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
