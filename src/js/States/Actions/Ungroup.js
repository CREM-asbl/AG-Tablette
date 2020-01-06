import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';

export class UngroupAction extends Action {
  constructor() {
    super();

    this.name = 'UngroupAction';

    //L'id du groupe que l'on supprime
    this.groupId = null;

    //Liste des id des formes du groupe qui a été supprimé
    this.groupShapesIds = null;

    //Index (dans le tableau de groupes) du groupe qui a été supprimé
    this.groupIndex = null;
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
    this.groupId = save.groupId;
    this.groupShapesIds = save.groupShapesIds;
    this.groupIndex = save.groupIndex;
  }

  checkDoParameters() {
    if (!this.groupId) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.groupId || !Number.isFinite(this.groupIndex)) return false;
    if (!this.groupShapesIds || this.groupShapesIds.length < 2) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.groupShapesIds = [];
    let group = app.workspace.getGroup(this.groupId);
    this.groupIndex = app.workspace.getGroupIndex(group);

    this.groupShapesIds = [...group.shapesIds];
    app.workspace.deleteGroup(group);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let group = new ShapeGroup(0, 1);
    group.id = this.groupId;
    group.shapesIds = [...this.groupShapesIds];
    console.log(group);
    app.workspace.addGroup(group, this.groupIndex);
  }
}
