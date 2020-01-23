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
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Supprimer une forme";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
            	Touchez une forme pour la supprimer de l'espace de travail.
            </p>
      `;
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

      this.actions[0].mode = 'point';

      this.actions[0].point = object;

      this.actions[0].shapeId = object.shape.id;
    }
    this.executeAction();
    this.start();

    app.drawAPI.askRefresh();
  }
}
