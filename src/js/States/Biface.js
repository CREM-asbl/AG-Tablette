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
    this.actions = [new BifaceAction(this.name)];

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    app.appDiv.cursor = 'default';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    let involvedShapes = app.workspace.getAllBindedShapes(shape, true);

    this.actions[0].shapeId = shape.id;
    this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

    this.executeAction();

    this.start();

    app.drawAPI.askRefresh();
  }
}
