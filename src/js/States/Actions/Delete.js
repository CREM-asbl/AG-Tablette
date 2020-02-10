import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';
import { Point } from '../../Objects/Point';
import { ShapeManager } from '../../ShapeManager';
import { GroupManager } from '../../GroupManager';

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

  initFromObject(save) {
    this.mode = save.mode;
    if (save.mode == 'shape') {
      this.involvedShapes = save.involvedShapes.map(shape => {
        let newShape = new Shape({ x: 0, y: 0 }, []);
        newShape.initFromObject(shape);
        newShape.id = shape.id;
        return newShape;
      });
      this.userGroupIndex = save.userGroupIndex;
      if (save.shapesIdx) {
        this.shapesIdx = save.shapesIdx;
        this.userGroup = save.userGroup;
      } else {
        // for update history from 1.0.0
        this.shapesIdx = this.involvedShapes.map(shape => ShapeManager.getShapeIndex(shape));
        let detail = {
          name: 'DeleteAction',
          mode: this.mode,
          involvedShapes: this.involvedShapes,
          shapesIdx: this.shapesIdx,
        };
        if (save.userGroupId) {
          this.userGroup = new ShapeGroup(0, 1);
          this.userGroup.initFromObject({
            id: save.userGroupId,
            shapesIds: this.involvedShapes.map(s => s.id),
          });
          detail.userGroupIndex = this.userGroupIndex;
          detail.userGroup = this.userGroup;
        }
        window.dispatchEvent(new CustomEvent('update-history', { detail: detail }));
      }
    } else {
      this.point = new Point();
      this.point.initFromObject(save.point);
      if (save.segmentIndex) {
        // for update history from 1.0.0
        this.point.segment = ShapeManager.getShapeById(save.shapeId).segments[save.segmentIndex];
        window.dispatchEvent(
          new CustomEvent('update-history', {
            detail: {
              name: 'DeleteAction',
              mode: this.mode,
              point: this.point,
            },
          }),
        );
      }
    }
  }

  checkDoParameters() {
    if (!this.mode || (this.mode == 'point' && !this.point)) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    this.checkDoParameters();
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
