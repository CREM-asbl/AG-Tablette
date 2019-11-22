import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';

export class DeleteAction extends Action {
  constructor() {
    super();

    this.name = 'DeleteAction';

    this.involvedShapes = null;

    /*
        Si la forme à supprimer fait partie d'un userGroup:
         */

    //l'id de ce userGroup
    this.userGroupId = null;

    //S'il restait 1 forme dans le userGroup, l'id de cette forme
    this.userGroupLastShapeId = null;

    //Si le groupe doit être supprimé, son index dans le tableau des groupes
    this.userGroupIndex = null;

    //Le userGroup doit-il être supprimé (car vide) ?
    this.deleteUserGroup = false;
  }

  saveToObject() {
    let save = {
      involvedShapes: this.involvedShapes.map(s => s.saveToObject()),
      nbShapes: this.involvedShapes.length,
      userGroupId: this.userGroupId,
      userGroupLastShapeId: this.userGroupLastShapeId,
      userGroupIndex: this.userGroupIndex,
      deleteUserGroup: this.deleteUserGroup,
    };
    return save;
  }

  initFromObject(save) {
    this.involvedShapes = save.involvedShapes.map(shape => {
      let newShape = new Shape({ x: 0, y: 0 }, []);
      newShape.initFromObject(shape);
      return newShape;
    });
    this.userGroupId = save.userGroupId;
    this.userGroupLastShapeId = save.userGroupLastShapeId;
    this.userGroupIndex = save.userGroupIndex;
    this.deleteUserGroup = save.deleteUserGroup;
  }

  checkDoParameters() {
    if (!this.involvedShapes) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.involvedShapes) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    let userGroup = app.workspace.getShapeGroup(this.involvedShapes[0]);

    this.involvedShapes.forEach(s => {
      if (userGroup) userGroup.deleteShape(s);
      app.workspace.deleteShape(s);
    });

    if (userGroup) {
      this.userGroupId = userGroup.id;
      this.userGroupIndex = app.workspace.getGroupIndex(userGroup);
      app.workspace.deleteGroup(userGroup);
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let userGroup;

    if (this.involvedShapes.length >= 2) {
      userGroup = new ShapeGroup(this.involvedShapes[0], this.involvedShapes[1]);
      userGroup.id = this.userGroupId;
      app.workspace.addGroup(userGroup, this.userGroupIndex);
    }

    this.involvedShapes.forEach((s, id) => {
      app.workspace.addShape(s);
      if (userGroup && id >= 2) userGroup.addShape(s);
    });
  }
}
