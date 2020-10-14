import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';

export class CreateLineAction extends Action {
  constructor() {
    super('CreateLineAction');

    // points of the shape to create
    this.points = [];

    // name of the quadrilateral to create (StraightLine, ...)
    this.lineName = null;

    // reference of the shape (for parallele or perpendicular)
    this.reference = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.points = save.points;
    this.lineName = save.lineName;
    this.reference = save.reference;
    this.shapeId = save.shapeId;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    // if (!(this.shapeToCreate instanceof Shape)) {
    //   this.printIncompleteData();
    //   return false;
    // }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    // if (!this.shapeId) {
    //   this.printIncompleteData();
    //   return false;
    // }
    return true;
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;
    this.points[0].name = 'firstPoint';
    if (this.points[1]) {
      this.points[1].name = 'secondPoint';
    }

    let shape;
    if (this.lineName == 'StraightLine') {
      shape = new Shape({
        id: this.shapeId,
        segments: [
          new Segment(
            this.points[0],
            this.points[1],
            null,
            null,
            null,
            null,
            true
          ),
        ],
        name: this.lineName,
        familyName: 'Line',
      });
    } else if (this.lineName == 'ParalleleStraightLine') {
      let segment = Segment.segmentWithAnglePassingThroughPoint(
        this.reference.getAngleWithHorizontal(),
        this.points[0]
      );
      segment.isInfinite = true;
      shape = new Shape({
        id: this.shapeId,
        segments: [segment],
        referenceShapeId: this.reference.shape.id,
        referenceSegmentIdx: this.reference.idx,
        name: this.lineName,
        familyName: 'Line',
      });
    } else if (this.lineName == 'PerpendicularStraightLine') {
      let segment = Segment.segmentWithAnglePassingThroughPoint(
        this.reference.getAngleWithHorizontal() + Math.PI / 2,
        this.points[0]
      );
      segment.isInfinite = true;
      shape = new Shape({
        id: this.shapeId,
        segments: [segment],
        referenceShapeId: this.reference.shape.id,
        referenceSegmentIdx: this.reference.idx,
        name: this.lineName,
        familyName: 'Line',
      });
    }
    if (this.reference) {
      this.reference.shape.hasGeometryReferenced.push(shape.id);
    }
    // shape.setGeometryConstructionSpec();
    ShapeManager.addShape(shape);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = ShapeManager.getShapeById(this.shapeId);
    ShapeManager.deleteShape(shape);
  }
}
