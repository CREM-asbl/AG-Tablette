import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';

export class CreateCircleAction extends Action {
  constructor() {
    super('CreateCircleAction');

    // points of the shape to create
    this.coordinates = [];

    // name of the quadrilateral to create (rectangle, losange, parallélogramme, trapèze)
    this.circleName = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.coordinates = save.coordinates;
    this.circleName = save.circleName;
    this.clockwise = save.clockwise;
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

    let points = this.coordinates.map(
      (coord) =>
        new Point({
          drawingEnvironment: app.mainDrawingEnvironment,
          coordinates: coord,
          type: 'vertex',
        }),
    );
    let segments = [];

    let idx = 0;
    if (this.circleName == 'Circle') {
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[1].id, points[1].id],
        arcCenterId: points[0].id,
      });
      segments.push(seg);
    }
    if (this.circleName == 'CirclePart') {
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[0].id, points[1].id],
      });
      segments.push(seg);
    }
    if (this.circleName == 'CirclePart' || this.circleName == 'CircleArc') {
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[1].id, points[2].id],
        arcCenterId: points[0].id,
        counterclockwise: !this.clockwise,
      });
      segments.push(seg);
    }
    if (this.circleName == 'CirclePart') {
      let seg = new Segment({
        drawingEnvironment: app.mainDrawingEnvironment,
        idx: idx++,
        vertexIds: [points[2].id, points[0].id],
      });
      segments.push(seg);
    }

    let shape = new Shape({
      id: this.shapeId,
      drawingEnvironment: app.mainDrawingEnvironment,
      segmentIds: segments.map((seg) => seg.id),
      pointIds: points.map((pt) => pt.id),
      name: this.circleName,
      familyName: 'circle-shape',
    });

    segments.forEach((seg, idx) => {
      seg.idx = idx;
      seg.shapeId = shape.id;
    });

    window.dispatchEvent(new CustomEvent('refresh'));

    // shape.points[0].name = 'arcCenter';
    // shape.points[1].name = 'firstPoint';
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
