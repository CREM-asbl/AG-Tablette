import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';
import { Point } from '../../Objects/Point';

export class DeleteAction extends Action {
  constructor() {
    super('DeleteAction');

    // point ou shape
    this.mode = null;

    // le segmentPoint a supprimer
    this.point = null;

    // la shape qui contient le point
    this.shapeId = null;

    // les shapes a supprimer
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
      mode: this.mode,
      shapeId: this.shapeId,
    };
    if (save.mode == 'shape') {
      save.involvedShapes = this.involvedShapes.map(s => s.saveToObject());
      save.userGroupId = this.userGroupId;
      save.userGroupLastShapeId = this.userGroupLastShapeId;
      save.userGroupIndex = this.userGroupIndex;
      save.deleteUserGroup = this.deleteUserGroup;
    } else {
      save.point = this.point.saveToObject();
      save.segmentIndex = this.segmentIndex;
    }
    return save;
  }

  initFromObject(save) {
    this.mode = save.mode;
    this.shapeId = save.shapeId;
    if (save.mode == 'shape') {
      this.involvedShapes = save.involvedShapes.map(shape => {
        let newShape = new Shape({ x: 0, y: 0 }, []);
        newShape.initFromObject(newShape);
        return newShape;
      });
      this.userGroup = save.userGroup;
      this.userGroupIndex = save.userGroupIndex;
    } else {
      this.point = new Point();
      this.point.initFromObject(save.point);
    }
  }

  checkDoParameters() {
    if (!this.mode) return false;
    if (this.mode == 'point' && !this.point) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.mode) return false;
    if (this.mode == 'point' && !this.point) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.mode == 'shape') {
      if (this.userGroup) {
        this.userGroup.shapesIds.forEach(shapeId => app.workspace.deleteShape({ id: shapeId }));
        app.workspace.deleteGroup(this.userGroup);
      } else {
        app.workspace.deleteShape({ id: this.shapeId });
      }
    } else {
      // point
      let segment = this.point.segment;
      segment.deletePoint(this.point);
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    if (this.mode == 'shape') {
      let userGroup;

      let shapeCopies = this.involvedShapes.map(s => {
        let newShape = s.copy();
        newShape.id = s.id;
        return newShape;
      });

      if (shapeCopies.length >= 2) {
        userGroup = new ShapeGroup(shapeCopies[0].id, shapeCopies[1].id);
        userGroup.id = this.userGroupId;
        app.workspace.addGroup(userGroup, this.userGroupIndex);
      }

      shapeCopies.forEach((s, id) => {
        app.workspace.addShape(s);
        if (userGroup && id >= 2) userGroup.addShape(s.id);
      });
    } else {
      // point
      const shape = app.workspace.getShapeById(this.shapeId);
      const segments = shape.segments.filter(seg => seg.isPointOnSegment(this.point));
      if (segments.length > 1) console.error('a point cannot belong to multiple segments');
      segments[0].addPoint(this.point);
    }
  }
}
