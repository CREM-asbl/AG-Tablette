import { app } from '../../App';
import { Action } from './Action';

export class BifaceAction extends Action {
  constructor() {
    super('BifaceAction');

    this.shapeId = null;

    this.involvedShapesIds = null;
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let shapes = this.involvedShapesIds.map(id => {
      return app.workspace.getShapeById(id);
    });
    let value_to_set = !shapes.every(shape => shape.isBiface);
    shapes.forEach(shape => {
      shape.isBiface = value_to_set;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      s.isBiface = !s.isBiface;
    });
  }
}
