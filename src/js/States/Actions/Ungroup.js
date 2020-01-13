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
      group: this.group,
      groupIdx: this.groupIdx,
    };
    return save;
  }

  initFromObject(save) {
    this.group = save.group;
    this.groupIdx = save.groupIdx;
  }

  checkDoParameters() {
    if (!this.group) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.group || this.groupIdx === undefined) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.group = app.workspace.getGroup(this.group.id);
    app.workspace.deleteGroup(this.group);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let groupCopy = new ShapeGroup(0, 1);
    groupCopy.shapesIds = [...this.group.shapesIds];
    groupCopy.id = this.group.id;
    app.workspace.addGroup(groupCopy, this.groupIndex);
  }
}
