import { ShapeManager } from '../Managers/ShapeManager';
import { Point } from './Point';
import { uniqId, mod } from '../Tools/general';
import { app } from '../App';
import { Bounds } from './Bounds';

export class Segment {
  /**
   * @param {String}                      id
   * @param {DrawingEnvironment}          drawingEnvironment
   * @param {String}                      shapeId
   * @param {Number}                      idx
   * @param {[String]}                    vertexIds
   * @param {[String]}                    divisionPointIds
   * @param {String}                      arcCenterId
   * @param {Boolean}                     counterclockwise
   * @param {Boolean}                     isInfinite
   * @param {Boolean}                     isSemiInfinite
   */
  constructor({
    id = uniqId(),
    drawingEnvironment = app.workspace,
    shapeId = undefined,
    idx = undefined,
    vertexIds = [],
    divisionPointIds = [],
    arcCenterId = undefined,
    counterclockwise = false,
    isInfinite = false,
    isSemiInfinite = false,
  }) {
    this.id = id;

    this.drawingEnvironment = drawingEnvironment;
    this.drawingEnvironment.segments.push(this);

    this.shapeId = shapeId;
    this.idx = idx;
    this.vertexIds = [...vertexIds];
    this.vertexIds.forEach(vxId =>
      this.drawingEnvironment.points
        .find(pt => pt.id === vxId)
        .segmentIds.push(this.id)
    );
    this.divisionPointIds = [...divisionPointIds];
    this.divisionPointIds.forEach(dptId =>
      this.drawingEnvironment.points
        .find(pt => pt.id === dptId)
        .segmentIds.push(this.id)
    );
    this.shapeId = shapeId;
    if (this.shapeId !== undefined)
      this.drawingEnvironment.shapes
        .find(s => s.id === this.shapeId)
        .segmentIds.push(this.id);
    this.arcCenterId = arcCenterId;
    this.counterclockwise = counterclockwise;
    this.isInfinite = isInfinite;
    this.isSemiInfinite = isSemiInfinite;
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get shape() {
    let shape = this.drawingEnvironment.shapes.find(s => s.id === this.shapeId);
    return shape;
  }

  get points() {
    let points = [...this.divisionPoints, ...this.vertexes];
    return points;
  }

  get vertexes() {
    let vertexes = this.vertexIds.map(ptId =>
      this.drawingEnvironment.points.find(pt => pt.id === ptId)
    );
    return vertexes;
  }

  get divisionPoints() {
    let divisionPoints = this.divisionPointIds.map(ptId =>
      this.drawingEnvironment.points.find(pt => pt.id === ptId)
    );
    return divisionPoints;
  }

  get bounds() {
    let v0 = this.vertexes[0],
      v1 = this.vertexes[1];
    let bounds = new Bounds(
      Math.min(v0.x, v1.x),
      Math.min(v0.y, v1.y),
      Math.max(v0.x, v1.x),
      Math.max(v0.y, v1.y)
    );
    if (this.arcCenter) {
      let proj = this.centerProjectionOnSegment(Math.PI);
      if (this.isPointOnSegment(proj))
        bounds.minX = Math.min(bounds.minX, proj);
      proj = this.centerProjectionOnSegment(1.5 * Math.PI);
      if (this.isPointOnSegment(proj))
        bounds.minY = Math.min(bounds.minY, proj);
      proj = this.centerProjectionOnSegment(0);
      if (this.isPointOnSegment(proj))
        bounds.maxX = Math.max(bounds.maxX, proj);
      proj = this.centerProjectionOnSegment(0.5 * Math.PI);
      if (this.isPointOnSegment(proj))
        bounds.maxY = Math.max(bounds.maxY, proj);
    }
    return bounds;
  }

  get radius() {
    if (!this.arcCenter) {
      console.error('cannot take radius of straight segment ', this);
      return 0;
    }
    return this.arcCenter.dist(this.vertexes[1]);
  }

  /**
   * @returns conbinaisons de tous les sous-segments possibles
   * (segment d'un point/vertex à un autre point/vertex)
   */
  get subSegments() {
    let result = [];
    this.allPoints.forEach((point, idx, points) => {
      points.slice(idx + 1).forEach(pt => {
        result.push(
          new Segment(
            point,
            pt,
            this.shape,
            this.idx,
            this.arcCenter,
            this.counterclockwise
          )
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

      if (this.counterclockwise ^ (firstAngle > secondAngle))
        middleAngle += Math.PI;
      const middle = new Point(
        this.radius * Math.cos(middleAngle) + center.x,
        this.radius * Math.sin(middleAngle) + center.y
      );
      return middle;
    } else {
      return new Point(
        (this.vertexes[0].x + this.vertexes[1].x) / 2,
        (this.vertexes[0].y + this.vertexes[1].y) / 2
      );
    }
  }

  /**
   * return the non common point of this if this is joined to segment (1 common point)
   * @param {Segment}  segment
   */
  getNonCommonPointIfJoined(segment) {
    let jointure = this.vertexes.filter(v1 =>
      segment.vertexes.some(v2 => v1.equal(v2))
    );
    if (jointure) return jointure[0];
    else return undefined;
  }

  /**
   * return the middle of this if this is joined to segment (1 common point)
   * @param {Segment} segment
   */
  getMiddleIfJoined(segment) {
    if (this.vertexes.some(v1 => segment.vertexes.some(v2 => v1.equal(v2))))
      return this.middle;
    else return undefined;
  }

  getAngleWithHorizontal() {
    return this.vertexes[0].getAngle(this.vertexes[1]);
  }

  /**
   * convertit le segment en commande de path svg
   */
  getSVGPath(scaling = 'scale', axeAngle = undefined) {
    let firstCoordinates = this.vertexes[0].coordinates,
      secondCoordinates = this.vertexes[1].coordinates;
    if (this.isInfinite) {
      let angle = this.getAngleWithHorizontal();
      firstCoordinates = firstCoordinates.substract({
        x: 10000 * Math.cos(angle),
        y: 10000 * Math.sin(angle),
      });
      secondCoordinates = secondCoordinates.add({
        x: 10000 * Math.cos(angle),
        y: 10000 * Math.sin(angle),
      });
    } else if (this.isSemiInfinite) {
      let angle = this.getAngleWithHorizontal();
      secondCoordinates = secondCoordinates.add({
        x: 10000 * Math.cos(angle),
        y: 10000 * Math.sin(angle),
      });
    }

    if (scaling == 'scale') {
      firstCoordinates = firstCoordinates.toCanvasCoordinates();
      secondCoordinates = secondCoordinates.toCanvasCoordinates();
    }

    let path,
      moveTo = '';

    if (
      !this.shape ||
      this.idx == 0 ||
      this.vertexIds[0] !== this.previousSegment.vertexIds[1]
    ) {
      moveTo = ['M', firstCoordinates.x, firstCoordinates.y, ''].join(' ');
    }

    if (!this.arcCenter) {
      // line
      path = ['L', secondCoordinates.x, secondCoordinates.y].join(' ');
    } else if (axeAngle === undefined) {
      // circle or arc
      let ctr = new Point(this.arcCenter);
      if (scaling == 'scale') ctr.setToCanvasCoordinates();
      let radius = ctr.dist(v1),
        firstAngle = ctr.getAngle(v0),
        secondAngle = ctr.getAngle(v1);

      if (v0.equal(v1)) {
        // circle
        const oppositeAngle = firstAngle + Math.PI,
          oppositePoint = new Point(
            ctr.x + Math.cos(oppositeAngle) * radius,
            ctr.y + Math.sin(oppositeAngle) * radius
          );
        path = ['A', radius, radius, 0, 1, 0, oppositePoint.x, oppositePoint.y]
          .concat(['A', radius, radius, 0, 1, 0, v1.x, v1.y])
          .join(' ');
      } else {
        // arc
        if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
        let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
          sweepFlag = 1;
        if (this.counterclockwise) {
          sweepFlag = Math.abs(sweepFlag - 1);
          largeArcFlag = Math.abs(largeArcFlag - 1);
        }
        path = [
          'A',
          radius,
          radius,
          0,
          largeArcFlag,
          sweepFlag,
          v1.x,
          v1.y,
        ].join(' ');
      }
    } else {
      // ellipse or ellipse arc

      let ctr = new Point(this.arcCenter);
      if (scaling == 'scale') ctr.setToCanvasCoordinates();
      let firstAngle = ctr.getAngle(v0),
        secondAngle = ctr.getAngle(v1);

      if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
      let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
        sweepFlag = 1;
      if (this.counterclockwise) {
        sweepFlag = Math.abs(sweepFlag - 1);
        largeArcFlag = Math.abs(largeArcFlag - 1);
      }

      let rx = ctr.dist(this.tangentPoint1),
        ry = ctr.dist(this.tangentPoint2),
        degreeAxeAngle = (axeAngle * 180) / Math.PI;
      // canvas path2D => radian
      // svg path => degree

      if (v0.equal(v1)) {
        // ellipse
        const oppositePoint = new Point(
          ctr.multiplyWithScalar(2).subCoordinates(v0)
        );

        path = [
          'A',
          rx,
          ry,
          degreeAxeAngle,
          largeArcFlag,
          sweepFlag,
          oppositePoint.x,
          oppositePoint.y,
        ]
          .concat([
            'A',
            rx,
            ry,
            degreeAxeAngle,
            largeArcFlag,
            sweepFlag,
            v1.x,
            v1.y,
          ])
          .join(' ');
      } else {
        // arc ellipse
        path = [
          'A',
          rx,
          ry,
          degreeAxeAngle,
          largeArcFlag,
          sweepFlag,
          v1.x,
          v1.y,
        ].join(' ');
      }
    }

    let resultingPath = moveTo + path;

    return resultingPath;
  }

  get previousSegment() {
    if (!this.shapeId) {
      console.error('Cannot take previous Segment when no shape.');
      return null;
    }
    let numberOfSegments = this.shape.segmentIds.length;
    if (numberOfSegments == 1) {
      console.alert('Previous Segment of Shape with one Segment returns this.');
    }
    let previousIdx = mod(this.idx - 1, numberOfSegments);
    let previousSegment = this.shape.segments[previousIdx];
    return previousSegment;
  }

  get nextSegment() {
    if (!this.shapeId) {
      console.error('Cannot take next Segment when no shape.');
      return null;
    }
    let numberOfSegments = this.shape.segmentIds.length;
    if (numberOfSegments == 1) {
      console.alert('Next Segment of Shape with one Segment returns this.');
    }
    let nextIdx = mod(this.idx + 1, numberOfSegments);
    let nextSegment = this.shape.segments[nextIdx];
    return nextSegment;
  }

  getArcTangent(vertexNb) {
    let vertex = this.vertexes[vertexNb],
      center = this.arcCenter,
      originVector = vertex.subCoordinates(center),
      perpendicularOriginVector;
    originVector.multiplyWithScalar(1 / this.radius, true);
    if (this.counterclockwise)
      perpendicularOriginVector = new Point(
        1,
        -originVector.x / originVector.y
      );
    else
      perpendicularOriginVector = new Point(
        -1,
        originVector.x / originVector.y
      );
    if (perpendicularOriginVector.y == Infinity)
      perpendicularOriginVector.setCoordinates({ x: 0, y: 1 });
    if (perpendicularOriginVector.y == -Infinity)
      perpendicularOriginVector.setCoordinates({ x: 0, y: -1 });
    else
      perpendicularOriginVector.multiplyWithScalar(
        1 / new Point(0, 0).dist(perpendicularOriginVector),
        true
      );
    return perpendicularOriginVector;
  }

  /* #################################################################### */
  /* ########################## SEGMENT POINTS ########################## */
  /* #################################################################### */

  addPoint({ x, y, ratio }) {
    //TODO: garder les points triés?
    let newPoint = new Point(
      x,
      y,
      'segmentPoint',
      this,
      this.shape,
      undefined,
      ratio
    );
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
      pt1.dist(this.vertexes[start]) > pt2.dist(this.vertexes[start]) ? 1 : -1
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
    if (this.points)
      this.points.forEach(pt => pt.multiplyWithScalar(scaling, true));
    if (this.arcCenter) this.arcCenter.multiplyWithScalar(scaling, true);
  }

  // rotate(angle, center = { x: 0, y: 0 }) {
  //   this.allPoints.forEach(pt => pt.rotate(angle, center));
  //   if (this.arcCenter) this.arcCenter.rotate(angle, center);
  // }

  translate(coordinates) {
    if (this.vertexes)
      this.vertexes.forEach(vertex => vertex.translate(coordinates));
    if (this.points) this.points.forEach(point => point.translate(coordinates));
    if (this.arcCenter) this.arcCenter.translate(coordinates);
  }

  reverse(changeClockwise = false) {
    this.vertexes.reverse();
    if (this.arcCenter && changeClockwise)
      this.counterclockwise = !this.counterclockwise;
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
      this.isInfinite,
      this.isSemiInfinite
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
    if (this.points && this.points.length)
      save.points = this.points.map(pt => pt.saveToObject());
    if (this.idx !== undefined) save.idx = this.idx;
    if (this.shape) save.shapeId = this.shape.id;
    if (this.arcCenter) save.arcCenter = this.arcCenter.saveToObject();
    if (this.counterclockwise) save.counterclockwise = this.counterclockwise;
    save.isInfinite = this.isInfinite;
    save.isSemiInfinite = this.isSemiInfinite;
    return save;
  }

  initFromObject(save) {
    if (save.shape) this.shape = save.shape;
    else if (save.shapeId) this.shape = ShapeManager.getShapeById(save.shapeId);

    this.vertexes = save.vertexes.map(pt => {
      let newVertex = new Point(pt, 'vertex', this, this.shape, pt.name);
      return newVertex;
    });
    if (save.points && save.points.length) {
      this.points = save.points.map(pt => {
        let newPoint = new Point(
          pt,
          'segmentPoint',
          this,
          this.shape,
          pt.name,
          pt.ratio
        );
        return newPoint;
      });
    }
    if (save.idx !== undefined) this.idx = save.idx;
    if (save.arcCenter) {
      let newPoint = new Point(
        save.arcCenter,
        'arcCenter',
        this,
        this.shape,
        save.arcCenter.name
      );
      this.arcCenter = newPoint;
    }
    if (save.counterclockwise) this.counterclockwise = save.counterclockwise;
    if (save.tangentPoint1) this.tangentPoint1 = new Point(save.tangentPoint1);
    if (save.tangentPoint2) this.tangentPoint2 = new Point(save.tangentPoint2);
    this.isInfinite = save.isInfinite;
    this.isSemiInfinite = save.isSemiInfinite;
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
   * divide a segment with points and return the subsegments
   * @param {Point[]} points the points for the divide
   */
  divideWith(points) {
    points.sort((pt1, pt2) =>
      pt1.dist(this.vertexes[0]) > pt2.dist(this.vertexes[0]) ? 1 : -1
    );
    let newSegments = [this.vertexes[0], ...points, this.vertexes[1]]
      .map((pt, idx, pts) =>
        idx == 0 ? undefined : new Segment(pts[idx - 1], pt)
      )
      .slice(1);
    return newSegments;
  }

  /**
   * Find the point's projection on this.
   *
   * For circle : https://math.stackexchange.com/questions/1744354/project-a-point-within-a-circle-onto-its-edge
   * @param {Coordinates} coordinates
   */
  projectionOnSegment(coordinates) {
    if (this.arcCenter) {
      const angle = this.arcCenter.getAngle(point),
        projection = new Point(
          this.radius * Math.cos(angle) + this.arcCenter.x,
          this.radius * Math.sin(angle) + this.arcCenter.y
        );
      return projection;
    } else {
      let proj = null,
        p1x = this.vertexes[0].x,
        p1y = this.vertexes[0].y,
        p2x = this.vertexes[1].x,
        p2y = this.vertexes[1].y;

      // Calculer la projection du point sur l'axe.
      if (Math.abs(p2x - p1x) < 0.001) {
        //segment vertical
        proj = new Coordinates({ x: p1x, y: coordinates.y });
      } else if (Math.abs(p2y - p1y) < 0.001) {
        //segment horizontal
        proj = new Coordinates({ x: coordinates.x, y: p1y });
      } else {
        // axe.type=='NW' || axe.type=='SW'
        let f_a = (p1y - p2y) / (p1x - p2x),
          f_b = p2y - f_a * p2x,
          x2 =
            (coordinates.x + coordinates.y * f_a - f_a * f_b) / (f_a * f_a + 1),
          y2 = f_a * x2 + f_b;
        proj = new Coordinates({
          x: x2,
          y: y2,
        });
      }
      return proj;
    }
  }

  static segmentWithAnglePassingThroughPoint(angle, point) {
    let otherPoint = new Point(
      point.x + Math.cos(angle) * 100,
      point.y + Math.sin(angle) * 100
    );
    let newSegment = new Segment(point, otherPoint);
    return newSegment;
  }

  /**
   * say if it is a subsegment (segment inside but no match with segmentPoints)
   * @param {Segment} subseg subsegment
   */
  isSubsegment(subseg) {
    return (
      this.isPointOnSegment(subseg.vertexes[0]) &&
      this.isPointOnSegment(subseg.vertexes[1])
    );
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
        this.radius * Math.sin(angle) + this.arcCenter.y
      );
      return projection;
    } else {
      console.trace('no arc passed here');
    }
  }

  isPointOnSegment(point, precision = 0.001) {
    if (this.arcCenter) {
      if (Math.abs(this.arcCenter.dist(point) - this.radius) > precision)
        return false;
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
      let projection = this.projectionOnSegment(point);
      if (this.isInfinite) {
        return projection.dist(point) < precision;
      } else if (this.isSemiInfinite) {
        return (
          projection.dist(point) < precision &&
          Math.abs(
            this.vertexes[0].getAngle(this.vertexes[1]) -
              this.vertexes[0].getAngle(projection)
          ) < 0.001
        );
      } else {
        let segmentLength = this.length,
          dist1 = this.vertexes[0].dist(point),
          dist2 = this.vertexes[1].dist(point);
        return dist1 + dist2 - segmentLength < precision;
      }
    }
  }

  /**
   * point d'intersection de 2 segments (ou prolongation)
   * @param {object} segment
   * @return le point ou null si segments parallèles
   */
  intersectPoint(segment) {
    let result = new Point(0, 0),
      thisSlope =
        (this.vertexes[0].y - this.vertexes[1].y) /
        (this.vertexes[0].x - this.vertexes[1].x),
      otherSegmentSlope =
        (segment.vertexes[0].y - segment.vertexes[1].y) /
        (segment.vertexes[0].x - segment.vertexes[1].x);

    // 2 segments verticaux
    if (!isFinite(thisSlope) && !isFinite(otherSegmentSlope)) return null;
    // this vertical
    else if (!isFinite(thisSlope)) {
      let pb =
        segment.vertexes[0].y - otherSegmentSlope * segment.vertexes[0].x;
      result.y = otherSegmentSlope * this.vertexes[0].x + pb;
      result.x = this.vertexes[0].x;
      // segment vertical
    } else if (!isFinite(otherSegmentSlope)) {
      let pa = this.vertexes[0].y - thisSlope * this.vertexes[0].x;
      result.y = thisSlope * segment.vertexes[0].x + pa;
      result.x = segment.vertexes[0].x;
      // 2 segments 'northisSlopeux'
    } else {
      if (Math.abs(thisSlope - otherSegmentSlope) < 0.001) return null;
      let pb =
        segment.vertexes[0].y - otherSegmentSlope * segment.vertexes[0].x;
      let pa = this.vertexes[0].y - thisSlope * this.vertexes[0].x;
      result.x = (pb - pa) / (thisSlope - otherSegmentSlope);
      result.y = thisSlope * result.x + pa;
    }
    return result;
  }

  /**
   * check si deux segments s'intersectent
   * @param {*} segment
   * @param {Boolean} allowProlongation verifie si les droites s'intersectent
   * @param {Boolean} falseIfEdgePoint si le point d'intersection est la terminaison d'un segment, return false
   */
  doesIntersect(segment, allowProlongation = false, falseIfEdgePoint = false) {
    let intersect_point = this.intersectPoint(segment);
    if (!intersect_point) return false;
    if (allowProlongation) return true;
    if (
      falseIfEdgePoint &&
      [...this.vertexes, ...segment.vertexes].some(vertex =>
        vertex.equal(intersect_point)
      )
    )
      return false;
    if (
      this.isPointOnSegment(intersect_point) &&
      segment.isPointOnSegment(intersect_point)
    )
      return true;
    return false;
  }

  contains(object, matchSegmentPoints = true) {
    if (object instanceof Segment)
      return this.subSegments.some(subSeg => subSeg.equal(object));
    else if (object instanceof Point)
      return (
        this.vertexes.some(vertex => vertex.equal(object)) ||
        (matchSegmentPoints && this.points.some(point => point.equal(object)))
      );
    else console.alert('unsupported object :', object);
  }

  equal(segment) {
    if ((this.arcCenter == undefined) ^ (segment.arcCenter == undefined))
      return false;
    // one is arc and the other not
    else if (
      (this.vertexes[0].equal(segment.vertexes[1]) &&
        this.vertexes[1].equal(segment.vertexes[0])) ||
      (this.vertexes[0].equal(segment.vertexes[0]) &&
        this.vertexes[1].equal(segment.vertexes[1]))
    ) {
      if (this.arcCenter) {
        return (
          this.arcCenter.equal(segment.arcCenter) &&
          (this.counterclockwise != segment.counterclockwise) ^
            this.vertexes[1].equal(segment.vertexes[1])
        );
      } else return true;
    } else {
      return false;
    }
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
    if (
      !matchArcAndOther &&
      (this.arcCenter != undefined) ^ (segment.arcCenter != undefined)
    )
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
    return (
      Math.abs(dir1.x - dir2.x) < 0.001 && Math.abs(dir1.y - dir2.y) < 0.001
    );
  }
}
