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
    this.end();

    let selConstr = app.interactionAPI.getEmptySelectionConstraints();
    selConstr.eventType = 'click';
    selConstr.shapes.canSelect = true;
    selConstr.points.canSelect = true;
    selConstr.points.types = ['segmentPoint'];

    app.interactionAPI.setSelectionConstraints(selConstr);

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
   * Appelée par l'interactionAPI lorsqu'une forme ou un point a été sélectionné (click)
   * @param  {Object} object            La forme ou le point sélectionné
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(object, clickCoordinates, event) {
    if (object instanceof Shape) {
      let userGroup = app.workspace.getShapeGroup(object),
        involvedShapes;
      if (userGroup) involvedShapes = userGroup.shapesIds.map(id => app.workspace.getShapeById(id));
      else involvedShapes = [object];

      this.actions = [
        {
          name: 'DeleteAction',
          mode: 'shape',
          involvedShapes: involvedShapes,
          shapesIdx: involvedShapes.map(shape => app.workspace.getShapeIndex(shape)),
        },
      ];
      if (userGroup) {
        this.actions[0].userGroup = userGroup;
        this.actions[0].userGroupIndex = app.workspace.getGroupIndex(userGroup);
      }
    } else {
      // point

      this.actions = [
        {
          name: 'DeleteAction',
          mode: 'point',
          point: object,
        },
      ];
    }
    this.executeAction();
    this.start();

    app.drawAPI.askRefresh();
  }
}
