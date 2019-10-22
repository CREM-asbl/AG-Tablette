import { app } from '../../App';
import { Action } from './Action';

export class MoveAction extends Action {
  constructor() {
    super();

    //L'id de la forme que l'on déplace
    this.shapeId = null;

    //Le déplacement à appliquer aux formes (à additionner aux coordonnées)
    this.transformation = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      transformation: this.transformation,
      involvedShapesIds: this.involvedShapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.transformation = save.transformation;
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
        coords = s.getCoordinates(),
        newCoords = {
          x: coords.x + this.transformation.x,
          y: coords.y + this.transformation.y,
        };
      s.setCoordinates(newCoords);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id),
        coords = s.getCoordinates(),
        newCoords = {
          x: coords.x - this.transformation.x,
          y: coords.y - this.transformation.y,
        };
      s.setCoordinates(newCoords);
    });
  }
}
