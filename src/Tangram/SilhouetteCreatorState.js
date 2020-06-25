import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { TangramManager } from './TangramManager';
import { Silhouette } from '../Core/Objects/Silhouette';

/**
 * Créer un tangram
 */
export class SilhouetteCreatorState extends State {
  constructor() {
    super('silhouette-creator', 'Créer Tangram', 'tangram');

    // selecting-polygons -> selecting-shapes
    this.currentStep = null;

    this.subStep = null;

    this.constr = null;

    this.polygons = null;

    this.shapes = [];

    this.buttons = null;

    // withInternalSegment or neInternalSegment
    this.silhouetteMode = 'noInternalSegment';

    window.addEventListener('new-window', () => this.finish());

    window.addEventListener('silhouette-opened', () => this.finish());
  }

  async getStartPosition() {
    const response = await fetch('data/Tangram/tangramStartPos.agt');
    return response.text();
  }

  /**
   * initialiser l'état
   */
  async start() {
    if (!app.tangramStartPos) app.tangramStartPos = await this.getStartPosition();
    app.workspace.shapes = [];
    app.silhouette = new Silhouette();
    TangramManager.showShapes();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape;

    this.buttons = [
      {
        text: 'Créer silhouette',
        value: 'end',
      },
    ];

    this.showStateMenu();
    window.addEventListener('state-menu-button-click', this.handler);

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  restart() {
    app.workspace.shapes = [];
    app.silhouette = new Silhouette();
    TangramManager.showShapes();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape;

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  finish() {
    window.dispatchEvent(new CustomEvent('close-state-menu'));
    window.removeEventListener('state-menu-button-click', this.handler);
  }

  end() {}

  _actionHandle(event) {
    if (event.type == 'state-menu-button-click') {
      this.clickOnStateMenuButton(event.detail);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Créateur de silhouettes';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Pour créer une nouvelle silhouette, disposez les formes comme vous le désirez, <br />
        en veillant à ce qu'aucunes formes ne se supersopent. <br />
        Cliquez sur le bouton "Créer silhouette" une fois que vous avez terminé. <br />
      </p>
    `;
  }

  clickOnStateMenuButton(btn_value) {
    if (btn_value == 'end') {
      this.silhouetteMode = confirm('Sauvegarder les segments internes de la silhouette ?')
        ? 'withInternalSegment'
        : 'noInternalSegment';

      console.log(app.workspace.shapes);
      window.dispatchEvent(
        new CustomEvent('create-silhouette', {
          detail: { silhouetteMode: this.silhouetteMode },
        }),
      );
    }
  }

  showStateMenu() {
    if (document.querySelector('state-menu')) return;
    import('./state-menu');
    const menu = document.createElement('state-menu');
    menu.buttons = this.buttons;
    document.querySelector('body').appendChild(menu);
  }
}
