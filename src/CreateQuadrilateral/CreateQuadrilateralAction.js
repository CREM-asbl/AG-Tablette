import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';

export class CreateQuadrilateralAction extends Action {
  constructor() {
    super('CreateQuadrilateralAction');

    // points of the shape to create
    this.points = [];

    // name of the quadrilateral to create (rectangle, losange, parallélogramme, trapèze)
    this.quadrilateralName = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.points = save.points;
    this.quadrilateralName = save.quadrilateralName;
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
    this.points[1].name = 'secondPoint';
    this.points[2].name = 'thirdPoint';
    this.points[3].name = 'fourthPoint';

    let shape = new Shape({
      id: this.shapeId,
      segments: [
        new Segment(this.points[0], this.points[1]),
        new Segment(this.points[1], this.points[2]),
        new Segment(this.points[2], this.points[3]),
        new Segment(this.points[3], this.points[0]),
      ],
      name: this.quadrilateralName,
      familyName: '4-corner-shape',
    });
    shape.recalculateHeight();
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
