import { Action } from './Action';
import { ShapeManager } from '../../ShapeManager';

export class BifaceAction extends Action {
  constructor() {
    super('BifaceAction');

    this.involvedShapesIds = null;

    this.oldBiface = null;
  }

  initFromObject(save) {
    if (save.involvedShapesIds) {
      this.involvedShapesIds = save.involvedShapesIds;
      this.oldBiface = save.oldBiface;
    } else {
      // for update history from 1.0.0
      let involvedShapes = ShapeManager.getAllBindedShapes(
        ShapeManager.getShapeById(save.shapeId),
        true,
      );
      this.involvedShapesIds = involvedShapes.map(s => s.id);
      this.oldBiface = involvedShapes.map(s => s.isBiface);
      window.dispatchEvent(
        new CustomEvent('update-history', {
          detail: {
            name: 'UngroupAction',
            involvedShapesIds: this.involvedShapesIds,
            oldBiface: this.oldBiface,
          },
        }),
      );
    }
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
      let s = ShapeManager.getShapeById(id);
      s.isBiface = value_to_set;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, idx) => {
      let s = ShapeManager.getShapeById(id);
      s.isBiface = this.oldBiface[idx];
    });
  }
}
