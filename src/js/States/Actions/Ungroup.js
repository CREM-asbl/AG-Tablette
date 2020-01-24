import { Action } from './Action';
import { ShapeGroup } from '../../Objects/ShapeGroup';
import { GroupManager } from '../../GroupManager';

export class UngroupAction extends Action {
  constructor() {
    super('UngroupAction');

    //Le groupe que l'on supprime
    this.group = null;

    //Index (dans le tableau de groupes) du groupe qui a été supprimé
    this.groupIdx = null;
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

    this.group = GroupManager.getGroup(this.group.id);
    GroupManager.deleteGroup(this.group);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let groupCopy = new ShapeGroup(0, 1);
    groupCopy.shapesIds = [...this.group.shapesIds];
    groupCopy.id = this.group.id;
    GroupManager.addGroup(groupCopy, this.groupIndex);
  }
}
