import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';
import { Point } from '../../Objects/Point';
import { ShapeManager } from '../../ShapeManager';

export class DeleteAction extends Action {
  constructor() {
    super('DeleteAction');

    // point ou shape
    this.mode = null;

    // le segmentPoint a supprimer
    this.point = null;

    // les shapes a supprimer
    this.involvedShapes = null;

    // les index dans workspace des shapes supprimées
    this.shapesIdx = null;

    /*
        Si la forme à supprimer fait partie d'un userGroup:
         */

    // Le usergroup
    this.userGroup = null;

    // Son index dans le tableau des groupes
    this.userGroupIndex = null;
  }

  saveToObject() {
    // let save = {
    //   mode: this.mode,
    //   shapeId: this.shapeId,
    // };
    // if (save.mode == 'shape') {
    //   save.involvedShapes = this.involvedShapes.map(s => s.saveToObject());
    //   save.userGroupId = this.userGroupId;
    //   save.userGroupLastShapeId = this.userGroupLastShapeId;
    //   save.userGroupIndex = this.userGroupIndex;
    //   save.deleteUserGroup = this.deleteUserGroup;
    // } else {
    //   save.point = this.point.saveToObject();
    //   save.segmentIndex = this.segmentIndex;
    // }
    // return save;
  }

  initFromObject(save) {
    this.mode = save.mode;
    if (save.mode == 'shape') {
      this.involvedShapes = save.involvedShapes.map(shape => {
        let newShape = new Shape({ x: 0, y: 0 }, []);
        newShape.initFromObject(shape);
        newShape.id = shape.id;
        return newShape;
      });
      this.shapesIdx = save.shapesIdx;
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
        this.userGroup.shapesIds.forEach(id => ShapeManager.deleteShape({ id: id }));
        GroupManager.deleteGroup(this.userGroup);
      } else {
        this.involvedShapes.forEach(shape => ShapeManager.deleteShape(shape));
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
      if (this.userGroup) {
        let userGroup = new ShapeGroup(0, 1);
        userGroup.initFromObject(this.userGroup);
        userGroup.id = this.userGroup.id;
        GroupManager.addGroup(userGroup, this.userGroupIndex);
      }

      this.involvedShapes.forEach(s => {
        ShapeManager.addShape(s);
      });
    } else {
      // point
      this.point.segment.addPoint(this.point);
    }
  }
}
