import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';

export class BuildCenterAction extends Action {
  constructor() {
    super();

    //L'id de la forme dont on va construire le centre
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
    shape.isCenterShown = !shape.isCenterShown;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId);
    shape.isCenterShown = !shape.isCenterShown;
  }
}
