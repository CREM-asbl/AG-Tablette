import { app } from '../../App';
import { Action } from './Action';
import { ShapeGroup } from '../../Objects/ShapeGroup';
/**
 * Représente la création d'un groupe ou l'ajout d'une forme à un groupe existant
 */
export class GroupAction extends Action {
  constructor() {
    super();

    this.name = 'GroupAction';

    //Type d'action: nouveau groupe, ajout d'une forme ou fusion de 2 groupes
    //TODO: on pourrait diviser cette classe Action en 3 classes pour la simplifier:
    //          AddGroupAction, CreateGroupAction et MergeGroupAction
    this.type = null; //new, add, merge

    //L'id de la forme que l'on ajoute
    this.shapeId = null;

    //L'id de la seconde forme (en cas de création de groupe)
    this.secondShapeId = null;

    //L'id du groupe que l'on crée ou auquel on ajoute une forme
    this.groupId = null;

    //L'id du groupe avec lequel on fusionne le groupe (en cas de fusion)
    this.otherGroupId = null;

    //Liste des id des formes du groupe qui a été supprimé lors d'une fusion
    this.oldGroupShapesIds = null;

    //Index (dans le tableau de groupes) du groupe qui a été supprimé lors d'une fusion
    this.oldGroupIndex = null;
  }

  saveToObject() {
    let save = {
      type: this.type,
      shapeId: this.shapeId,
      secondShapeId: this.secondShapeId,
      groupId: this.groupId,
      otherGroupId: this.otherGroupId,
      oldGroupShapesIds: this.oldGroupShapesIds,
      oldGroupIndex: this.oldGroupIndex,
    };
    return save;
  }

  initFromObject(save) {
    this.type = save.type;
    this.shapeId = save.shapeId;
    this.secondShapeId = save.secondShapeId;
    this.groupId = save.groupId;
    this.otherGroupId = save.otherGroupId;
    this.oldGroupShapesIds = save.oldGroupShapesIds;
    this.oldGroupIndex = save.oldGroupIndex;
  }

  checkDoParameters() {
    if (this.type != 'new' && this.type != 'add' && this.type != 'merge') return false;

    if (this.type == 'new' && (!this.shapeId || !this.secondShapeId)) return false;
    if (this.type == 'add' && (!this.shapeId || !this.groupId)) return false;
    if (this.type == 'merge' && (!this.groupId || !this.otherGroupId)) return false;
    return true;
  }

  checkUndoParameters() {
    if (this.type != 'new' && this.type != 'add' && this.type != 'merge') return false;

    if (this.type == 'new' && !this.groupId) return false;
    if (this.type == 'add' && (!this.shapeId || !this.groupId)) return false;
    if (this.type == 'merge') {
      if (!this.groupId || !Number.isFinite(this.oldGroupIndex)) return false;
      if (!this.oldGroupShapesIds || this.oldGroupShapesIds.length < 2) return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.type == 'new') {
      let group = new ShapeGroup(this.shapeId, this.secondShapeId);
      if (this.groupId) group.id = this.groupId;
      else this.groupId = group.id;
      app.workspace.addGroup(group);
    } else if (this.type == 'add') {
      let group = app.workspace.getGroup(this.groupId);
      group.addShape(this.shapeId);
    } else {
      let group1 = app.workspace.getGroup(this.groupId),
        group2 = app.workspace.getGroup(this.otherGroupId);

      this.oldGroupShapesIds = [...group2.shapesIds];
      this.oldGroupIndex = app.workspace.getGroupIndex(group2);

      group1.shapesIds = [...group1.shapesIds, ...group2.shapesIds];
      app.workspace.deleteGroup(group2);
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    if (this.type == 'new') {
      let group = app.workspace.getGroup(this.groupId);
      app.workspace.deleteGroup(group);
    } else if (this.type == 'add') {
      let group = app.workspace.getGroup(this.groupId);
      group.deleteShape(this.shapeId);
    } else {
      let group1 = app.workspace.getGroup(this.groupId),
        group2 = new ShapeGroup(0, 1);
      group2.id = this.otherGroupId;
      group2.shapesIds = [...this.oldGroupShapesIds];
      group1.shapesIds = group1.shapesIds.filter(id1 => group2.shapesIds.every(id2 => id2 != id1));
      app.workspace.addGroup(group2, this.oldGroupIndex);
    }
  }
}
