import { app } from '../../App';
import { Action } from './Action';

export class BifaceAction extends Action {
  constructor() {
    super('BifaceAction');

    this.involvedShapesIds = null;

    this.oldBiface = null;
  }

  saveToObject() {
    let save = {
      involvedShapesIds: this.involvedShapesIds,
      oldBiface: this.eoldBiface,
    };
    return save;
  }

  initFromObject(save) {
    this.involvedShapesIds = save.involvedShapesIds;
    this.oldBiface = save.oldBiface;
  }

  checkDoParameters() {
    if (this.involvedShapesIds.length != this.oldBiface.length) return false;
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let value_to_set = !this.oldBiface.every(old => old);
    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      s.isBiface = value_to_set;
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
