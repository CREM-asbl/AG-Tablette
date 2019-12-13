import { Point } from './Point';
import { app } from '../App';

export class Segment {
  constructor(point1, point2, shape, idx, arcCenter, counterclockwise = false) {
    this.shape = shape;
    this.vertexes = [
      new Point(point1, 'vertex', this, this.shape),
      new Point(point2, 'vertex', this, this.shape),
    ];
    this.points = [];
    if (arcCenter) this.arcCenter = new Point(arcCenter);
    this.counterclockwise = counterclockwise;
    this.idx = idx;
  }

  get shape() {
    return this.private_shape;
  }

  set shape(shape) {
    this.private_shape = shape;
    if (this.vertexes) this.vertexes.forEach(vertex => (vertex.shape = shape));
    if (this.points) this.points.forEach(point => (point.shape = shape));
  }

  addPoint({ x, y }) {
    //TODO: garder les points triés?
    this.points.push(new Point(x, y, 'segmentPoint', this, this.shape));
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

  get allPoints() {
    return [...this.points, ...this.vertexes];
  }

  /**
   * @returns conbinaisons de tous les sous-segments possibles
   * (segment d'un point/vertex à un autre point/vertex)
   */
  get subSegments() {
    let result = [];
    this.allPoints.forEach((point, idx, points) => {
      points.slice(idx + 1).forEach((pt, i, pts) => {
        result.push(new Segment(point, pt));
      });
    });
    return result;
  }

  deletePoint(point) {
    let i = this.points.findIndex(pt => {
      return pt.equal(point);
    });
    if (i == -1) {
      console.error("couldn't delete point from segment");
      return null;
    }
    this.points.splice(i, 1);
  }

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
    return copy;
  }

  saveToObject() {
    const save = {
      vertexes: this.vertexes.map(pt => pt.saveToObject()),
      arcCenter: this.arcCenter.saveToObject(),
      counterclockwise: this.counterclockwise,
    };
    if (this.points) save.points = this.points.map(pt => pt.saveToObject());
    return save;
  }

  initFromObject(save) {
    this.vertexes = save.vertexes.map(pt => {
      let newVertex = new Point(0, 0, 'vertex', this, this.shape);
      newVertex.initFromObject(pt);
      return newVertex;
    });
    if (save.points && save.points.length) {
      this.points = save.points.map(pt => {
        let newPoint = new Point(0, 0, 'segmentPoint', this, this.shape);
        newPoint.initFromObject(pt);
        return newPoint;
      });
    }
    if (save.arcCenter) {
      let newPoint = new Point(0, 0, 'arcCenter', this, this.shape);
      newPoint.initFromObject(save.arcCenter);
      this.arcCenter = newPoint;
    }
    this.counterclockwise = save.counterclockwise;
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
  projectionPointOnSegment(point) {
    let proj = null,
      p1x = this.vertexes[0].x,
      p1y = this.vertexes[0].y,
      p2x = this.vertexes[1].x,
      p2y = this.vertexes[1].y;

    if (this.arcCenter) {
      const angle = this.arcCenter.getAngle(point),
        projection = new Point(
          this.radius * Math.cos(angle) + this.arcCenter.x,
          this.radius * Math.sin(angle) + this.arcCenter.y,
        );
      return projection;
    }

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

  isPointOnSegment(point) {
    if (this.arcCenter) {
      if (Math.abs(this.arcCenter.dist(point) - this.radius) > 0.01) return false;
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
      if (dist1 + dist2 - segmentLength > 1) return false;
      return true;
    }
  }

  get radius() {
    return this.arcCenter.dist(this.vertexes[1]);
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

  /**
   * return the non comon point of this if this is joined to segment (1 common point)
   * @param {*} segment
   */
  getNonCommonPointIfJoined(segment) {
    if (this.vertexes[0].equal(segment.vertexes[1]) && !this.vertexes[0].equal(segment.vertexes[0]))
      return this.vertexes[1];
    if (this.vertexes[0].equal(segment.vertexes[0]) && !this.vertexes[0].equal(segment.vertexes[1]))
      return this.vertexes[1];
    if (!this.vertexes[1].equal(segment.vertexes[1]) && this.vertexes[1].equal(segment.vertexes[0]))
      return this.vertexes[0];
    if (!this.vertexes[1].equal(segment.vertexes[0]) && this.vertexes[1].equal(segment.vertexes[1]))
      return this.vertexes[0];
    return undefined;
  }

  /**
   * return the middle of this if this is joined to segment (1 common point)
   * @param {*} segment
   */
  getMiddleIfJoined(segment) {
    if (this.vertexes[0].equal(segment.vertexes[1]) && !this.vertexes[0].equal(segment.vertexes[0]))
      return this.middle;
    if (this.vertexes[0].equal(segment.vertexes[0]) && !this.vertexes[0].equal(segment.vertexes[1]))
      return this.middle;
    if (!this.vertexes[1].equal(segment.vertexes[1]) && this.vertexes[1].equal(segment.vertexes[0]))
      return this.middle;
    if (!this.vertexes[1].equal(segment.vertexes[0]) && this.vertexes[1].equal(segment.vertexes[1]))
      return this.middle;
    return undefined;
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

  setScale(size) {
    this.vertexes.forEach(vertex => vertex.multiplyWithScalar(size, true));
    this.points.forEach(pt => pt.multiplyWithScalar(size, true));
  }

  rotate(angle, center = { x: 0, y: 0 }) {
    this.allPoints.forEach(pt => pt.rotate(angle, center));
  }

  translate(coordinates) {
    if (this.vertexes) this.vertexes.forEach(vertex => vertex.translate(coordinates));
    if (this.points) this.points.forEach(point => point.translate(coordinates));
    if (this.arcCenter) this.arcCenter.translate(coordinates);
  }

  reverse() {
    this.vertexes.reverse();
    // if (this.arcCenter)
    //   this.counterclockwise = !this.counterclockwise;
  }

  equal(segment) {
    if (this.vertexes[0].equal(segment.vertexes[1]) && this.vertexes[1].equal(segment.vertexes[0]))
      return true;
    if (this.vertexes[0].equal(segment.vertexes[0]) && this.vertexes[1].equal(segment.vertexes[1]))
      return true;
    return false;
  }

  getArcTangent(vertexNb) {
    let vertex = this.vertexes[vertexNb].copy(),
      center = this.arcCenter.copy(),
      originVector = vertex.subCoordinates(center),
      perpendicularOriginVector;
    originVector.multiplyWithScalar(1 / new Point(0, 0).dist(originVector), true);
    if (this.counterclockwise)
      perpendicularOriginVector = new Point(-1, originVector.x / originVector.y);
    else perpendicularOriginVector = new Point(1, -originVector.x / originVector.y);
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

  /**
   * If 2 segments have the same direction
   * @param {*} segment
   * @param {*} vertexNb1 - if arc, tangent to wich vertex of this
   * @param {*} vertexNb2 - if arc, tangent to wich vertex of segment
   */
  hasSameDirection(segment, vertexNb1, vertexNb2) {
    let dir1, dir2;
    if (this.arcCenter) dir1 = this.getArcTangent(vertexNb1);
    else dir1 = this.direction;
    if (segment.arcCenter) dir2 = segment.getArcTangent(vertexNb2);
    else dir2 = segment.direction;
    return Math.abs(dir1.x - dir2.x) < 0.001 && Math.abs(dir1.y - dir2.y) < 0.001;
  }
}
