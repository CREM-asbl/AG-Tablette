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
      oldBiface: this.oldBiface,
    };
    return save;
  }

  initFromObject(save) {
    this.involvedShapesIds = save.involvedShapesIds;
    this.oldBiface = save.oldBiface;
  }

  checkDoParameters() {
    if (!this.involvedShapesIds.length) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.involvedShapesIds.length && this.involvedShapesIds.length != this.oldBiface.length) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
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

    this.involvedShapesIds.forEach((id, idx) => {
      let s = app.workspace.getShapeById(id);
      s.isBiface = this.oldBiface[idx];
    });
  }
}
