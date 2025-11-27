import '@components/color-button';
import { app } from '@controllers/Core/App';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import './template-popup';
import { tools } from '../../store/tools';

class HelpPopup extends LitElement {
  static properties = {
    content: String,
    toolname: String,
  };

  static styles = css`
    .field {
      display: var(--popup-field-display);
      align-items: var(--popup-field-align-items);
      padding: var(--popup-field-padding);
      width: var(--popup-field-width);
    }

    select {
      height: var(--popup-select-height);
      width: var(--popup-select-width);
      border-radius: var(--popup-select-border-radius);
    }

    input {
      height: var(--popup-input-height);
      width: var(--popup-input-width);
      border-radius: var(--popup-input-border-radius);
    }

    input[type='checkbox'] {
      height: var(--popup-checkbox-height);
      width: var(--popup-checkbox-width);
    }

    label {
      font-weight: var(--popup-label-font-weight);
      margin: var(--popup-label-margin);
      font-size: var(--popup-label-font-size);
    }

    :host {
      -webkit-touch-callout: text;
      -webkit-user-select: text;
      -khtml-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
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
  `;


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
