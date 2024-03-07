import '@components/color-button';
import { app } from '@controllers/Core/App';
import { css, html, LitElement } from 'lit';
import { TemplatePopup } from './template-popup';

class HelpPopup extends LitElement {
  static properties = {
    content: String,
    toolname: String,
  }

  static styles = [
    TemplatePopup.template_popup_styles(),
    css`
        :host {
          -webkit-touch-callout: text; /* iOS Safari */
            -webkit-user-select: text; /* Safari */
             -khtml-user-select: text; /* Konqueror HTML */
               -moz-user-select: text; /* Old versions of Firefox */
                -ms-user-select: text; /* Internet Explorer/Edge */
                    user-select: text;
        }
        div#helpPopupBody {
          max-width: 70dvw;
          max-height: 70dvh;
        }

        img {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.5);
        }
      `
  ]

  async firstUpdated() {
    window.addEventListener('close-popup', () => this.close());
  }

  render() {
    const tool = this.tools.find(tool => tool.name == this.toolname);
    let url = ''
    if (tool.type == undefined && tool.name != 'create')
      url = `images/help/OutilsGeneraux/${this.toolname}.webp`
    else if (app.environment.name != "Geometrie")
      url = `images/help/${app.environment.name}/${this.toolname}.webp`
    return html`
      <template-popup>
        <h2 slot="title">Aide ${this.toolname ? ' - ' + this.tools.find(tool => tool.name == this.toolname).title : ''}</h2>
        <div id="helpPopupBody" slot="body">
        ${url
        ? html`<img src='${url}' alt="Aide de ${this.toolname}">`
        : html`<div>L'aide n'est pas encore disponible pour cette fonction.</div>`}
        </div>
        <div slot="footer">
          <color-button @click="${() => this.close()}">Ok</color-button>
        </div>
      </template-popup>
    `;
  }

  get tools() {
    return [...app.tools,
    { name: 'home', title: 'Accueil' },
    { name: 'save', title: 'Enregistrer' },
    { name: 'open', title: 'Ouvrir' },
    { name: 'settings', title: 'Paramètres' },
    { name: 'undo', title: 'Annuler-refaire' },
    { name: 'redo', title: 'Annuler-refaire' },
    { name: 'replay', title: 'Rejouer' },
    ]
  }

  close() {
    this.remove();
  }
}
customElements.define('help-popup', HelpPopup);
