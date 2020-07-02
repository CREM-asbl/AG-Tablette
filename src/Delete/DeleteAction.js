import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';

export class DeleteAction extends Action {
  constructor() {
    super('DeleteAction');

    // point ou shape
    this.mode = null;

    // le segmentPoint a supprimer
    this.point = null;

    // les shapes a supprimer
    this.involvedShapes = null;

    // les index des formes supprimées
    this.involvedShapesIndexes = null;

    /*
     * Si la forme à supprimer fait partie d'un groupe:
     */

    // Le usergroup
    this.userGroup = null;

    // Son index dans le tableau des groupes
    this.userGroupIndex = null;
  }

  initFromObject(save) {
    this.mode = save.mode;
    if (save.mode == 'shape') {
      this.involvedShapes = save.involvedShapes.map(shape => Shape.fromObject(shape));
      this.involvedShapesIndexes = save.involvedShapesIndexes;
      if (!save.involvedShapesIndexes) {
        // for update history from 1.0.0
        this.involvedShapesIndexes = save.involvedShapes.map(() => 0);
      }
      this.userGroupId = save.userGroupId;
      this.userGroupLastShapeId = save.userGroupLastShapeId;
      this.userGroupIndex = save.userGroupIndex;
      if (save.involvedShapesIndexes) {
        this.involvedShapesIndexes = save.involvedShapesIndexes;
        this.userGroup = save.userGroup;
      } else {
        // for update history from 1.0.0
        this.involvedShapesIndexes = this.involvedShapes.map(shape =>
          ShapeManager.getShapeIndex(shape),
        );
        let detail = {
          name: 'DeleteAction',
          mode: this.mode,
          involvedShapes: this.involvedShapes,
          involvedShapesIndexes: this.involvedShapesIndexes,
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
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.mode == 'shape') {
      let userGroup = GroupManager.getShapeGroup(this.involvedShapes[0]);

      this.involvedShapesIndexes = [];
      this.involvedShapes.forEach(s => {
        /*
          Pas besoin de trier involvedShapes par index décroissants;
          dans undo(), en les ajoutant dans l'ordre inverse, les index resteront
          bien identiques (car on récupère l'index de s après avoir supprimé les
          formes précédentes!).
         */
        let index = ShapeManager.getShapeIndex(s);
        if (index == -1) console.error('Shape not found');
        this.involvedShapesIndexes.push(index);

        if (userGroup) userGroup.deleteShape(s.id);
        ShapeManager.deleteShape(s);
      });

      if (userGroup) {
        this.userGroupId = userGroup.id;
        this.userGroupIndex = GroupManager.getGroupIndex(userGroup);
        GroupManager.deleteGroup(userGroup);
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

      let shapeCopies = this.involvedShapes.map(s => s.copy(true));
      let sIndexes = this.involvedShapesIndexes.map(s => s);

      //reverse: pour garder le même index qu'avant la suppression!
      shapeCopies.reverse();
      sIndexes.reverse();

      if (shapeCopies.length >= 2) {
        userGroup = new ShapeGroup(shapeCopies[0].id, shapeCopies[1].id);
        userGroup.id = this.userGroupId;
        GroupManager.addGroup(userGroup, this.userGroupIndex);
      }

      shapeCopies.forEach((s, id) => {
        ShapeManager.addShape(s, sIndexes[id]);
        if (userGroup && id >= 2) userGroup.addShape(s.id);
      });
    } else {
      // point
      this.point.segment.addPoint(this.point);
    }
  }
}
