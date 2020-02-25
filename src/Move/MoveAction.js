import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Point } from '../Core/Objects/Point';

export class MoveAction extends Action {
  constructor() {
    super('MoveAction');

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

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.transformation = new Point(save.transformation);
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (
      !this.shapeId ||
      !this.transformation ||
      this.transformation.x === undefined ||
      this.transformation.y === undefined
    ) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id),
        newCoords = s.coordinates.addCoordinates(this.transformation);
      s.coordinates = newCoords;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id),
        newCoords = s.coordinates.subCoordinates(this.transformation);
      s.coordinates = newCoords;
    });
  }
}
