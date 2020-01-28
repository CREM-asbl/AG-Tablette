import { Action } from './Action';
import { Point } from '../../Objects/Point';
import { Segment } from '../../Objects/Segment';
import { ShapeManager } from '../../ShapeManager';

export class DivideAction extends Action {
  constructor() {
    super('DivideAction');

    // Nombre de parties de découpe (numberOfparts-1 points)
    this.numberOfparts = null;

    // Mode de découpe: 'segment' ou 'two_points'
    this.mode = null;

    // Segment, si mode segment
    this.segment = null;

    // Premier point, si mode two_points
    this.firstPoint = null;

    // Second point, si mode two_points
    this.secondPoint = null;

    // Points existants sur le segment avant division
    this.existingPoints = null;
  }

  initFromObject(save) {
    this.numberOfparts = save.numberOfparts;
    this.mode = save.mode;
    if (this.mode == 'two_points') {
      this.firstPoint = new Point();
      this.firstPoint.initFromObject(save.firstPoint);
      this.secondPoint = new Point();
      this.secondPoint.initFromObject(save.secondPoint);
    }
    if (save.segment) {
      this.segment = Segment.retrieveFrom(save.segment);
    } else {
      // for update history from 1.0.0
      this.segment = ShapeManager.getShapeById(save.shapeId).segments[save.segmentIndex];
      if (this.mode == 'two_points') {
        this.firstPoint.segment = this.segment;
        this.secondPoint.segment = this.segment;
      }
    }
    if (save.existingPoints) {
      this.existingPoints = save.existingPoints.map(pt => {
        return new Point(pt);
      });
    } else {
      // for update history from 1.0.0
      this.existingPoints = this.segment.points.map(pt => {
        return new Point(pt);
      });
      if (this.mode == 'two_points') {
        window.dispatchEvent(
          new CustomEvent('update-history', {
            detail: {
              name: 'DivideAction',
              mode: 'two_points',
              firstPoint: this.firstPoint,
              secondPoint: this.secondPoint,
              numberOfparts: this.numberOfparts,
              segment: this.segment,
              existingPoints: this.existingPoints,
            },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('update-history', {
            detail: {
              name: 'DivideAction',
              mode: 'segment',
              numberOfparts: this.numberOfparts,
              segment: this.segment,
              existingPoints: this.existingPoints,
            },
          }),
        );
      }
    }
  }

  checkDoParameters() {
    if (!Number.isFinite(this.numberOfparts)) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    if (this.mode != 'segment' && this.mode != 'two_points') {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    if (this.mode == 'segment' && !this.segment) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    if (this.mode == 'two_points' && (!this.firstPoint || !this.secondPoint)) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (this.existingPoints === undefined) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.mode == 'segment') {
      if (this.segment.arcCenter) this.segmentModeAddArcPoints();
      else this.segmentModeAddSegPoints();
    } else {
      if (this.segment.arcCenter) {
        this.pointsModeAddArcPoints();
      } else {
        this.pointsModeAddSegPoints();
      }
    }
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.segment.points
      .filter(pt => !this.existingPoints.find(extPt => extPt.equal(pt)))
      .forEach(pt => this.segment.deletePoint(pt));
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
