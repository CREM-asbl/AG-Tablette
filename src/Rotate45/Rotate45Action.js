import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';

export class Rotate45Action extends Action {
  constructor() {
    super('Rotate45Action');

    //L'id de la forme que l'on tourne
    this.shapeId = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (!this.shapeId || !this.involvedShapesIds) {
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

    let shape = ShapeManager.getShapeById(this.shapeId),
      center = shape.center;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.rotate(Math.PI / 4, center);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.shapeId),
      center = shape.center;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.rotate(-Math.PI / 4, center);
    });
  }
}
