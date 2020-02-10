import { Action } from './Action';
import { ShapeGroup } from '../../Objects/ShapeGroup';
import { GroupManager } from '../../GroupManager';
/**
 * Représente la création d'un groupe ou l'ajout d'une forme à un groupe existant
 */
export class GroupAction extends Action {
  constructor() {
    super('GroupAction');

    //TODO: on pourrait diviser cette classe Action en 3 classes pour la simplifier:
    //          AddGroupAction, CreateGroupAction et MergeGroupAction

    //Type d'action: nouveau groupe, ajout d'une forme ou fusion de 2 groupes
    this.type = null; //new, add, merge

    // L'id de la forme que l'on ajoute
    this.shapeId = null;

    // L'id de la seconde forme (en cas de création de groupe)
    this.secondShapeId = null;

    // L'id du groupe que l'on crée
    this.groupId = null;

    // Le groupe auquel on ajoute une forme ou fusionne
    this.group = null;

    // L'index du groupe dans le tableau des groupes
    this.groupIdx = null;

    // L'autre groupe que l'on fusionne
    this.otherGroup = null;

    // L'index du groupe que l'on fusionne dans le tableau des groupes
    this.otherGroupIdx = null;
  }

  initFromObject(save) {
    this.type = save.type;
    if (this.type == 'new') {
      this.shapeId = save.shapeId;
      this.secondShapeId = save.secondShapeId;
      this.groupId = save.groupId;
    } else if (this.type == 'add') {
      this.shapeId = save.shapeId;
      if (save.group) {
        this.group = GroupManager.getGroup(save.group.id);
      } else {
        // for update history from 1.0.0
        this.group = GroupManager.getGroup(save.groupId);
        window.dispatchEvent(
          new CustomEvent('update-history', {
            detail: {
              name: 'GroupAction',
              type: 'add',
              shapeId: this.shapeId,
              group: this.group,
            },
          }),
        );
      }
    } else {
      // merge
      if (save.group) {
        this.group = GroupManager.getGroup(save.group.id);
        this.groupIdx = save.groupIdx;
        this.otherGroup = save.otherGroup;
        this.otherGroupIdx = save.otherGroupIdx;
      } else {
        // for update history from 1.0.0
        this.group = GroupManager.getGroup(save.groupId);
        this.groupIdx = GroupManager.getGroupIndex(this.group);
        this.otherGroup = GroupManager.getGroup(save.otherGroupId);
        this.otherGroupIdx = GroupManager.getGroupIndex(this.otherGroup);
        window.dispatchEvent(
          new CustomEvent('update-history', {
            detail: {
              name: 'GroupAction',
              type: 'merge',
              group: this.group,
              groupIdx: this.groupIdx,
              otherGroup: this.otherGroup,
              otherGroupIdx: this.otherGroupIdx,
            },
          }),
        );
      }
    }
  }

  checkDoParameters() {
    if (this.type != 'new' && this.type != 'add' && this.type != 'merge') {
      this.printIncompleteData();
      return false;
    }
    if (this.type == 'new' && (!this.groupId || !this.shapeId || !this.secondShapeId)) {
      this.printIncompleteData();
      return false;
    } else if (this.type == 'add' && (this.shapeId === undefined || !this.group)) {
      this.printIncompleteData();
      return false;
    } else if (
      this.type == 'merge' &&
      (!this.group ||
        this.groupIdx === undefined ||
        !this.otherGroup ||
        this.otherGroupIdx === undefined)
    ) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (this.type != 'new' && this.type != 'add' && this.type != 'merge') {
      this.printIncompleteData();
      return false;
    }
    if (this.type == 'new' && (!this.groupId || !this.shapeId || !this.secondShapeId)) {
      this.printIncompleteData();
      return false;
    } else if (this.type == 'add' && (this.shapeId === undefined || !this.group)) {
      this.printIncompleteData();
      return false;
    } else if (
      this.type == 'merge' &&
      (!this.group ||
        this.groupIdx === undefined ||
        !this.otherGroup ||
        this.otherGroupIdx === undefined)
    ) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.type == 'new') {
      let group = new ShapeGroup(this.shapeId, this.secondShapeId);
      group.id = this.groupId;
      GroupManager.addGroup(group);
    } else if (this.type == 'add') {
      this.group.addShape(this.shapeId);
    } else {
      // merge
      let group1 = this.group,
        group2 = this.otherGroup;

      group1.shapesIds = [...group1.shapesIds, ...group2.shapesIds];
      GroupManager.deleteGroup(group2);
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    if (this.type == 'new') {
      let group = GroupManager.getGroup(this.groupId);
      GroupManager.deleteGroup(group);
    } else if (this.type == 'add') {
      this.group.deleteShape(this.shapeId);
    } else {
      let group1 = this.group,
        group2 = this.otherGroup;
      group1.shapesIds = group1.shapesIds.filter(id1 => group2.shapesIds.every(id2 => id2 != id1));
      GroupManager.addGroup(group2, this.otherGroupIdx);
    }
  }
}
