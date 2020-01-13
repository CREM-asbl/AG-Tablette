import { app } from '../../App';
import { Action } from './Action';
import { ShapeGroup } from '../../Objects/ShapeGroup';
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

  saveToObject() {
    let save = {
      type: this.type,
      shapeId: this.shapeId,
      secondShapeId: this.secondShapeId,
      groupId: this.groupId,
      group: this.group,
      groupIdx: this.groupIdx,
      otherGroup: this.otherGroup,
      otherGroupIdx: this.otherGroupIdx,
    };
    return save;
  }

  initFromObject(save) {
    this.type = save.type;
    if (this.type == 'new') {
      this.shapeId = save.shapeId;
      this.secondShapeId = save.secondShapeId;
      this.groupId = save.groupId;
    } else if (this.type == 'add') {
      this.group = app.workspace.getGroup(save.group.id);
      this.shapeId = save.shapeId;
    } else {
      // merge
      this.group = app.workspace.getGroup(save.group.id);
      this.groupIdx = save.groupIdx;
      this.otherGroup = app.workspace.getGroup(save.otherGroup.id);
      this.otherGroupIdx = save.otherGroupIdx;
    }
  }

  checkDoParameters() {
    if (this.type != 'new' && this.type != 'add' && this.type != 'merge') {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    if (this.type == 'new' && (!this.groupId || !this.shapeId || !this.secondShapeId)) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    } else if (this.type == 'add' && (this.shapeId === undefined || !this.group)) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    } else if (
      this.type == 'merge' &&
      (!this.group ||
        this.groupIdx === undefined ||
        !this.otherGroup ||
        this.otherGroupIdx === undefined)
    ) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (this.type != 'new' && this.type != 'add' && this.type != 'merge') {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    if (this.type == 'new' && (!this.groupId || !this.shapeId || !this.secondShapeId)) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    } else if (this.type == 'add' && (this.shapeId === undefined || !this.group)) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    } else if (
      this.type == 'merge' &&
      (!this.group ||
        this.groupIdx === undefined ||
        !this.otherGroup ||
        this.otherGroupIdx === undefined)
    ) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.type == 'new') {
      let group = new ShapeGroup(this.shapeId, this.secondShapeId);
      group.id = this.groupId;
      app.workspace.addGroup(group);
    } else if (this.type == 'add') {
      this.group.addShape(this.shapeId);
    } else {
      // merge
      let group1 = this.group,
        group2 = this.otherGroup;

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
      this.group.deleteShape(this.shapeId);
    } else {
      let group1 = this.group,
        group2 = this.otherGroup;
      group1.shapesIds = group1.shapesIds.filter(id1 => group2.shapesIds.every(id2 => id2 != id1));
      app.workspace.addGroup(group2, this.otherGroupIdx);
    }
  }
}
