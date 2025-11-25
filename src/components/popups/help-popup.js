import '@components/color-button';
import { app } from '@controllers/Core/App';
import { css, html, LitElement } from 'lit';
import { tools } from '../../store/tools';
import { templatePopupStyles } from './template-popup';

class HelpPopup extends LitElement {
  static properties = {
    content: String,
    toolname: String,
  };

  static styles = [
    templatePopupStyles,
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
    `,
  ];

  async firstUpdated() {
    window.addEventListener('close-popup', () => this.close());
  }

  render() {
    const tool = this.toolname
      ? this.tools.find((t) => t.name === this.toolname)
      : undefined;
    let url = '';
    let titleSuffix = '';
    let altText = 'Aide'; // Valeur par défaut

    if (tool) {
      titleSuffix = ' - ' + tool.title;
      altText = `Aide de ${tool.title}`; // altText spécifique si tool est trouvé

      // Logique de construction de l'URL
      if (tool.type === undefined && tool.name !== 'create') {
        url = `images/help/OutilsGeneraux/${tool.name}.webp`;
      } else if (app.environment.name !== 'Geometrie') {
        // Utiliser tool.name ici car this.toolname pourrait être juste le nom,
        // et on a déjà confirmé que 'tool' existe.
        url = `images/help/${app.environment.name}/${tool.name}.webp`;
      }
      // Si aucune des conditions ci-dessus n'est remplie (par exemple, tool.type est défini ET app.environment.name EST "Geometrie"),
      // alors l'URL restera vide, ce qui est le comportement souhaité pour afficher le message de fallback.
    } else if (this.toolname) {
      // Cas où toolname est fourni mais l'outil n'est pas trouvé dans this.tools
      // titleSuffix reste '', url reste ''
      altText = `Aide pour ${this.toolname}`; // altText générique si toolname est fourni mais tool non trouvé
    }
    // Si this.toolname n'est pas fourni du tout, tool est undefined.
    // titleSuffix reste '', url reste '', altText reste 'Aide' (valeur par défaut initiale).

    return html`
      <template-popup>
        <h2 slot="title">Aide${titleSuffix}</h2>
        <div id="helpPopupBody" slot="body">
          ${url
        ? html`<img src="${url}" alt="${altText}" />` // Utiliser la variable altText mise à jour
        : html`<div>
                L'aide n'est pas encore disponible pour cette fonction.
              </div>`}
        </div>
        <div slot="footer">
          <color-button @click="${() => this.close()}">Ok</color-button>
        </div>
      </template-popup>
    `;
  }

  get tools() {
    return [
      ...tools.get(),
      { name: 'home', title: 'Accueil' },
      { name: 'save', title: 'Enregistrer' },
      { name: 'open', title: 'Ouvrir' },
      { name: 'settings', title: 'Paramètres' },
      { name: 'undo', title: 'Annuler-refaire' },
      { name: 'redo', title: 'Annuler-refaire' },
      { name: 'replay', title: 'Rejouer' },
    ];
  }

  close() {
    this.remove();
  }
}
customElements.define('help-popup', HelpPopup);
