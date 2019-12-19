import { app } from '../../App';
import { Action } from './Action';
import { Point } from '../../Objects/Point';

export class DivideAction extends Action {
  constructor() {
    super();

    this.name = 'DivideAction';

    //L'id de la forme
    this.shapeId = null;

    //Nombre de parties de découpe (numberOfparts-1 points)
    this.numberOfparts = null;

    //Mode de découpe: 'segment' ou 'two_points'
    this.mode = null;

    //Index du segment (dans le tableau des segments), si mode segment
    this.segmentIndex = null;

    /**
     * Premier point (si mode two_points)
     * {
     *     'type': 'point',
     *     'pointType': 'vertex' ou 'segmentPoint',
     *     'shape': Shape,
     *     'index': int,
     *     'coordinates': Point
     * }
     */
    this.firstPoint = null;

    /**
     * Second point (si mode two_points)
     * {
     *     'type': 'point',
     *     'pointType': 'vertex' ou 'segmentPoint',
     *     'shape': Shape,
     *     'index': int,
     *     'coordinates': Point
     * }
     */
    this.secondPoint = null;

    //Tableau des coordonnées des points créés
    this.createdPoints = null;
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      numberOfparts: this.numberOfparts,
      mode: this.mode,
      segmentIndex: this.segmentIndex,
      createdPoints: this.createdPoints.map(pt => pt.saveToObject()),
    };
    if (this.firstPoint) save.firstPoint = this.firstPoint.saveToObject();
    if (this.secondPoint) save.secondPoint = this.secondPoint.saveToObject();
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.numberOfparts = save.numberOfparts;
    this.mode = save.mode;
    this.segmentIndex = save.segmentIndex;
    const shape = app.workspace.getShapeById(this.shapeId);
    const segment = shape.segments[save.segmentIndex];
    if (save.firstPoint) {
      this.firstPoint = new Point();
      this.firstPoint.initFromObject(save.firstPoint);
      this.firstPoint.shape = shape;
      this.firstPoint.segment = segment;
    }
    if (save.secondPoint) {
      this.secondPoint = new Point();
      this.secondPoint.initFromObject(save.secondPoint);
      this.secondPoint.shape = shape;
      this.secondPoint.segment = segment;
    }
    this.createdPoints = save.createdPoints.map(pt => new Point(pt));
  }

  checkDoParameters() {
    if (!this.shapeId || !Number.isFinite(this.numberOfparts)) return false;
    if (this.mode != 'segment' && this.mode != 'two_points') return false;
    if (this.mode == 'segment' && !Number.isFinite(this.segmentIndex)) return false;
    if (this.mode == 'two_points' && (!this.firstPoint || !this.secondPoint)) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    if (this.mode != 'segment' && this.mode != 'two_points') return false;
    if (!this.createdPoints) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.createdPoints = [];
    let shape = app.workspace.getShapeById(this.shapeId);

    if (this.mode == 'segment') {
      let segment = shape.segments[this.segmentIndex];
      if (segment.arcCenter) {
        this.segmentModeAddArcPoints();
      } else {
        this.segmentModeAddSegPoints();
      }
    } else {
      let segment,
        pt1 = this.firstPoint,
        pt2 = this.secondPoint;
      if (!this.segmentIndex) {
        segment = pt1.segment;
        this.segmentIndex = segment.idx;
      } else {
        segment = shape.segments[this.segmentIndex];
      }
      pt1.segment = segment;
      if (pt1.segment.arcCenter) {
        this.pointsModeAddArcPoints(pt1, pt2, segment);
      } else {
        this.pointsModeAddSegPoints(pt1, pt2, segment);
      }
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = app.workspace.getShapeById(this.shapeId),
      segments = shape.segments,
      segment;

    console.log(this);

    if (this.segmentIndex == undefined) {
      segment = this.firstPoint.segment;
    } else {
      segment = segments[this.segmentIndex];
    }

    this.createdPoints.forEach(pt => {
      segment.deletePoint(pt);
    });
  }

  segmentModeAddArcPoints() {
    this.createdPoints = [];

    let shape = app.workspace.getShapeById(this.shapeId),
      segment = shape.segments[this.segmentIndex],
      center = segment.arcCenter,
      firstAngle = center.getAngle(segment.vertexes[0]),
      secondAngle = center.getAngle(segment.vertexes[1]);
    if (segment.counterclockwise) [firstAngle, secondAngle] = [secondAngle, firstAngle];
    if (segment.vertexes[0].equal(segment.vertexes[1])) secondAngle += 2 * Math.PI;
    else if (firstAngle > secondAngle) secondAngle += 2 * Math.PI;

    // Pour un cercle entier, on ajoute un point de division supplémentaire
    if (shape.isCircle()) {
      this.createdPoints.push(new Point(segment.vertexes[1]));
      segment.addPoint(new Point(segment.vertexes[1]));
    }

    let partAngle = (secondAngle - firstAngle) / this.numberOfparts,
      radius = segment.radius;

    for (let i = 1, nextPt = segment.vertexes[0]; i < this.numberOfparts; i++) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      nextPt = nextPt.copy();
      nextPt.setCoordinates({ x: newX, y: newY });
      segment.addPoint(nextPt);
      this.createdPoints.push(nextPt.copy());
    }
  }

  segmentModeAddSegPoints() {
    const shape = app.workspace.getShapeById(this.shapeId),
      segment = shape.segments[this.segmentIndex];
    this.pointsModeAddSegPoints(segment.vertexes[0], segment.vertexes[1], segment);
  }

  pointsModeAddArcPoints(pt1, pt2, segment) {
    this.createdPoints = [];

    let shape = app.workspace.getShapeById(this.shapeId),
      center = segment.arcCenter,
      firstAngle = center.getAngle(pt1),
      secondAngle = center.getAngle(pt2);
    if (!shape.isCircle()) {
      let firstVertexAngle = segment.arcCenter.getAngle(segment.vertexes[0]),
        secondVertexAngle = segment.arcCenter.getAngle(segment.vertexes[1]);
      if (segment.counterclockwise)
        [firstVertexAngle, secondVertexAngle] = [secondVertexAngle, firstVertexAngle];
      if (firstAngle < firstVertexAngle) firstAngle += Math.PI * 2;
      if (secondAngle < firstVertexAngle) secondAngle += Math.PI * 2;
      if (secondVertexAngle < firstVertexAngle) secondVertexAngle += Math.PI * 2;
      if ((secondAngle < firstAngle) ^ segment.counterclockwise) {
        [firstAngle, secondAngle] = [secondAngle, firstAngle];
      }
    }
    if (secondAngle < firstAngle) secondAngle += Math.PI * 2;

    let partAngle = (secondAngle - firstAngle) / this.numberOfparts,
      radius = segment.radius;

    for (let i = 1, nextPt = pt1; i < this.numberOfparts; i++) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      nextPt = nextPt.copy();
      nextPt.setCoordinates({ x: newX, y: newY });
      segment.addPoint(nextPt);
      this.createdPoints.push(nextPt.copy());
    }
  }

  pointsModeAddSegPoints(pt1, pt2, segment) {
    const segLength = pt2.subCoordinates(pt1),
      part = new Point(segLength.x / this.numberOfparts, segLength.y / this.numberOfparts);

    this.createdPoints = [];
    for (let i = 1, nextPt = pt1.copy(); i < this.numberOfparts; i++) {
      nextPt = nextPt.addCoordinates(part);
      segment.addPoint(nextPt);
      this.createdPoints.push(nextPt.copy());
    }
  }
}
