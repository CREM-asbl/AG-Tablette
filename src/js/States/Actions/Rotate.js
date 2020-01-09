import { app } from '../../App';
import { Action } from './Action';

export class RotateAction extends Action {
  constructor() {
    super('RotateAction');

    //L'id de la forme que l'on tourne
    this.shapeId = null;

    //L'angle de rotation (dans le sens horloger)
    this.rotationAngle = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      rotationAngle: this.rotationAngle,
      involvedShapesIds: this.involvedShapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.rotationAngle = save.rotationAngle;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    if (!Number.isFinite(this.rotationAngle)) return false;
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId),
      center = shape.center;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      s.rotate(this.rotationAngle, center);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId),
      center = shape.center;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      s.rotate(-this.rotationAngle, center);
    });
  }
}
