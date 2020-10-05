import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';

export class CreateCircleAction extends Action {
  constructor() {
    super('CreateCircleAction');

    // points of the shape to create
    this.points = [];

    // name of the quadrilateral to create (rectangle, losange, parallélogramme, trapèze)
    this.circleName = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.arcCenter = save.arcCenter;
    this.points = save.points;
    this.circleName = save.circleName;
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
    this.arcCenter.name = 'arcCenter';
    this.points[0].name = 'firstPoint';

    let shape;
    if (this.circleName == 'Circle') {
      shape = new Shape({
        id: this.shapeId,
        segments: [
          new Segment(
            this.points[0],
            this.points[0],
            null,
            null,
            this.arcCenter
          ),
        ],
        name: this.circleName,
        familyName: 'circle-shape',
      });
    } else if (this.circleName == 'CirclePart') {
      this.points[1].name = 'secondPoint';
      shape = new Shape({
        id: this.shapeId,
        segments: [
          new Segment(this.arcCenter, this.points[0]),
          new Segment(
            this.points[0],
            this.points[1],
            null,
            null,
            this.arcCenter,
            true
          ),
          new Segment(this.points[1], this.arcCenter),
        ],
        name: this.circleName,
        familyName: 'circle-shape',
      });
    } else if (this.circleName == 'CircleArc') {
      this.points[1].name = 'secondPoint';
      shape = new Shape({
        id: this.shapeId,
        segments: [
          new Segment(
            this.points[0],
            this.points[1],
            null,
            null,
            this.arcCenter,
            true
          ),
        ],
        name: this.circleName,
        familyName: 'circle-shape',
      });
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
