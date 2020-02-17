import { Point } from './Point';
import { app } from '../App';
import { ShapeManager } from '../ShapeManager';

export class Segment {
  constructor(point1, point2, shape, idx, arcCenter, counterclockwise) {
    this.vertexes = [
      new Point(point1, 'vertex', this, shape),
      new Point(point2, 'vertex', this, shape),
    ];
    this.points = [];
    this.shape = shape;
    this.idx = idx;
    if (arcCenter) this.arcCenter = new Point(arcCenter);
    if (counterclockwise) this.counterclockwise = counterclockwise;
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get shape() {
    return this.private_shape;
  }

  set shape(shape) {
    this.private_shape = shape;
    if (this.vertexes) this.vertexes.forEach(vertex => (vertex.shape = shape));
    if (this.points) this.points.forEach(point => (point.shape = shape));
  }

  get bounds() {
    //minX, maxX, minY, maxY
    let results = [undefined, undefined, undefined, undefined];
    if (this.arcCenter) {
      results = [
        this.centerProjectionOnSegment(Math.PI),
        this.centerProjectionOnSegment(0),
        this.centerProjectionOnSegment(1.5 * Math.PI),
        this.centerProjectionOnSegment(0.5 * Math.PI),
      ];
    }
    return results.map((result, idx) => {
      if (result == undefined || !this.isPointOnSegment(result)) {
        if (idx % 2) {
          if (idx < 2) return Math.max(this.vertexes[0].x, this.vertexes[1].x);
          else return Math.max(this.vertexes[0].y, this.vertexes[1].y);
        } else {
          if (idx < 2) return Math.min(this.vertexes[0].x, this.vertexes[1].x);
          else return Math.min(this.vertexes[0].y, this.vertexes[1].y);
        }
      } else {
        if (idx < 2) return result.x;
        else return result.y;
      }
    });
  }

  get radius() {
    if (!this.arcCenter) {
      console.error('cannot take radius of straight segment ', this);
      return 0;
    }
    return this.arcCenter.dist(this.vertexes[1]);
  }

  get allPoints() {
    return [...this.points, ...this.vertexes];
  }

  /**
   * @returns conbinaisons de tous les sous-segments possibles
   * (segment d'un point/vertex à un autre point/vertex)
   */
  get subSegments() {
    let result = [];
    this.allOutlinePoints.forEach((point, idx, points) => {
      points.slice(idx + 1).forEach((pt, i, pts) => {
        result.push(
          new Segment(point, pt, this.shape, this.idx, this.arcCenter, this.counterclockwise),
        );
      });
    });
    return result;
  }

  get length() {
    return this.vertexes[0].dist(this.vertexes[1]);
  }

  get direction() {
    const originVector = this.vertexes[1].subCoordinates(this.vertexes[0]);
    originVector.multiplyWithScalar(1 / this.length, true);
    return originVector;
  }

  get middle() {
    if (this.arcCenter) {
      let center = this.arcCenter,
        firstAngle = center.getAngle(this.vertexes[0]),
        secondAngle = center.getAngle(this.vertexes[1]),
        middleAngle = (firstAngle + secondAngle) / 2;

      if (this.counterclockwise ^ (firstAngle > secondAngle)) middleAngle += Math.PI;
      const middle = new Point(
        this.radius * Math.cos(middleAngle) + center.x,
        this.radius * Math.sin(middleAngle) + center.y,
      );
      return middle;
    } else {
      return new Point(
        (this.vertexes[0].x + this.vertexes[1].x) / 2,
        (this.vertexes[0].y + this.vertexes[1].y) / 2,
      );
    }
  }

  /**
   * return the non comon point of this if this is joined to segment (1 common point)
   * @param {*} segment
   */
  getNonCommonPointIfJoined(segment) {
    let jointure = this.vertexes.filter(v1 => segment.vertexes.some(v2 => v1.equal(v2)));
    if (jointure) return jointure[0];
    else return undefined;
  }

  /**
   * return the middle of this if this is joined to segment (1 common point)
   * @param {*} segment
   */
  getMiddleIfJoined(segment) {
    if (this.vertexes.some(v1 => segment.vertexes.some(v2 => v1.equal(v2)))) return this.middle;
    else return undefined;
  }

  getPath(path, axeAngle = undefined) {
    if (!this.arcCenter) path.lineTo(this.vertexes[1].x, this.vertexes[1].y);
    else if (axeAngle !== undefined) {
      let firstAngle = this.arcCenter.getAngle(this.vertexes[0]),
        secondAngle = this.arcCenter.getAngle(this.vertexes[1]);
      if (this.vertexes[0].equal(this.vertexes[1])) secondAngle += 2 * Math.PI;
      path.ellipse(
        this.arcCenter.x,
        this.arcCenter.y,
        this.arcCenter.dist(this.tangentPoint1),
        this.arcCenter.dist(this.tangentPoint2),
        axeAngle,
        firstAngle - axeAngle,
        secondAngle - axeAngle,
        this.counterclockwise,
      );
    } else {
      let firstAngle = this.arcCenter.getAngle(this.vertexes[0]),
        secondAngle = this.arcCenter.getAngle(this.vertexes[1]);
      if (this.vertexes[0].equal(this.vertexes[1])) secondAngle += 2 * Math.PI;
      path.arc(
        this.arcCenter.x,
        this.arcCenter.y,
        this.vertexes[1].dist(this.arcCenter),
        firstAngle,
        secondAngle,
        this.counterclockwise,
      );
    }
  }

  getArcTangent(vertexNb) {
    let vertex = this.vertexes[vertexNb],
      center = this.arcCenter,
      originVector = vertex.subCoordinates(center),
      perpendicularOriginVector;
    originVector.multiplyWithScalar(1 / this.radius, true);
    if (this.counterclockwise)
      perpendicularOriginVector = new Point(1, -originVector.x / originVector.y);
    else perpendicularOriginVector = new Point(-1, originVector.x / originVector.y);
    if (perpendicularOriginVector.y == Infinity)
      perpendicularOriginVector.setCoordinates({ x: 0, y: 1 });
    if (perpendicularOriginVector.y == -Infinity)
      perpendicularOriginVector.setCoordinates({ x: 0, y: -1 });
    else
      perpendicularOriginVector.multiplyWithScalar(
        1 / new Point(0, 0).dist(perpendicularOriginVector),
        true,
      );
    return perpendicularOriginVector;
  }

  /* #################################################################### */
  /* ########################## SEGMENT POINTS ########################## */
  /* #################################################################### */

  addPoint({ x, y }) {
    //TODO: garder les points triés?
    let newPoint = new Point(x, y, 'segmentPoint', this, this.shape);
    if (this.points.filter(pt => pt.equal(newPoint, 0.001)).length == 0)
      // check if point already exists
      this.points.push(newPoint);
  }

  /**
   * sort segment points from vertexes[start]
   * @param {*} start
   */
  sortPoints(start = 0) {
    this.points.sort((pt1, pt2) =>
      pt1.dist(this.vertexes[start]) > pt2.dist(this.vertexes[start]) ? 1 : -1,
    );
  }

  deletePoint(point) {
    let i = this.points.findIndex(pt => {
      return pt.equal(point, 0.001);
    });
    if (i == -1) {
      console.error("couldn't delete point from segment");
      return null;
    }
    this.points.splice(i, 1);
  }

  /* #################################################################### */
  /* ############################ TRANSFORM ############################# */
  /* #################################################################### */

  scale(scaling) {
    this.vertexes.forEach(vertex => vertex.multiplyWithScalar(scaling, true));
    if (this.points) this.points.forEach(pt => pt.multiplyWithScalar(scaling, true));
    if (this.arcCenter) this.arcCenter.multiplyWithScalar(scaling, true);
  }

  rotate(angle, center = { x: 0, y: 0 }) {
    this.allPoints.forEach(pt => pt.rotate(angle, center));
    if (this.arcCenter) this.arcCenter.rotate(angle, center);
  }

  translate(coordinates) {
    if (this.vertexes) this.vertexes.forEach(vertex => vertex.translate(coordinates));
    if (this.points) this.points.forEach(point => point.translate(coordinates));
    if (this.arcCenter) this.arcCenter.translate(coordinates);
  }

  reverse(changeClockwise = false) {
    this.vertexes.reverse();
    if (this.arcCenter && changeClockwise) this.counterclockwise = !this.counterclockwise;
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  copy(full = true) {
    let copy = new Segment(
      this.vertexes[0],
      this.vertexes[1],
      this.shape,
      this.idx,
      this.arcCenter,
      this.counterclockwise,
    );
    if (full) {
      this.points.forEach(p => {
        copy.addPoint(p);
      });
    }
    if (this.tangentPoint1) copy.tangentPoint1 = new Point(this.tangentPoint1);
    if (this.tangentPoint2) copy.tangentPoint2 = new Point(this.tangentPoint2);
    return copy;
  }

  saveToObject() {
    const save = {
      vertexes: this.vertexes.map(pt => pt.saveToObject()),
    };
    if (this.points && this.points.length) save.points = this.points.map(pt => pt.saveToObject());
    if (this.idx !== undefined) save.idx = this.idx;
    if (this.shape) save.shapeId = this.shape.id;
    if (this.arcCenter) save.arcCenter = this.arcCenter.saveToObject();
    if (this.counterclockwise) save.counterclockwise = this.counterclockwise;
    return save;
  }

  initFromObject(save) {
    if (save.shape) this.shape = save.shape;
    else if (save.shapeId) this.shape = ShapeManager.getShapeById(save.shapeId);

    this.vertexes = save.vertexes.map(pt => {
      let newVertex = new Point(pt, 'vertex', this, this.shape);
      return newVertex;
    });
    if (save.points && save.points.length) {
      this.points = save.points.map(pt => {
        let newPoint = new Point(pt, 'segmentPoint', this, this.shape);
        return newPoint;
      });
    }
    if (save.idx !== undefined) this.idx = save.idx;
    if (save.arcCenter) {
      let newPoint = new Point(save.arcCenter, 'arcCenter', this, this.shape);
      this.arcCenter = newPoint;
    }
    if (save.counterclockwise) this.counterclockwise = save.counterclockwise;
  }

  static retrieveFrom(segment) {
    let newSegmentCopy = new Segment();
    newSegmentCopy.initFromObject(segment);
    return newSegmentCopy.shape.segments[newSegmentCopy.idx];
  }

  isVertex(point) {
    return point.equal(this.vertexes[0]) || point.equal(this.vertexes[1]);
  }

  /**
   * Find the point's projection on this.
   *
   * For circle : https://math.stackexchange.com/questions/1744354/project-a-point-within-a-circle-onto-its-edge
   * @param {*} point
   */
  projectionOnSegment(point) {
    if (this.arcCenter) {
      const angle = this.arcCenter.getAngle(point),
        projection = new Point(
          this.radius * Math.cos(angle) + this.arcCenter.x,
          this.radius * Math.sin(angle) + this.arcCenter.y,
        );
      return projection;
    } else {
      let proj = null,
        p1x = this.vertexes[0].x,
        p1y = this.vertexes[0].y,
        p2x = this.vertexes[1].x,
        p2y = this.vertexes[1].y;

      //Calculer la projection du point sur l'axe.
      if (Math.abs(p2x - p1x) < 0.001) {
        //segment vertical
        proj = new Point({ x: p1x, y: point.y });
      } else if (Math.abs(p2y - p1y) < 0.001) {
        //segment horizontal
        proj = new Point({ x: point.x, y: p1y });
      } else {
        // axe.type=='NW' || axe.type=='SW'
        let f_a = (p1y - p2y) / (p1x - p2x),
          f_b = p2y - f_a * p2x,
          x2 = (point.x + point.y * f_a - f_a * f_b) / (f_a * f_a + 1),
          y2 = f_a * x2 + f_b;
        proj = new Point({
          x: x2,
          y: y2,
        });
      }
      return proj;
    }
  }

  /**
   * say if it is a subsegment (segment inside but no match with segmentPoints)
   * @param {Segment} subseg subsegment
   */
  isSubsegment(subseg) {
    return this.isPointOnSegment(subseg.vertexes[0]) && this.isPointOnSegment(subseg.vertexes[1]);
  }

  /**
   * Find the angle's projection on this arc.
   *
   * For circle : https://math.stackexchange.com/questions/1744354/project-a-point-within-a-circle-onto-its-edge
   * @param {*} point
   */
  centerProjectionOnSegment(angle) {
    if (this.arcCenter) {
      const projection = new Point(
        this.radius * Math.cos(angle) + this.arcCenter.x,
        this.radius * Math.sin(angle) + this.arcCenter.y,
      );
      return projection;
    } else {
      console.trace('no arc passed here');
    }
  }

  isPointOnSegment(point, precision = 0.001) {
    if (this.arcCenter) {
      if (Math.abs(this.arcCenter.dist(point) - this.radius) > precision) return false;
      let angle = this.arcCenter.getAngle(point),
        bound1 = this.arcCenter.getAngle(this.vertexes[0]),
        bound2 = this.arcCenter.getAngle(this.vertexes[1]);
      if (Math.abs(bound1 - bound2) < 0.001) return true;
      if (this.counterclockwise) [bound1, bound2] = [bound2, bound1];
      if (angle < bound1) angle += Math.PI * 2;
      if (bound2 < bound1) bound2 += Math.PI * 2;
      if (angle <= bound2) return true;
      return false;
    } else {
      let segmentLength = this.length,
        dist1 = this.vertexes[0].dist(point),
        dist2 = this.vertexes[1].dist(point);
      if (dist1 + dist2 - segmentLength > precision) return false;
      return true;
    }
  }

  /**
   * point d'intersection de 2 segments (ou prolongation)
   * @param {object} segment
   * @return le point ou undefined si segments parallèles
   */
  intersectPoint(segment) {
    let result = new Point(0, 0),
      ma = (this.vertexes[0].y - this.vertexes[1].y) / (this.vertexes[0].x - this.vertexes[1].x),
      mb =
        (segment.vertexes[0].y - segment.vertexes[1].y) /
        (segment.vertexes[0].x - segment.vertexes[1].x);

    // 2 segments verticaux
    if (!isFinite(ma) && !isFinite(mb)) return undefined;
    // this vertical
    else if (!isFinite(ma)) {
      let pb = segment.vertexes[0].y - mb * segment.vertexes[0].x;
      result.y = mb * this.vertexes[0].x + pb;
      result.x = this.vertexes[0].x;
      // segment vertical
    } else if (!isFinite(mb)) {
      let pa = this.vertexes[0].y - ma * this.vertexes[0].x;
      result.y = ma * segment.vertexes[0].x + pa;
      result.x = segment.vertexes[0].x;
      // 2 segments 'normaux'
    } else {
      if (ma == mb) return undefined; // ajouter precision ?
      let pb = segment.vertexes[0].y - mb * segment.vertexes[0].x;
      let pa = this.vertexes[0].y - ma * this.vertexes[0].x;
      result.x = (pb - pa) / (ma - mb);
      result.y = ma * result.x + pa;
    }
    return result;
  }

  /**
   * check si deux segments s'intersectent
   * @param {*} segment
   * @param {Boolean} allow_prolongation verifie si les droites s'intersectent
   * @param {Boolean} false_if_edge_point si le point d'intersection est la terminaison d'un segment, return false
   */
  doesIntersect(segment, allow_prolongation = false, false_if_edge_point = false) {
    let intersect_point = this.intersectPoint(segment);
    if (!intersect_point) return false;
    if (allow_prolongation) return true;
    if (
      false_if_edge_point &&
      [...this.vertexes, ...segment.vertexes].some(vertex => vertex.equal(intersect_point))
    )
      return false;
    if (this.isPointOnSegment(intersect_point) && segment.isPointOnSegment(intersect_point))
      return true;
    return false;
  }

  contains(object, matchSegmentPoints = true) {
    if (object instanceof Segment) return this.subSegments.some(subSeg => subSeg.equal(object));
    else if (object instanceof Point)
      return (
        this.vertexes.some(vertex => vertex.equal(object)) ||
        (matchSegmentPoints && this.points.some(point => point.equal(object)))
      );
    else console.log('unsupported object :', object);
  }

  equal(segment) {
    if ((this.arcCenter == undefined) ^ (segment.arcCenter == undefined)) return false; // one is arc and the other not
    if (
      (this.vertexes[0].equal(segment.vertexes[1]) &&
        this.vertexes[1].equal(segment.vertexes[0])) ||
      (this.vertexes[0].equal(segment.vertexes[0]) && this.vertexes[1].equal(segment.vertexes[1]))
    ) {
      if (this.arcCenter) {
        return (
          this.arcCenter.equal(segment.arcCenter) &&
          (this.counterclockwise != segment.counterclockwise) ^
            this.vertexes[1].equal(segment.vertexes[1])
        );
      } else return true;
    }
    return false;
  }

  /**
   * convertit le segment en commande de path svg
   */
  to_svg() {
    let v0 = new Point(this.vertexes[0]),
      v1 = new Point(this.vertexes[1]),
      path;
    v0.setToCanvasCoordinates();
    v1.setToCanvasCoordinates();
    if (this.arcCenter) {
      let ctr = new Point(this.arcCenter);
      ctr.setToCanvasCoordinates();
      let radius = ctr.dist(v1),
        firstAngle = ctr.getAngle(v0),
        secondAngle = ctr.getAngle(v1);
      if (v0.equal(v1)) {
        // circle
        const oppositeAngle = firstAngle + Math.PI,
          oppositePoint = new Point(
            ctr.x + Math.cos(oppositeAngle) * radius,
            ctr.y + Math.sin(oppositeAngle) * radius,
          );
        path = ['A', radius, radius, 0, 1, 0, oppositePoint.x, oppositePoint.y]
          .concat(['A', radius, radius, 0, 1, 0, v1.x, v1.y])
          .join(' ');
      } else {
        if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
        let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
          sweepFlag = 1;
        if (this.counterclockwise) {
          sweepFlag = Math.abs(sweepFlag - 1);
          largeArcFlag = Math.abs(largeArcFlag - 1);
        }
        path = ['A', radius, radius, 0, largeArcFlag, sweepFlag, v1.x, v1.y].join(' ');
      }
    } else {
      path = ['L', v1.x, v1.y].join(' ');
    }
    return path;
  }

  /**
   * If 2 segments have the same direction
   * @param {*} segment
   * @param {*} vertexNb1 - if arc, tangent to wich vertex of this
   * @param {*} vertexNb2 - if arc, tangent to wich vertex of segment
   * @param {*} matchArcAndOther - allow to compare arc with normal segment
   */
  hasSameDirection(segment, vertexNb1, vertexNb2, matchArcAndOther = true) {
    let dir1, dir2;
    if (!matchArcAndOther && (this.arcCenter != undefined) ^ (segment.arcCenter != undefined))
      return false;
    if (
      this.arcCenter != undefined &&
      segment.arcCenter != undefined &&
      !this.arcCenter.equal(segment.arcCenter, 0.001)
    )
      return false;
    if (this.arcCenter) dir1 = this.getArcTangent(vertexNb1);
    else dir1 = this.direction;
    if (segment.arcCenter) dir2 = segment.getArcTangent(vertexNb2);
    else dir2 = segment.direction;
    return Math.abs(dir1.x - dir2.x) < 0.001 && Math.abs(dir1.y - dir2.y) < 0.001;
  }
}
