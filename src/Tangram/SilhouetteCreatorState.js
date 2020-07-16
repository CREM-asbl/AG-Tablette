import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { Silhouette } from '../Core/Objects/Silhouette';

/**
 * Créer un tangram
 */
export class SilhouetteCreatorState extends State {
  constructor() {
    super('silhouette-creator', 'Créer Tangram', 'tangram');

    this.buttons = null;

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
    if (!this.tangramStartPos)
      this.tangramStartPos = await this.getStartPosition();
    this.initShapes();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;

    this.showStateMenu();
    window.addEventListener('state-menu-button-click', this.handler);
    window.addEventListener('create-silhouette', () => this.createSilhouette());

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  restart() {
    this.initShapes();
    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;

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
        Pour créer une nouvelle silhouette, disposez les formes comme vous le
        désirez, <br />
        en veillant à ce qu'aucunes formes ne se supersopent. <br />
        Cliquez sur le bouton "Créer silhouette" une fois que vous avez terminé.
        <br />
      </p>
    `;
  }

  clickOnStateMenuButton(btn_value) {
    if (btn_value == 'end') {
      window.dispatchEvent(new CustomEvent('create-silhouette'));
    }
  }

  createSilhouette() {
    const shapes = app.workspace.shapes;

    if (this.hasOverlapedShape(shapes)) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Certaines formes se superposent' },
        })
      );
      return;
    }
    const silhouette = new Silhouette(shapes);

    if (!silhouette) return;
    app.silhouette = silhouette;
    this.initShapes();

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  hasOverlapedShape(shapes) {
    return shapes.some(shape =>
      shapes.some(s => {
        if (s.id == shape.id) return false;
        else return s.overlapsWith(shape);
      })
    );
  }

  showStateMenu() {
    if (document.querySelector('state-menu')) return;
    import('./state-menu');
    const menu = document.createElement('state-menu');
    menu.buttons = [
      {
        text: 'Créer silhouette',
        value: 'end',
      },
    ];
    document.querySelector('body').appendChild(menu);
  }

  initShapes() {
    const dataObject = JSON.parse(this.tangramStartPos);
    WorkspaceManager.setWorkspaceFromObject(dataObject.wsdata);
  }
}
