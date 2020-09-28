import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';

export class RegularCreateAction extends Action {
  constructor() {
    super('RegularCreateAction');

    // numbre of points in the shape
    this.numberOfPoints = 4;

    // first point of the shape to create
    this.firstPoint = null;

    // second point of the shape to create
    this.secondPoint = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.numberOfPoints = save.numberOfPoints;
    this.firstPoint = save.firstPoint;
    this.secondPoint = save.secondPoint;
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

    this.firstPoint.name = 'firstPoint';
    this.secondPoint.name = 'secondPoint';

    let newShape = this.createPolygon();

    ShapeManager.addShape(newShape);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = ShapeManager.getShapeById(this.shapeId);
    ShapeManager.deleteShape(shape);
  }

  createPolygon() {
    let newSegments = this.getNewSegments();

    let shape = new Shape({
      segments: newSegments,
      id: this.shapeId,
      name: this.numberOfPoints + '_corner_shape',
      familyName: 'regular',
    });

    return shape;
  }

  getNewSegments() {
    let externalAngle = (Math.PI * 2) / this.numberOfPoints;

    let segments = [];

    segments.push(new Segment(this.firstPoint, this.secondPoint));

    let length = this.firstPoint.dist(this.secondPoint);

    let startAngle = Math.atan2(
      -(this.firstPoint.y - this.secondPoint.y),
      -(this.firstPoint.x - this.secondPoint.x)
    );

    for (let i = 0; i < this.numberOfPoints - 2; i++) {
      let dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      let dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      let np = segments[i].vertexes[1].addCoordinates(dx, dy);

      segments.push(new Segment(segments[i].vertexes[1], np));
    }

    segments.push(
      new Segment(
        segments[this.numberOfPoints - 2].vertexes[1],
        this.firstPoint
      )
    );

    return segments;
  }
}
