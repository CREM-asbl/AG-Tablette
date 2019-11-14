import { app } from '../../App';
import { Action } from './Action';

export class BuildCenterAction extends Action {
  constructor() {
    super();

    this.name = 'BuildCenterAction';

    //L'id de la forme dont on va colorier les bords
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
    shape.isCenterShown = true;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId);
    shape.isCenterShown = false;
  }
}
