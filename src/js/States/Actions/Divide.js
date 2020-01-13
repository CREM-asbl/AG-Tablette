import { app } from '../../App';
import { Action } from './Action';
import { Point } from '../../Objects/Point';

export class DivideAction extends Action {
  constructor() {
    super('DivideAction');

    //Nombre de parties de découpe (numberOfparts-1 points)
    this.numberOfparts = null;

    //Mode de découpe: 'segment' ou 'two_points'
    this.mode = null;

    // Segment segment, si mode segment
    this.segment = null;

    // Premier point, si mode two_points
    this.firstPoint = null;

    // Second point, si mode two_points
    this.secondPoint = null;
  }

  saveToObject() {
    let save = {
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
    this.numberOfparts = save.numberOfparts;
    this.mode = save.mode;
    if (this.mode == 'segment') {
      this.segment = save.segment;
    } else {
      // two_points
      this.firstPoint = new Point();
      this.firstPoint.initFromObject(save.firstPoint);
      this.secondPoint = new Point();
      this.secondPoint.initFromObject(save.secondPoint);
    }
  }

  checkDoParameters() {
    if (!Number.isFinite(this.numberOfparts)) return false;
    if (this.mode != 'segment' && this.mode != 'two_points') return false;
    if (this.mode == 'segment' && !this.segment) return false;
    if (this.mode == 'two_points' && (!this.firstPoint || !this.secondPoint)) return false;
    return true;
  }

  checkUndoParameters() {
    if (this.mode != 'segment' && this.mode != 'two_points') return false;
    if (!this.createdPoints) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.mode == 'segment') {
      if (this.segment.arcCenter) this.segmentModeAddArcPoints();
      else this.segmentModeAddSegPoints();
    } else {
      let pt1 = this.firstPoint,
        pt2 = this.secondPoint;
      if (pt1.type == 'segmentPoint') this.segment = pt1.segment;
      else if (pt2.type == 'segmentPoint') this.segment = pt2.segment;
      else {
        this.segment =
          (Math.abs(pt2.segment.idx - pt1.segment.idx) > 1) ^ // si premier et dernier segment
          (pt1.segment.idx > pt2.segment.idx)
            ? pt1.segment
            : pt2.segment;
      }
      if (this.segment.arcCenter) {
        this.pointsModeAddArcPoints();
      } else {
        this.pointsModeAddSegPoints();
      }
    }
    app.drawAPI.askRefresh();
  }

  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = app.workspace.getShapeById(this.shapeId),
      segments = shape.segments,
      segment;

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
    let shape = this.segment.shape,
      center = this.segment.arcCenter,
      firstAngle = center.getAngle(this.segment.vertexes[0]),
      secondAngle = center.getAngle(this.segment.vertexes[1]);
    if (this.segment.counterclockwise) [firstAngle, secondAngle] = [secondAngle, firstAngle];
    if (this.segment.vertexes[0].equal(this.segment.vertexes[1])) secondAngle += 2 * Math.PI;
    else if (firstAngle > secondAngle) secondAngle += 2 * Math.PI;

    // Pour un cercle entier, on ajoute un point de division supplémentaire
    if (shape.isCircle()) this.segment.addPoint(new Point(this.segment.vertexes[1]));

    let partAngle = (secondAngle - firstAngle) / this.numberOfparts,
      radius = this.segment.radius;

    for (let i = 1, nextPt = this.segment.vertexes[0]; i < this.numberOfparts; i++) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      nextPt = nextPt.copy();
      nextPt.setCoordinates({ x: newX, y: newY });
      this.segment.addPoint(nextPt);
    }
  }

  segmentModeAddSegPoints() {
    this.firstPoint = this.segment.vertexes[0];
    this.secondPoint = this.segment.vertexes[1];
    this.pointsModeAddSegPoints();
  }

  pointsModeAddArcPoints() {
    let shape = this.segment.shape,
      center = this.segment.arcCenter,
      firstAngle = center.getAngle(this.firstPoint),
      secondAngle = center.getAngle(this.secondPoint);
    if (!shape.isCircle()) {
      let firstVertexAngle = this.segment.arcCenter.getAngle(this.segment.vertexes[0]),
        secondVertexAngle = this.segment.arcCenter.getAngle(this.segment.vertexes[1]);
      if (this.segment.counterclockwise)
        [firstVertexAngle, secondVertexAngle] = [secondVertexAngle, firstVertexAngle];
      if (firstAngle < firstVertexAngle) firstAngle += Math.PI * 2;
      if (secondAngle < firstVertexAngle) secondAngle += Math.PI * 2;
      if (secondVertexAngle < firstVertexAngle) secondVertexAngle += Math.PI * 2;
      if ((secondAngle < firstAngle) ^ this.segment.counterclockwise) {
        [firstAngle, secondAngle] = [secondAngle, firstAngle];
      }
    }
    if (secondAngle < firstAngle) secondAngle += Math.PI * 2;

    let partAngle = (secondAngle - firstAngle) / this.numberOfparts,
      radius = this.segment.radius;

    for (let i = 1, nextPt = this.firstPoint; i < this.numberOfparts; i++) {
      const newX = radius * Math.cos(firstAngle + partAngle * i) + center.x,
        newY = radius * Math.sin(firstAngle + partAngle * i) + center.y;
      nextPt = nextPt.copy();
      nextPt.setCoordinates({ x: newX, y: newY });
      this.segment.addPoint(nextPt);
    }
  }

  pointsModeAddSegPoints() {
    const segLength = this.secondPoint.subCoordinates(this.firstPoint),
      part = new Point(segLength.x / this.numberOfparts, segLength.y / this.numberOfparts);

    for (let i = 1, nextPt = this.firstPoint.copy(); i < this.numberOfparts; i++) {
      nextPt = nextPt.addCoordinates(part);
      this.segment.addPoint(nextPt);
    }
  }
}
