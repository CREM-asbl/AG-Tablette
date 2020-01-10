import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';

export class UngroupAction extends Action {
  constructor() {
    super('UngroupAction');

    //Le groupe que l'on supprime
    this.group = null;

    //Index (dans le tableau de groupes) du groupe qui a été supprimé
    this.groupIdx = null;
  }

  saveToObject() {
    let save = {
      groupId: this.groupId,
      groupShapesIds: this.groupShapesIds,
      groupIndex: this.groupIndex,
    };
    return save;
  }

  initFromObject(save) {
    this.group = save.group;
    this.groupIdx = save.groupIdx;
  }

  checkDoParameters() {
    if (!this.group) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.groupId || !Number.isFinite(this.groupIndex)) return false;
    if (!this.groupShapesIds || this.groupShapesIds.length < 2) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    app.workspace.deleteGroup(this.group);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    app.workspace.addGroup(this.group, this.groupIndex);
  }
}
