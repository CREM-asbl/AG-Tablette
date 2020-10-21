import { app } from '../App';
import { ShapeManager } from '../Managers/ShapeManager';
import { Segment } from './Segment';
import { mod } from '../Tools/general';
import { Shape } from './Shape';

/**
 * Représente un point du plan
 */
export class Point {
  /**
   * create point from another point or coordinates
   * @param {{x: number, y: number}} point - point to copy
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {String} type - type -> 'vertex', 'segmentPoint' or 'center'
   * @param {Segment} segment - parent segment
   * @param {Shape} shape - shape
   * @param {String} name - the name -> 'firstPoint', 'secondPoint', 'thirdPoint', 'fourthPoint'
   */
  constructor() {
    let argc = 0;
    if (typeof arguments[argc] == 'object') {
      this.x = parseFloat(arguments[argc].x);
      this.y = parseFloat(arguments[argc].y);
      argc++;
    } else {
      this.x = parseFloat(arguments[argc++]);
      this.y = parseFloat(arguments[argc++]);
    }
    if (arguments[argc++]) this.type = arguments[argc - 1];
    if (arguments[argc++]) this.segment = arguments[argc - 1];
    if (arguments[argc++]) this.shape = arguments[argc - 1];
    if (arguments[argc++]) this.name = arguments[argc - 1];
  }

  saveToObject() {
    const save = {
      x: this.x,
      y: this.y,
    };
    if (this.type) save.type = this.type;
    if (this.shape) save.shapeId = this.shape.id;
    else if (this.segment && this.segment.shape)
      save.shapeId = this.segment.shape.id;
    if (save.shapeId && this.segment) save.segmentIdx = this.segment.idx;
    if (this.name) save.name = this.name;
    return save;
  }

  initFromObject(save) {
    this.x = save.x;
    this.y = save.y;
    if (save.type) this.type = save.type;
    if (save.shape) this.shape = save.shape;
    else if (save.shapeId !== undefined)
      this.shape = ShapeManager.getShapeById(save.shapeId);
    if (save.segment) this.segment = save.segment;
    else if (save.segmentIdx !== undefined)
      this.segment = this.shape.segments[save.segmentIdx];
    if (save.name) this.name = save.name;
  }

  static retrieveFrom(point) {
    let newPointCopy = new Point();
    newPointCopy.initFromObject(point);
    if (point.type == 'vertex') {
      let segment = newPointCopy.shape.segments[newPointCopy.segment.idx];
      return segment.vertexes.find(vtx => vtx.equal(newPointCopy));
    } else if (point.type == 'segmentPoint') {
      let segment = newPointCopy.shape.segments[newPointCopy.segment.idx];
      return segment.point.find(vtx => vtx.equal(newPointCopy));
    } else {
      // center
      return newPointCopy.shape.center;
    }
  }

  setCoordinates({ x, y }) {
    this.x = x;
    this.y = y;
  }

  /**
   * move the point with Point or coordinates
   * @param {{x: number, y: number}} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} neg - negative translation
   * @return {{x: number, y:number}} new coordinates
   */
  translate() {
    let neg,
      multiplier,
      x,
      y,
      i = 0;
    if (typeof arguments[i] == 'object') {
      x = arguments[i].x;
      y = arguments[i].y;
      i++;
      neg = arguments[i];
    } else {
      x = arguments[i];
      y = !isNaN(arguments[i + 1]) ? arguments[++i] : arguments[i];
      i++;
      neg = arguments[i];
    }
    multiplier = neg ? -1 : 1;
    this.x += x * multiplier;
    this.y += y * multiplier;
    return this.copy();
  }

  /**
   * add coordinates to point without update the coordinates of the point,
   *  if you want update, use translate
   * @param {{x: number, y: number}} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @return {{x: number, y:number}} new coordinates
   */
  addCoordinates() {
    let x, y;
    if (typeof arguments[0] == 'object') {
      x = arguments[0].x;
      y = arguments[0].y;
    } else {
      x = arguments[0];
      y = !isNaN(arguments[1]) ? arguments[1] : arguments[0];
    }
    x = this.x + x;
    y = this.y + y;
    return new Point(x, y, this.type, this.segment, this.shape);
  }

  /**
   * sub coordinates to point without update the coordinates of the point,
   *  if you want update, use translate with true as last parameter
   * @param {{x: number, y: number}} point - point to sub
   * @param {number} x - other method
   * @param {number} y - other method
   * @return {{x: number, y:number}} new coordinates
   */
  subCoordinates() {
    let x, y;
    if (typeof arguments[0] == 'object') {
      x = arguments[0].x;
      y = arguments[0].y;
    } else {
      x = arguments[0];
      y = arguments[0] ? arguments[1] : arguments[0];
    }
    x = this.x + x * -1;
    y = this.y + y * -1;
    return new Point(x, y, this.type, this.segment, this.shape);
  }

  /**
   * multiplies ths coordinates with multiplier
   * @param {*} multiplier
   * @param {*} must_change_this - if this must be modified
   */
  multiplyWithScalar(multiplier, must_change_this = false) {
    let new_point = new Point(
      this.x * multiplier,
      this.y * multiplier,
      this.type,
      this.segment,
      this.shape
    );
    if (must_change_this) {
      this.x = new_point.x;
      this.y = new_point.y;
    }
    return new_point;
  }

  copy() {
    return new Point(
      this.x,
      this.y,
      this.type,
      this.segment,
      this.shape,
      this.name
    );
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

  /**
   * Same as rotate but doesn't modify this
   * @param {*} angle
   * @param {*} center
   */
  getRotated(angle, center = { x: 0, y: 0 }) {
    let s = Math.sin(angle),
      c = Math.cos(angle),
      x = this.x - center.x,
      y = this.y - center.y,
      newX = x * c - y * s + center.x,
      newY = x * s + y * c + center.y,
      newPoint = this.copy();
    newPoint.setCoordinates({ x: newX, y: newY });
    return newPoint;
  }

  /**
   * Renvoie l'angle (en radians) entre la droite reliant this et point, et l'axe
   * horizontal passant par this.
   * @param  {Point} point    Le second point
   * @return {float}          L'angle, en radians. L'angle renvoyé est dans
   *                              l'intervalle [0, 2PI[
   */
  getAngle(point) {
    let pt = {
      x: point.x - this.x,
      y: point.y - this.y,
    };
    //Trouver l'angle de pt par rapport à (0,0)
    // https://en.wikipedia.org/wiki/Atan2 -> voir image en haut à droite,
    //  sachant qu'ici l'axe des y est inversé.
    let angle = Math.atan2(pt.y, pt.x);
    if (angle < 0) angle += 2 * Math.PI;
    if (2 * Math.PI - angle < 0.00001) angle = 0;
    return angle;
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
      constraints.isFree = true;
    } else if (this.shape.name == 'CirclePart') {
      if (this.name == 'arcCenter' || this.name == 'firstPoint')
        constraints.isFree = true;
      else {
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
      if (this.name == 'arcCenter' || this.name == 'firstPoint')
        constraints.isFree = true;
      else {
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
   * distance with another Point or coordinates
   * @param {Object} point - point to compare with
   * @param {number} x - other method
   * @param {number} y - other method
   * @return {number} dist - Euclidean distance
   */
  dist() {
    let x, y;
    if (arguments.length == 1) {
      if (arguments[0] instanceof Point || arguments[0][0] == undefined) {
        x = arguments[0].x;
        y = arguments[0].y;
      } else {
        x = arguments[0][0];
        y = arguments[0][1];
      }
    } else if (arguments.length == 2) {
      x = arguments[0];
      y = arguments[1];
    }
    let pow1 = Math.pow(x - this.x, 2),
      pow2 = Math.pow(y - this.y, 2);
    return Math.sqrt(pow1 + pow2);
  }

  /**
   * equality with another Point or coordinates
   * @param {Object} point - point to compare with
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} precision - precision d'egalité (0 pour stricte)
   */
  equal() {
    let x,
      y,
      i = 0,
      precision = 0.001;
    if (arguments.length == 1) {
      if (arguments[0] instanceof Point || arguments[0][0] == undefined) {
        x = arguments[0].x;
        y = arguments[0].y;
      } else {
        x = arguments[0][0];
        y = arguments[0][1];
      }
      i++;
    } else if (arguments.length == 2) {
      x = arguments[i++];
      y = arguments[i++];
    }
    if (arguments[i] !== undefined) {
      precision = arguments[i++];
    }
    return this.dist(new Point(x, y)) < precision;
  }

  /**
   * convertit en balise circle de svg
   */
  toSVG(color = '#000', size = 1) {
    let point = new Point(this);
    point.setToCanvasCoordinates();
    return (
      '<circle cx="' +
      point.x +
      '" cy="' +
      point.y +
      '" r="' +
      size * 2 + // * app.workspace.zoomLevel +
      '" fill="' +
      color +
      '" />\n'
    );
  }

  setToCanvasCoordinates() {
    this.multiplyWithScalar(app.workspace.zoomLevel, true);
    this.translate(
      app.workspace.translateOffset.x,
      app.workspace.translateOffset.y
    );
  }

  resetFromCanvasCoordinates() {
    this.translate(
      app.workspace.translateOffset.x,
      app.workspace.translateOffset.y,
      true
    );
    // console.log('resetting', this.x, this.y);
    this.multiplyWithScalar(1 / app.workspace.zoomLevel, true);
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
}
