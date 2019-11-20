import { app } from '../../App';
import { Action } from './Action';

export class BifaceAction extends Action {
  constructor() {
    super();

    this.name = 'BifaceAction';

    this.shapeId = null;
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

    let shape = app.workspace.getShapeById(this.shapeId);
    shape.isBiface = !shape.isBiface;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId);
    shape.isBiface = !shape.isBiface;
  }
}
