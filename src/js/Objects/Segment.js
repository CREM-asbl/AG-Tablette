import { Point } from './Point';

//Todo : Refactorer en Objet externe une fois que coordinates plus nécessaire
export class Segment {
  constructor(point1, point2, isArc = false, arcCenter) {
    // if (point1 instanceof Point && point2 instanceof Point)
    //   this.vertexes = [point1, point2];
    // else
    this.vertexes = [new Point(point1), new Point(point2)];
    this.points = [];
    this.isArc = isArc;
    if (this.isArc) this.arcCenter = arcCenter;
    else this.arcCenter = null;
  }

  addPoint({ x, y }) {
    //TODO: garder les points triés?
    this.points.push(new Point(x, y));
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
    [...this.points, ...this.vertexes].forEach((point, idx, points) => {
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
    let copy = new Segment(this.vertexes[0], this.vertexes[1], this.isArc);
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
      points: this.points.map(pt => pt.saveToObject()),
      isArc: this.isArc,
      arcCenter: this.arcCenter,
    };
    return save;
  }

  initFromObject(save) {
    this.vertexes = save.vertexes.map(pt => {
      let newVertex = new Point();
      newVertex.initFromObject(pt);
      return newVertex;
    });
    if (save.points) {
      this.points = save.points.forEach(pt => {
        let newPoint = new Point();
        newPoint.initFromObject(pt);
        return newPoint;
      });
    }
    if (save.isArc) this.isArc = save.isArc;
    if (save.arcCenter) this.arcCenter = save.arcCenter;
  }

  projectionPointOnSegment(point) {
    let center = null,
      p1x = this.vertexes[0].x,
      p1y = this.vertexes[0].y,
      p2x = this.vertexes[1].x,
      p2y = this.vertexes[1].y;

    //Calculer la projection du point sur l'axe.
    if (Math.abs(p2x - p1x) < 0.001) {
      //segment vertical
      center = new Point({ x: p1x, y: point.y });
    } else if (Math.abs(p2y - p1y) < 0.001) {
      //segment horizontal
      center = new Point({ x: point.x, y: p1y });
    } else {
      // axe.type=='NW' || axe.type=='SW'
      let f_a = (p1y - p2y) / (p1x - p2x),
        f_b = p2y - f_a * p2x,
        x2 = (point.x + point.y * f_a - f_a * f_b) / (f_a * f_a + 1),
        y2 = f_a * x2 + f_b;
      center = new Point({
        x: x2,
        y: y2,
      });
    }
    return center;
  }

  isPointOnSegment(point) {
    // change for circle
    let segmentLength = this.length,
      dist1 = this.vertexes[0].dist(point),
      dist2 = this.vertexes[1].dist(point);

    if (dist1 + dist2 - segmentLength > 1) return false;
    return true;
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
    return new Point(
      (this.vertexes[0].x + this.vertexes[1].x) / 2,
      (this.vertexes[0].y + this.vertexes[1].y) / 2,
    );
  }

  setScale(size) {
    this.vertexes.forEach(vertex => vertex.multiplyWithScalar(size, true));
    this.points.forEach(pt => pt.multiplyWithScalar(size, true));
  }

  rotate(angle, center = { x: 0, y: 0 }) {
    this.vertexes.forEach(vertex => vertex.rotate(angle, center));
    this.points.forEach(pt => {
      let pointCoords = pt.rotate(angle, center);
      pt.x = pointCoords.x;
      pt.y = pointCoords.y;
    });
  }

  translate(coordinates) {
    this.vertexes.forEach(vertex => vertex.translate(coordinates));
    this.points.forEach(point => point.translate(coordinates));
  }

  reverse() {
    this.vertexes.reverse();
  }

  equal(segment) {
    if (this.vertexes[0].equal(segment.vertexes[1]) && this.vertexes[1].equal(segment.vertexes[0]))
      return true;
    if (this.vertexes[0].equal(segment.vertexes[0]) && this.vertexes[1].equal(segment.vertexes[1]))
      return true;
    return false;
  }

  hasSameDirection(segment) {
    return (
      Math.abs(this.direction.x - segment.direction.x) < 0.001 &&
      Math.abs(this.direction.y - segment.direction.y) < 0.001
    );
  }
}
