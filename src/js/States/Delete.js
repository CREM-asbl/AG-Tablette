import { app } from '../App';
import { DeleteAction } from './Actions/Delete';
import { State } from './State';
import { Shape } from '../Objects/Shape';

/**
 * Supprimer une forme (et supprime le groupe dont la forme faisait partie s'il
 * ne restait que 2 formes dans le groupe)
 */
export class DeleteState extends State {
  constructor() {
    super('delete_shape');
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new DeleteAction(this.name)];

    let selConstr = app.interactionAPI.getEmptySelectionConstraints();
    selConstr.eventType = 'click';
    selConstr.shapes.canSelect = true;
    selConstr.points.canSelect = true;
    selConstr.points.types = ['segmentPoint'];

    app.interactionAPI.setSelectionConstraints(selConstr);

    app.appDiv.cursor = 'default';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme ou un point a été sélectionné (click)
   * @param  {Object} object            La forme ou le point sélectionné
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object, clickCoordinates, event) {
    if (object instanceof Shape) {
      let involvedShapes = app.workspace.getAllBindedShapes(object, true);

      this.actions[0].mode = 'shape';

      // this.actions[0].shapeId = shape.id;
      this.actions[0].involvedShapes = involvedShapes;
    } else {
      // point

      console.log('here');

      this.actions[0].mode = 'point';

      this.actions[0].point = object.coordinates;

      this.actions[0].shapeId = object.shape.id;
    }
    this.executeAction();
    this.start();

    app.drawAPI.askRefresh();
  }
}
