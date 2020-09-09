import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Rendre une shape biface
 */
export class BifaceState extends State {
  constructor() {
    super('biface', 'Biface', 'tool');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Biface';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Une fois sélectionné, un texte "biface" apparaît sur les formes étant
        bifaces.<br />
        Touchez une forme pour qu'elle devienne biface, et touchez une seconde
        fois pour annuler.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    let involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    this.actions = [
      {
        name: 'BifaceAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        oldBiface: involvedShapes.map(s => s.isBiface),
      },
    ];

    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin après avoir dessiné une forme sur le
   * canvas principal
   * @param  {Shape}  shape  La forme dessinée
   */
  shapeDrawn(shape) {
    const biface = shape.isBiface,
      center = shape.center,
      pos = { x: center.x, y: center.y };
    if (biface) {
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { ctx: app.mainCtx, text: 'Biface', position: pos },
        })
      );
    }
  }
}
