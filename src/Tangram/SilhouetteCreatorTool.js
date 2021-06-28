import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { Silhouette } from '../Core/Objects/Silhouette';
import { TangramManager } from './TangramManager';

/**
 * Créer un tangram
 */
export class SilhouetteCreatorTool extends Tool {
  constructor() {
    super('createSilhouette', 'Créer Tangram', 'tangram');

    this.isUserWarnedAboutOverlap = false;
  }

  /**
   * initialiser l'état
   */
  async start() {
    this.removeListeners();

    TangramManager.initShapes();
    TangramManager.removeSilhouette();
    this.showStateMenu();

    this.isUserWarnedAboutOverlap = false;
    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    window.addEventListener('new-window', this.handler);
    window.addEventListener('actions-executed', this.handler);
    window.addEventListener('tangram-changed', this.handler);
  }

  end() {
    this.removeListeners();
  }

  eventHandler(event) {
    if (event.type == 'tool-changed') {
      if (app.tool?.name == this.name) {
        this[app.tool.currentStep]();
      } else if (app.tool?.name == 'solveChecker') { // à changer
        this.end();
      }
    } else if (event.type == 'tangram-changed') {
      if (app.tangram.currentStep == 'createSilhouette') {
        this.createSilhouette();
      }
    } else if (event.type == 'actions-executed') {
      this.verifyOverlappingShapes();
    } else if (event.type == 'new-window') {
      this.end();
    }
  }

  removeListeners() {
    window.removeEventListener('actions-executed', this.handler);
    window.removeEventListener('tangram-changed', this.handler);
    window.removeEventListener('new-window', this.handler);
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

  createSilhouette() {
    app.backgroundDrawingEnvironment.removeAllObjects();
    const shapes = app.mainDrawingEnvironment.shapes;

    if (this.hasOverlapedShape(shapes)) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: { message: 'Certaines formes se superposent.' },
        }),
      );
      return;
    }

    new Silhouette(shapes);
    setState({ tangram: {...app.tangram, isSilhouetteShown: true, currentStep: null } });

    window.dispatchEvent(
      new CustomEvent('actions-executed', {
        detail: { name: 'Créer une silhouette' },
      }),
    );
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
              detail: { message: 'Certaines formes se superposent.' },
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
    setState({
      tangram: {
        buttonText: 'Créer silhouette',
        buttonValue: 'createSilhouette',
      }
    });
    if (!document.querySelector('state-menu')) {
      import('./state-menu');
      const stateMenu = document.createElement('state-menu');
      document.querySelector('body').appendChild(stateMenu);
    }
  }
}