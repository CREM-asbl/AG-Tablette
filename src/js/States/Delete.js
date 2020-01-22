import { app } from '../App';
import { State } from './State';
import { Shape } from '../Objects/Shape';
import { GroupManager } from '../GroupManager';
import { ShapeManager } from '../ShapeManager';

/**
 * Supprimer une forme (et supprime le groupe dont la forme faisait partie s'il
 * ne restait que 2 formes dans le groupe)
 */
export class DeleteState extends State {
  constructor() {
    super('delete', 'Supprimer une forme', 'tool');
  }

  /**
   * initialiser l'état
   */
  start() {
    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.types = ['segmentPoint'];

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    window.dispatchEvent(new CustomEvent('reset-selection-constrains'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.types = ['segmentPoint'];

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
   * Appelée par événement du SelectManager lorsqu'une forme ou un point a été sélectionné (click)
   * @param  {Object} object            La forme ou le point sélectionné
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(object, mouseCoordinates) {
    if (object instanceof Shape) {
      let userGroup = GroupManager.getShapeGroup(object),
        involvedShapes;
      if (userGroup) involvedShapes = userGroup.shapesIds.map(id => ShapeManager.getShapeById(id));
      else involvedShapes = [object];

      this.actions = [
        {
          name: 'DeleteAction',
          mode: 'shape',
          involvedShapes: involvedShapes,
          shapesIdx: involvedShapes.map(shape => ShapeManager.getShapeIndex(shape)),
        },
      ];
      if (userGroup) {
        this.actions[0].userGroup = userGroup;
        this.actions[0].userGroupIndex = GroupManager.getGroupIndex(userGroup);
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

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
