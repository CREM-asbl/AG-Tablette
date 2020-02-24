import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Managers/ShapeManager';

export class BuildCenterAction extends Action {
  constructor() {
    super('BuildCenterAction');

    //L'id de la forme dont on va colorier les bords
    this.shapeId = null;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
  }

  checkDoParameters() {
    if (!this.shapeId) {
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

    let shape = ShapeManager.getShapeById(this.shapeId);
    shape.isCenterShown = !shape.isCenterShown;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.shapeId);
    shape.isCenterShown = !shape.isCenterShown;
  }
}
