import { app } from '../Core/App';
import { Tool } from '../Core/States/State';
import { html } from 'lit-element';
import { Silhouette } from '../Core/Objects/Silhouette';
import { TangramManager } from './TangramManager';

/**
 * Créer un tangram
 */
export class SilhouetteCreatorTool extends Tool {
  constructor() {
    super('createSilhouette', 'Créer Tangram', 'tangram');

    this.buttons = null;

    this.isUserWarnedAboutOverlap = false;

    window.addEventListener('new-window', () => this.finish());

    window.addEventListener('app-state-changed', (event) => {
      if (event.detail.state == 'solveChecker') this.finish();
    });
  }

  /**
   * initialiser l'état
   */
  async start() {
    TangramManager.initShapes();

    this.isUserWarnedAboutOverlap = false;

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;

    TangramManager.removeSilhouette();
    this.showStateMenu();
    window.addEventListener('state-menu-button-click', this.handler);
    window.addEventListener('create-silhouette', this.handler);
    window.addEventListener('actions-executed', this.handler);
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  restart() {
    TangramManager.initShapes();
    this.isUserWarnedAboutOverlap = false;
    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  finish() {
    window.removeEventListener('state-menu-button-click', this.handler);
    window.removeEventListener('actions-executed', this.handler);
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
    } else if (event.type == 'actions-executed') {
      this.verifyOverlappingShapes();
    } else {
      console.error('unsupported event type : ', event.type);
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
    app.backgroundDrawingEnvironment.removeAllObjects();
    const shapes = app.mainDrawingEnvironment.shapes;

    if (this.hasOverlapedShape(shapes)) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Certaines formes se superposent' },
        }),
      );
      return;
    }
    const silhouette = new Silhouette(shapes);

    if (!silhouette) return;
    app.silhouette = silhouette;

    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }

  hasOverlapedShape(shapes) {
    return shapes.some((shape) =>
      shapes.some((s) => {
        if (s.id == shape.id) return false;
        else return s.overlapsWith(shape);
      }),
    );
  }

  verifyOverlappingShapes() {
    app.mainDrawingEnvironment.shapes.forEach((s) => {
      s.isOverlappingAnotherInTangram = false;
    });
    app.mainDrawingEnvironment.shapes.forEach((s, idx, shapes) => {
      let index = app.mainDrawingEnvironment.shapes.findIndex((s2) => {
        if (s.id == s2.id) return false;
        if (s.overlapsWith(s2)) return true;
        return false;
      });
      if (index != -1) {
        if (!this.isUserWarnedAboutOverlap) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Certaines formes se superposent' },
            }),
          );
          this.isUserWarnedAboutOverlap = true;
        }
        s.isOverlappingAnotherInTangram = true;
        shapes[index].isOverlappingAnotherInTangram = true;
      }
    });
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
}
