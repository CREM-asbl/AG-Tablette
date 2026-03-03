import '@components/color-button';
import { app } from '@controllers/Core/App';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import '@styles/popup-variables.css';
import { css, html, LitElement } from 'lit';
import { tools } from '../../store/tools';
import './template-popup';

class HelpPopup extends LitElement {
  static properties = {
    content: String,
    toolname: String,
    tutorial: Object,
    isLoadingTutorial: { state: true },
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

    // Si nous sommes en Géométrie et que le tutoriel existe, le charger
    if (app.environment?.name === 'Geometrie' && this.toolname) {
      await this.loadInteractiveTutorial();
    }
  }

  async loadInteractiveTutorial() {
    // Vérifier si l'outil a une configuration d'aide contextuelle enregistrée
    if (helpConfigRegistry.has(this.toolname)) {
      await this.loadContextualGuide();
      return;
    }

    // Comportement normal pour les autres outils
    this.isLoadingTutorial = true;
    try {
      // Import dynamique pour éviter les problèmes d'initialisation circulaire
      const { getHelpSystem } = await import('@services/HelpSystem');
      const helpSystem = getHelpSystem();
      await helpSystem.initialize();
      const tutorial = await helpSystem.getTutorial(this.toolname);

      if (tutorial) {
        this.tutorial = tutorial;
        // Remplacer help-popup par interactive-tutorial
        this.replaceWithInteractiveTutorial();
      }
    } catch (error) {
      console.warn(`Impossible de charger le tutoriel ${this.toolname}:`, error);
    } finally {
      this.isLoadingTutorial = false;
    }
  }

  async loadContextualGuide() {
    try {
      // Import dynamique et création du guidage contextuel
      await import('@components/popups/contextual-guide');
      const guideElem = document.createElement('contextual-guide');

      // Remplacer help-popup par le guidage contextuel
      if (this.parentNode) {
        this.parentNode.replaceChild(guideElem, this);
      }
    } catch (error) {
      console.warn(`Erreur lors du chargement du guidage contextuel:`, error);
    }
  }

  replaceWithInteractiveTutorial() {
    // Import dynamique pour éviter les problèmes d'ordre d'initialisation
    import('@components/popups/interactive-tutorial').then(() => {
      const tutorialElem = document.createElement('interactive-tutorial');
      tutorialElem.tutorial = this.tutorial;
      tutorialElem.toolName = this.toolname;

      // Remplacer help-popup par interactive-tutorial
      if (this.parentNode) {
        this.parentNode.replaceChild(tutorialElem, this);
      }
    });
  }

  render() {
    // Afficher un loader si on charge un tutoriel interactif
    if (this.isLoadingTutorial) {
      return html`
        <template-popup>
          <h2 slot="title">Aide</h2>
          <div slot="body" style="text-align: center; padding: 2rem;">
            <p>Chargement du tutoriel...</p>
          </div>
        </template-popup>
      `;
    }

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
      } else if (app.environment?.name !== 'Geometrie') {
        // Utiliser tool.name ici car this.toolname pourrait être juste le nom,
        // et on a déjà confirmé que 'tool' existe.
        url = `images/help/${app.environment.name}/${tool.name}.webp`;
      }
      // Si aucune des conditions ci-dessus n'est remplie (par exemple, tool.type est défini ET app.environment.name EST "Geometrie"),
      // alors l'URL restera vide - mais le tutoriel interactif aurait dû être chargé au lieu de cela.
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
        ? html`<img src="${url}" alt="${altText}" />`
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
