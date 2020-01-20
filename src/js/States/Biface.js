import { app } from '../App';
import { State } from './State';
import { ShapeManager } from '../ShapeManager';

/**
 * Rendre une shape biface
 */
export class BifaceState extends State {
  constructor() {
    super('biface');
  }

  /**
   * initialiser l'état
   */
  start() {
    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.removeEventListener('objectSelected', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
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
   * @param  {Context2D} ctx   le canvas
   * @param  {Shape} shape La forme dessinée
   */
  shapeDrawn(ctx, shape) {
    const biface = shape.isBiface,
      center = shape.center,
      pos = { x: center.x - 17, y: center.y };
    if (biface) {
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { ctx: app.mainCtx, text: 'Biface', position: pos },
        }),
      );
    }
  }
}
