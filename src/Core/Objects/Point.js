import { app } from '../App';
import { ShapeManager } from '../Managers/ShapeManager';
import { Segment } from './Segment';
import { mod, uniqId } from '../Tools/general';
import { Shape } from './Shape';
import { Coordinates } from './Coordinates';
import { DrawingEnvironment } from './DrawingEnvironment';

/**
 * Représente un point du plan
 */
export class Point {
  /**
   * @param {String}                      id
   * @param {DrawingEnvironment}          drawingEnvironment
   * @param {Coordinates}                 coordinates
   * @param {Number}                      x
   * @param {Number}                      y
   * @param {[String]}                    segmentIds
   * @param {String}                      shapeId
   * @param {String}                      type  -> 'vertex', 'divisionPoint' or 'center'
   * @param {String}                      name  -> 'firstPoint', 'secondPoint', 'thirdPoint', 'fourthPoint'
   * @param {Number}                      ratio -> the ratio of this between the 2 vertexes of the segment
   */
  constructor({
    id = uniqId(),
    drawingEnvironment,
    coordinates = undefined,
    x = 0,
    y = 0,
    shapeId = undefined,
    idx = undefined,
    segmentIds = [],
    type = undefined,
    name = undefined,
    ratio = undefined,
    visible = true,
    color = '#000',
    size = 1,
  }) {
    this.id = id;
    this.drawingEnvironment = drawingEnvironment;
    this.drawingEnvironment.points.push(this);

    if (coordinates !== undefined)
      this.coordinates = new Coordinates(coordinates);
    else
      this.coordinates = new Coordinates({
        x: parseFloat(x),
        y: parseFloat(y),
      });

    this.shapeId = shapeId;
    if (this.shapeId !== undefined)
      this.drawingEnvironment.shapes
        .find(s => s.id === this.shapeId)
        .pointIds.push(this.id);
    this.idx = idx;
    this.segmentIds = [...segmentIds];
    this.type = type;
    this.name = name;
    if (ratio !== undefined) this.ratio = parseFloat(ratio);
    this.visible = visible;
    this.color = color;
    this.size = size;
  }

  get shape() {
    let shape = this.drawingEnvironment.shapes.find(s => s.id === this.shapeId);
    return shape;
  }

  get segments() {
    let segments = this.segmentIds.map(segId =>
      this.drawingEnvironment.segments.find(seg => seg.id === segId)
    );
    return segments;
  }

  get x() {
    return this.coordinates.x;
  }

  get y() {
    return this.coordinates.y;
  }

  /**
   * move this with coordinates
   * @param {Coordinates} coordinates
   * @param {Boolean} negativeTranslation true if the coordinates must be reversed
   */
  translate(coordinates, negativeTranslation = false) {
    this.coordinates = negativeTranslation
      ? this.coordinates.substract(coordinates)
      : this.coordinates.add(coordinates);
  }

  /**
   * multiplies this with scalar(s)
   * @param {Number} multiplierX
   * @param {Number} multiplierY
   */
  multiply(multiplierX, multiplierY = multiplierX) {
    this.coordinates = this.coordinates.multiply(multiplierX, multiplierY);
  }

  /**
   * rotate a point clockwise
   * @param {number} angle - rotation angle
   * @param {{x: number, y: number}} [center] - rotation center
   * @return {{x: number, y: number}} new coordinates
   */
  rotate(angle, center = { x: 0, y: 0 }) {
    let s = Math.sin(angle),
      c = Math.cos(angle),
      x = this.x - center.x,
      y = this.y - center.y,
      newX = x * c - y * s + center.x,
      newY = x * s + y * c + center.y;
    this.x = newX;
    this.y = newY;
    return this.copy();
  }

  computeTransformConstraint() {
    let constraints = {
      isFree: false,
      isConstrained: false,
      isBlocked: false,
      isConstructed: false,
      lines: [],
      points: [],
    };
    if (this.shape.familyName == 'Regular') {
      if (this.name == 'firstPoint' || this.name == 'secondPoint') {
        constraints.isFree = true;
      } else {
        constraints.isConstructed = true;
      }
    } else if (this.shape.familyName == 'Irregular') {
      constraints.isFree = true;
    } else if (this.shape.name == 'RightAngleTriangle') {
      if (this.name == 'firstPoint' || this.name == 'secondPoint') {
        constraints.isFree = true;
      } else {
        console.trace();

        constraints.isConstrained = true;

        let firstSeg = this.shape.segments[0];
        constraints.lines = [
          {
            segment: new Segment(this, firstSeg.vertexes[1]),
            isInfinite: true,
          },
        ];
      }
    } else if (this.shape.name == 'IsoscelesTriangle') {
      if (this.name == 'firstPoint' || this.name == 'secondPoint') {
        constraints.isFree = true;
      } else {
        constraints.isConstrained = true;

        let firstSeg = this.shape.segments[0];
        let middleOfSegment = firstSeg.middle;
        constraints.lines = [
          {
            segment: new Segment(this, middleOfSegment),
            isInfinite: true,
          },
        ];
      }
    } else if (this.shape.name == 'RightAngleIsoscelesTriangle') {
      if (this.name == 'firstPoint' || this.name == 'secondPoint') {
        constraints.isFree = true;
      } else {
        constraints.isConstrained = true;
        let firstSeg = this.shape.segments[0];
        let segmentLength = firstSeg.length;
        let angle = firstSeg.getAngleWithHorizontal();
        let perpendicularAngle = angle + Math.PI / 2;
        let firstPoint = new Point(
          firstSeg.vertexes[1].x + Math.cos(perpendicularAngle) * segmentLength,
          firstSeg.vertexes[1].y + Math.sin(perpendicularAngle) * segmentLength
        );
        let secondPoint = new Point(
          firstSeg.vertexes[1].x - Math.cos(perpendicularAngle) * segmentLength,
          firstSeg.vertexes[1].y - Math.sin(perpendicularAngle) * segmentLength
        );
        constraints.points.push(firstPoint);
        constraints.points.push(secondPoint);
      }
    } else if (this.shape.name == 'Rectangle') {
      if (this.name == 'firstPoint' || this.name == 'secondPoint') {
        constraints.isFree = true;
      } else if (this.name == 'thirdPoint') {
        constraints.isConstrained = true;

        let firstSeg = this.shape.segments[0];
        constraints.lines = [
          {
            segment: new Segment(this, firstSeg.vertexes[1]),
            isInfinite: true,
          },
        ];
      } else {
        constraints.isConstructed = true;
      }
    } else if (this.shape.name == 'Losange') {
      if (this.name == 'firstPoint' || this.name == 'secondPoint') {
        constraints.isFree = true;
      } else if (this.name == 'thirdPoint') {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.shape.segments[0].vertexes[0],
            this.shape.segments[0].vertexes[0],
            null,
            null,
            this.shape.segments[0].vertexes[1]
          ),
        };
        constraints.lines = [constraintLine];
      } else {
        constraints.isConstructed = true;
      }
    } else if (this.shape.name == 'Parallelogram') {
      if (
        this.name == 'firstPoint' ||
        this.name == 'secondPoint' ||
        this.name == 'thirdPoint'
      ) {
        constraints.isFree = true;
      } else {
        constraints.isConstructed = true;
      }
    } else if (this.shape.name == 'RightAngleTrapeze') {
      if (
        this.name == 'firstPoint' ||
        this.name == 'secondPoint' ||
        this.name == 'thirdPoint'
      ) {
        constraints.isFree = true;
      } else {
        constraints.isConstructed = true;
      }
    } else if (this.shape.name == 'IsoscelesTrapeze') {
      if (
        this.name == 'firstPoint' ||
        this.name == 'secondPoint' ||
        this.name == 'thirdPoint'
      ) {
        constraints.isFree = true;
      } else {
        constraints.isConstructed = true;
      }
    } else if (this.shape.name == 'Trapeze') {
      if (
        this.name == 'firstPoint' ||
        this.name == 'secondPoint' ||
        this.name == 'thirdPoint'
      ) {
        constraints.isFree = true;
      } else {
        constraints.isConstrained = true;
        let secondSeg = this.shape.segments[1];
        constraints.lines = [
          {
            segment: new Segment(this, secondSeg.vertexes[1]),
            isInfinite: true,
          },
        ];
      }
    } else if (this.shape.name == 'Circle') {
      if (this.name == 'arcCenter') {
        constraints.isBlocked = true;
      } else {
        constraints.isFree = true;
      }
    } else if (this.shape.name == 'CirclePart') {
      if (this.name == 'arcCenter') {
        constraints.isBlocked = true;
      } else if (this.name == 'firstPoint') {
        constraints.isFree = true;
      } else {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.shape.segments[0].vertexes[1],
            this.shape.segments[0].vertexes[1],
            null,
            null,
            this.shape.segments[0].vertexes[0]
          ),
        };
        constraints.lines = [constraintLine];
      }
    } else if (this.shape.name == 'CircleArc') {
      if (this.name == 'firstPoint') constraints.isFree = true;
      else if (this.name == 'secondPoint') {
        constraints.isConstrained = true;
        let constraintLine = {
          segment: new Segment(
            this.shape.segments[0].vertexes[1],
            this.shape.segments[0].vertexes[1],
            null,
            null,
            this.shape.segments[0].arcCenter
          ),
        };
        constraints.lines = [constraintLine];
      } else if (this.name == 'arcCenter') {
        constraints.isConstrained = true;
        let seg = new Segment(
          this.shape.segments[0].vertexes[0],
          this.shape.segments[0].vertexes[1]
        );
        let middle = seg.middle;
        let constraintLine = {
          segment: new Segment(
            this.shape.segments[0].middle,
            middle,
            null,
            null,
            null,
            null,
            true
          ),
        };
        constraints.lines = [constraintLine];
      }
    } else if (this.shape.familyName == 'Line') {
      if (
        (this.shape.name == 'ParalleleSegment' ||
          this.shape.name == 'ParalleleSemiStraightLine') &&
        this.name == 'secondPoint'
      ) {
        constraints.isConstrained = true;
        let reference = ShapeManager.getShapeById(this.shape.referenceShapeId)
          .segments[this.shape.referenceSegmentIdx];
        let referenceAngle = reference.getAngleWithHorizontal();
        let constraintLine = {
          segment: new Segment(
            this.shape.segments[0].vertexes[0],
            this.shape.segments[0].vertexes[0].addCoordinates(
              100 * Math.cos(referenceAngle),
              100 * Math.sin(referenceAngle)
            )
          ),
          isInfinite: true,
        };
        constraints.lines = [constraintLine];
      } else if (
        (this.shape.name == 'PerpendicularSegment' ||
          this.shape.name == 'PerpendicularSemiStraightLine') &&
        this.name == 'secondPoint'
      ) {
        constraints.isConstrained = true;
        let reference = ShapeManager.getShapeById(this.shape.referenceShapeId)
          .segments[this.shape.referenceSegmentIdx];
        let constraintLine = {
          segment: new Segment(
            this.shape.segments[0].vertexes[0],
            reference.projectionOnSegment(this)
          ),
          isInfinite: true,
        };
        constraints.lines = [constraintLine];
      } else {
        constraints.isFree = true;
      }
    }
    this.transformConstraints = constraints;
  }

  /**
   * convertit en balise circle de svg
   */
  toSVG(color = '#000', size = 1) {
    let canvasCoordinates = this.coordinates.toCanvasCoordinates();
    return (
      '<circle cx="' +
      canvasCoordinates.x +
      '" cy="' +
      canvasCoordinates.y +
      '" r="' +
      size * 2 + // * app.workspace.zoomLevel +
      '" fill="' +
      color +
      '" />\n'
    );
  }

  /**
   * get the positive angle formed by the 2 segments of the vertex in 0 =< value < 2 * Math.PI
   * @param {Boolean} reduced   return value reduced to 0 =< value < Math.PI
   */
  getVertexAngle(reduced = false) {
    let shape = this.shape,
      segment = this.segment,
      nextSegment = shape.segments[(segment.idx + 1) % shape.segments.length];

    let angle1 = segment.getAngleWithHorizontal();
    let angle2 = nextSegment.getAngleWithHorizontal();

    let resultAngle = mod(angle1 - angle2, 2 * Math.PI);
    if (reduced && resultAngle > Math.PI)
      resultAngle = 2 * Math.PI - resultAngle;

    return resultAngle;
  }

  recomputeSegmentPoint() {
    let v0 = this.segment.vertexes[0],
      angle = this.segment.getAngleWithHorizontal(),
      length = this.segment.length;

    this.setCoordinates({
      x: v0.x + Math.cos(angle) * length * this.ratio,
      y: v0.y + Math.sin(angle) * length * this.ratio,
    });
  }
}
