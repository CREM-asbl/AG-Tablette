import { Action } from '../Core/States/Action';
import { ShapeGroup } from '../Objects/ShapeGroup';
import { GroupManager } from '../Managers/GroupManager';

export class UngroupAction extends Action {
  constructor() {
    super('UngroupAction');

    //Le groupe que l'on supprime
    this.group = null;

    //Index (dans le tableau de groupes) du groupe qui a été supprimé
    this.groupIdx = null;
  }

  initFromObject(save) {
    if (save.group) {
      this.groupIdx = save.groupIdx;
      this.group = save.group;
    } else {
      // for update history from 1.0.0
      this.groupIdx = save.groupIndex;
      this.group = new ShapeGroup(0, 1);
      this.group.initFromObject({ id: save.groupId, shapesIds: save.groupShapesIds });
      window.dispatchEvent(
        new CustomEvent('update-history', {
          detail: {
            name: 'UngroupAction',
            group: this.group,
            groupIdx: this.groupIdx,
          },
        }),
      );
    }
  }

  checkDoParameters() {
    if (!this.group) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.group || this.groupIdx === undefined) {
      this.printIncompleteData();
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
