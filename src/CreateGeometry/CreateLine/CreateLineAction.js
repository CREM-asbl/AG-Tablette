import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';

export class CreateLineAction extends Action {
  constructor() {
    super('CreateLineAction');

    // points of the shape to create
    this.coordinates = [];

    // name of the quadrilateral to create (StraightLine, ...)
    this.lineName = null;

    // reference of the shape (for parallele or perpendicular)
    this.referenceId = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.coordinates = save.coordinates;
    this.lineName = save.lineName;
    this.referenceId = save.referenceId;
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

    let path = [
      'M',
      this.coordinates[0].x,
      this.coordinates[0].y,
      'L',
      this.coordinates[1].x,
      this.coordinates[1].y,
    ].join(' ');

    let shape;
    if (
      this.lineName == 'StraightLine' ||
      this.lineName == 'ParalleleStraightLine' ||
      this.lineName == 'PerpendicularStraightLine'
    ) {
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        name: this.lineName,
        familyName: 'Line',
      });
      shape.segments[0].isInfinite = true;
    } else if (
      this.lineName == 'SemiStraightLine' ||
      this.lineName == 'ParalleleSemiStraightLine' ||
      this.lineName == 'PerpendicularSemiStraightLine'
    ) {
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        name: this.lineName,
        familyName: 'Line',
      });
      shape.segments[0].isSemiInfinite = true;
    } else if (
      this.lineName == 'Segment' ||
      this.lineName == 'ParalleleSegment' ||
      this.lineName == 'PerpendicularSegment'
    ) {
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        name: this.lineName,
        familyName: 'Line',
      });
    }

    if (this.reference) {
      shape.referenceId = this.referenceId;
      this.reference.shape.hasGeometryReferenced.push(shape.id);
    }

    shape.points[0].name = 'firstPoint';
    shape.points[1].name = 'secondPoint';

    window.dispatchEvent(new CustomEvent('refresh'));
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
