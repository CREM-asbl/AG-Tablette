import { app } from '../../App';
import { Action } from './Action';
import { Point } from '../../Objects/Point';

export class MoveAction extends Action {
  constructor() {
    super();

    this.name = 'MoveAction';

    //L'id de la forme que l'on déplace
    this.shapeId = null;

    //Le déplacement à appliquer aux formes (à additionner aux coordonnées)
    this.transformation = null;

    /*
        Liste des formes solidaires à la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      transformation: this.transformation.saveToObject(),
      involvedShapesIds: this.involvedShapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.transformation = new Point(save.transformation);
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    if (
      !this.transformation ||
      this.transformation.x === undefined ||
      this.transformation.y === undefined
    )
      return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    if (
      !this.transformation ||
      this.transformation.x === undefined ||
      this.transformation.y === undefined
    )
      return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id),
        coords = s.coordinates,
        newCoords = {
          x: coords.x + this.transformation.x,
          y: coords.y + this.transformation.y,
        };
      s.coordinates = newCoords;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id),
        coords = s.coordinates,
        newCoords = {
          x: coords.x - this.transformation.x,
          y: coords.y - this.transformation.y,
        };
      s.coordinates = newCoords;
    });
  }
}
