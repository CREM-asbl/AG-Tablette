import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';
import { Silhouette } from '../Core/Objects/Silhouette';
import { TangramManager } from './TangramManager';

/**
 * Créer un tangram
 */
export class SilhouetteCreatorState extends State {
  constructor() {
    super('silhouette-creator', 'Créer Tangram', 'tangram');

    this.buttons = null;

    window.addEventListener('new-window', () => this.finish());
  }

  async loadKit() {
    const response = await fetch('data/Tangram/kit2.json');
    return response.text();
  }

  /**
   * initialiser l'état
   */
  async start() {
    if (!this.kit) this.kit = await this.loadKit();
    this.initShapes();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;

    TangramManager.removeSilhouette();
    this.showStateMenu();
    window.addEventListener('state-menu-button-click', this.handler);
    window.addEventListener('create-silhouette', this.handler);
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

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'state-menu-button-click') {
      this.clickOnStateMenuButton(event.detail);
    } else if (event.type == 'create-silhouette') {
      this.createSilhouette();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
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
    if (btn_value == 'create') {
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

    app.setState();
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
        value: 'create',
      },
    ];
    document.querySelector('body').appendChild(menu);
  }

  initShapes() {
    const ws = JSON.parse(this.kit);
    WorkspaceManager.setWorkspaceFromObject(ws);
  }
}
