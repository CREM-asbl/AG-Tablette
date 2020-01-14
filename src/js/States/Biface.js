import { app } from '../App';
import { BifaceAction } from './Actions/Biface.js';
import { State } from './State';

/**
 * Rendre une shape biface
 */
export class BifaceState extends State {
  constructor() {
    super('biface');
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.end();
    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

  end() {
    app.editingShapes = [];
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
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    let involvedShapes = app.workspace.getAllBindedShapes(shape, true);

    this.actions = [
      {
        name: 'BifaceAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        oldBiface: involvedShapes.map(s => s.isBiface),
      },
    ];

    this.executeAction();

    this.start();

    app.drawAPI.askRefresh();
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
      app.drawAPI.drawText(ctx, 'Biface', pos);
    }
  }
}
