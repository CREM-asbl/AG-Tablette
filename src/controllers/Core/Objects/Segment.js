import { app } from '../App';
import { addInfoToId, findObjectById, isAlmostInfinite, mod, removeObjectById, uniqId } from '../Tools/general';
import { Bounds } from './Bounds';
import { Coordinates } from './Coordinates';
import { Point } from './Point';

export class Segment {
  /**
   * @param {String}                      id
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
    id,
    layer,
    shapeId = undefined,
    idx = undefined,
    createFromNothing = false,
    vertexCoordinates = [],
    divisionPointInfos = [],
    arcCenterCoordinates = null,
    vertexIds = [],
    divisionPointIds = [],
    arcCenterId = undefined,
    counterclockwise = false,
    isInfinite = false,
    isSemiInfinite = false,
    color = undefined,
    width = 1,
  }) {
    if (id == undefined)
      id = uniqId(layer, 'segment');
    else
      id = addInfoToId(id, layer, 'segment');
    this.id = id;
    this.layer = layer;
    this.canvasLayer.segments.push(this);

    this.shapeId = shapeId;
    this.idx = idx;
    if (createFromNothing) {
      this.vertexIds = vertexCoordinates.map((vCoord, idx) => {
        let newPoint = new Point({
          layer: this.layer,
          segmentIds: [this.id],
          shapeId: this.shapeId,
          idx: idx,
          type: 'vertex',
          coordinates: vCoord,
        });
        return newPoint.id;
      });
      this.divisionPointIds = divisionPointInfos.map((dInfo) => {
        let newPoint = new Point({
          layer: this.layer,
          segmentIds: [this.id],
          shapeId: this.shapeId,
          type: 'divisionPoint',
          coordinates: dInfo.coordinates,
          ratio: dInfo.ratio,
          color: dInfo.color,
        });
        return newPoint.id;
      });
      if (arcCenterCoordinates != undefined) {
        let arcCenter = new Point({
          layer: this.layer,
          segmentIds: [this.id],
          shapeId: this.shapeId,
          type: 'arcCenter',
          coordinates: arcCenterCoordinates,
          visible: false,
        });
        this.arcCenterId = arcCenter.id;
      }
    } else {
      this.vertexIds = [...vertexIds];
      this.vertexIds.forEach((vxId) =>
        findObjectById(vxId)
          .segmentIds.push(this.id),
      );
      this.divisionPointIds = [...divisionPointIds];
      this.divisionPointIds.forEach((dptId) =>
        findObjectById(dptId)
          .segmentIds.push(this.id),
      );
      this.shapeId = shapeId;
      if (this.shapeId !== undefined) {
        findObjectById(this.shapeId)
          .segmentIds.push(this.id);
      }
      this.arcCenterId = arcCenterId;
    }
    this.counterclockwise = counterclockwise;
    this.isInfinite = isInfinite;
    this.isSemiInfinite = isSemiInfinite;
    this.color = color;
    this.width = width;
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get canvasLayer() {
    return app[this.layer + 'CanvasLayer'];
  }

  get shape() {
    let shape = findObjectById(this.shapeId);
    return shape;
  }

  get points() {
    let points = [...this.divisionPoints, ...this.vertexes];
    return points;
  }

  get vertexes() {
    let vertexes = this.vertexIds.map((ptId) =>
      findObjectById(ptId)
    );
    return vertexes;
  }

  get divisionPoints() {
    let divisionPoints = this.divisionPointIds.map((ptId) =>
      findObjectById(ptId)
    );
    return divisionPoints;
  }

  get arcCenter() {
    let arcCenter = findObjectById(this.arcCenterId);
    return arcCenter;
  }

  get bounds() {
    let firstCoordinates = this.vertexes[0].coordinates,
      secondCoordinates = this.vertexes[1].coordinates;
    let bounds = new Bounds(
      Math.min(firstCoordinates.x, secondCoordinates.x),
      Math.min(firstCoordinates.y, secondCoordinates.y),
      Math.max(firstCoordinates.x, secondCoordinates.x),
      Math.max(firstCoordinates.y, secondCoordinates.y),
    );
    if (this.isArc()) {
      let proj = this.centerProjectionOnSegment(Math.PI);
      if (this.isCoordinatesOnSegment(proj))
        bounds.minX = Math.min(bounds.minX, proj.x);
      proj = this.centerProjectionOnSegment(1.5 * Math.PI);
      if (this.isCoordinatesOnSegment(proj))
        bounds.minY = Math.min(bounds.minY, proj.y);
      proj = this.centerProjectionOnSegment(0);
      if (this.isCoordinatesOnSegment(proj))
        bounds.maxX = Math.max(bounds.maxX, proj.x);
      proj = this.centerProjectionOnSegment(0.5 * Math.PI);
      if (this.isCoordinatesOnSegment(proj))
        bounds.maxY = Math.max(bounds.maxY, proj.y);
    }
    return bounds;
  }

  get radius() {
    if (!this.arcCenter) {
      console.error('cannot take radius of straight segment ', this);
      return 0;
    }
    return this.arcCenter.coordinates.dist(this.vertexes[1].coordinates);
  }

  get length() {
    return this.vertexes[0].coordinates.dist(this.vertexes[1].coordinates);
  }

  get direction() {
    const originVector = this.vertexes[1].coordinates.substract(
      this.vertexes[0].coordinates,
    );
    const normalOriginVector = originVector.multiply(1 / this.length);
    return normalOriginVector;
  }

  get middle() {
    if (this.isArc()) {
      let centerCoordinates = this.arcCenter.coordinates,
        firstAngle = centerCoordinates.angleWith(this.vertexes[0].coordinates),
        secondAngle = centerCoordinates.angleWith(this.vertexes[1].coordinates),
        middleAngle = (firstAngle + secondAngle) / 2;

      if (this.counterclockwise ^ (firstAngle > secondAngle))
        middleAngle += Math.PI;
      const middle = new Coordinates({
        x: this.radius * Math.cos(middleAngle) + centerCoordinates.x,
        y: this.radius * Math.sin(middleAngle) + centerCoordinates.y,
      });
      return middle;
    } else {
      return this.vertexes[0].coordinates.middleWith(
        this.vertexes[1].coordinates,
      );
    }
  }

  /**
   * return the non common point of this if this is joined to segment (1 common point)
   * @param {Segment}  segment
   */
  getNonCommonPointIfJoined(segment) {
    let jointure = this.vertexes.filter((v1) =>
      segment.vertexes.some((v2) => v1.equal(v2)),
    );
    if (jointure) return jointure[0];
    else return undefined;
  }

  /**
   * return the middle of this if this is joined to segment (1 common point)
   * @param {Segment} segment
   */
  getMiddleIfJoined(segment) {
    if (this.vertexes.some((v1) => segment.vertexes.some((v2) => v1.equal(v2))))
      return this.middle;
    else return undefined;
  }

  getAngleWithHorizontal() {
    return this.vertexes[0].coordinates.angleWith(this.vertexes[1].coordinates);
  }

  /**
   * convertit le segment en commande de path svg
   */
  getSVGPath(scaling = 'scale', includeMoveTo = false, infiniteCheck = true) {
    let firstCoordinates = this.vertexes[0].coordinates,
      secondCoordinates = this.vertexes[1].coordinates;
    if (infiniteCheck && this.isInfinite) {
      let angle = this.getAngleWithHorizontal();
      firstCoordinates = firstCoordinates.substract({
        x: 10000 * Math.cos(angle),
        y: 10000 * Math.sin(angle),
      });
      secondCoordinates = secondCoordinates.add({
        x: 10000 * Math.cos(angle),
        y: 10000 * Math.sin(angle),
      });
    } else if (infiniteCheck && this.isSemiInfinite) {
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
      this.vertexIds[0] !== this.previousSegment.vertexIds[1] ||
      includeMoveTo
    ) {
      moveTo = ['M', firstCoordinates.x, firstCoordinates.y, ''].join(' ');
    }

    if (!this.arcCenter) {
      // line
      path = ['L', secondCoordinates.x, secondCoordinates.y].join(' ');
    } else if (this.axisAngle === undefined) {
      // circle or arc
      let centerCoordinates = this.arcCenter.coordinates;
      if (scaling == 'scale')
        centerCoordinates = centerCoordinates.toCanvasCoordinates();

      let radius = centerCoordinates.dist(secondCoordinates),
        firstAngle = centerCoordinates.angleWith(firstCoordinates),
        secondAngle = centerCoordinates.angleWith(secondCoordinates);

      if (firstCoordinates.equal(secondCoordinates)) {
        // circle
        const oppositeAngle = firstAngle + Math.PI,
          oppositeCoordinates = new Coordinates({
            x: centerCoordinates.x + Math.cos(oppositeAngle) * radius,
            y: centerCoordinates.y + Math.sin(oppositeAngle) * radius,
          });
        path = [
          'A',
          radius,
          radius,
          0,
          1,
          0,
          oppositeCoordinates.x,
          oppositeCoordinates.y,
        ]
          .concat([
            'A',
            radius,
            radius,
            0,
            1,
            0,
            secondCoordinates.x,
            secondCoordinates.y,
          ])
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
          secondCoordinates.x,
          secondCoordinates.y,
        ].join(' ');
      }
    } else {
      // ellipse or ellipse arc

      let centerCoordinates = this.arcCenter.coordinates;
      if (scaling == 'scale')
        centerCoordinates = centerCoordinates.toCanvasCoordinates();

      let radius = centerCoordinates.dist(secondCoordinates),
        firstAngle = centerCoordinates.angleWith(firstCoordinates),
        secondAngle = centerCoordinates.angleWith(secondCoordinates);

      if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
      let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
        sweepFlag = 1;
      if (this.counterclockwise) {
        sweepFlag = Math.abs(sweepFlag - 1);
        largeArcFlag = Math.abs(largeArcFlag - 1);
      }

      // Ensure tangent points are in the same coordinate system as centerCoordinates
      // When scaling == 'scale', firstCoordinates/secondCoordinates/centerCoordinates are converted to canvas coordinates.
      // seg.tangentPoint1/2 are Points (logical coordinates). Convert them to canvas to avoid mixing units under zoom.
      let tp1 = this.tangentPoint1?.coordinates || this.tangentPoint1;
      let tp2 = this.tangentPoint2?.coordinates || this.tangentPoint2;
      if (scaling == 'scale') {
        tp1 = tp1?.toCanvasCoordinates ? tp1.toCanvasCoordinates() : tp1;
        tp2 = tp2?.toCanvasCoordinates ? tp2.toCanvasCoordinates() : tp2;
      }
      let rx = centerCoordinates.dist(tp1),
        ry = centerCoordinates.dist(tp2),
        degreeAxisAngle = (this.axisAngle * 180) / Math.PI;
      // canvas path2D => radian
      // svg path => degree

      if (firstCoordinates.equal(secondCoordinates)) {
        // ellipse
        const oppositeCoordinates = centerCoordinates
          .multiply(2)
          .substract(firstCoordinates);

        path = [
          'A',
          rx,
          ry,
          degreeAxisAngle,
          largeArcFlag,
          sweepFlag,
          oppositeCoordinates.x,
          oppositeCoordinates.y,
        ]
          .concat([
            'A',
            rx,
            ry,
            degreeAxisAngle,
            largeArcFlag,
            sweepFlag,
            secondCoordinates.x,
            secondCoordinates.y,
          ])
          .join(' ');
      } else {
        // arc ellipse
        path = [
          'A',
          rx,
          ry,
          degreeAxisAngle,
          largeArcFlag,
          sweepFlag,
          secondCoordinates.x,
          secondCoordinates.y,
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
      console.info('Previous Segment of Shape with one Segment returns this.');
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
      console.info('Next Segment of Shape with one Segment returns this.');
    }
    let nextIdx = mod(this.idx + 1, numberOfSegments);
    let nextSegment = this.shape.segments[nextIdx];
    return nextSegment;
  }

  getArcTangent(vertexNb) {
    let vertex = this.vertexes[vertexNb],
      center = this.arcCenter,
      originVector = vertex.coordinates.substract(center.coordinates),
      perpendicularOriginVector;
    originVector = originVector.multiply(1 / this.radius);
    if (Math.abs(originVector.y) < 0.001) originVector.y = 0;
    if (Math.abs(originVector.x) < 0.001) originVector.x = 0;
    let xCoordinate = 1;
    if (originVector.y > 0)
      xCoordinate *= -1;
    let yCoordinate = originVector.x / originVector.y;
    if (originVector.y < 0)
      yCoordinate *= -1;
    if (this.counterclockwise) {
      xCoordinate *= -1;
      yCoordinate *= -1;
    }
    perpendicularOriginVector = new Coordinates({
      x: xCoordinate,
      y: yCoordinate,
    });
    if (perpendicularOriginVector.y == Infinity)
      perpendicularOriginVector = new Coordinates({ x: 0, y: 1 });
    else if (perpendicularOriginVector.y == -Infinity)
      perpendicularOriginVector = new Coordinates({ x: 0, y: -1 });
    else
      perpendicularOriginVector = perpendicularOriginVector.multiply(
        1 / Coordinates.nullCoordinates.dist(perpendicularOriginVector),
      );
    return perpendicularOriginVector;
  }

  /* #################################################################### */
  /* ########################## SEGMENT POINTS ########################## */
  /* #################################################################### */

  addPoint(coordinates, ratio, firstPointId, secondPointId, verifyIfPointExists = true) {
    // if doesnt already exist
    if (
      !verifyIfPointExists ||
      this.divisionPoints.filter(divPt => divPt.visible).findIndex(
        (pt) => pt.coordinates.dist(coordinates) < 0.001,
      ) == -1
    ) {
      let newPoint = new Point({
        coordinates: coordinates,
        type: 'divisionPoint',
        ratio: ratio,
        layer: this.layer,
        shapeId: this.shapeId,
        segmentIds: [this.id],
        endpointIds: [firstPointId, secondPointId],
      });
      this.divisionPointIds.push(newPoint.id);
      return newPoint;
    }
  }

  /**
   * sort segment points from vertexes[start]
   * @param {*} start
   */
  sortDivisionPoints(start = 0) {
    this.divisionPointIds.sort((id1, id2) => {
      let pt1 = findObjectById(id1);
      let pt2 = findObjectById(id2);
      return (pt1.ratio - pt2.ratio) * (-start * 2 + 1);
    });
  }

  deletePoint(point) {
    let pointId = point.id;
    let i = this.divisionPointIds.findIndex((divisionPointId) => {
      return pointId == divisionPointId;
    });
    if (i == -1) {
      console.error("couldn't delete point from segment");
      return null;
    }
    this.divisionPointIds.splice(i, 1);
    i = this.shape.pointIds.findIndex((shapePointId) => {
      return pointId == shapePointId;
    });
    if (i == -1) {
      console.error("couldn't delete point from shape");
      return null;
    }
    this.shape.pointIds.splice(i, 1);
    removeObjectById(pointId);
  }

  /* #################################################################### */
  /* ############################ TRANSFORM ############################# */
  /* #################################################################### */

  scale(scaling) {
    this.vertexes.forEach((vertex) => vertex.multiplyWithScalar(scaling, true));
    if (this.points)
      this.points.forEach((pt) => pt.multiplyWithScalar(scaling, true));
    if (this.arcCenter) this.arcCenter.multiplyWithScalar(scaling, true);
  }

  translate(coordinates) {
    if (this.vertexes)
      this.vertexes.forEach((vertex) => vertex.translate(coordinates));
    if (this.points)
      this.points.forEach((point) => point.translate(coordinates));
    if (this.arcCenter) this.arcCenter.translate(coordinates);
  }

  reverse(changeClockwise = false) {
    this.vertexIds.reverse();
    this.vertexes.forEach((vx, idx) => (vx.idx = idx));
    this.divisionPoints.forEach((pt) => (pt.ratio = 1 - pt.ratio));
    if (this.arcCenter && changeClockwise)
      this.counterclockwise = !this.counterclockwise;
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  /**
   * divide a segment with points and return the subsegments
   * @param {Point[]} points the points for the divide
   */
  divideWith(points) {
    points.sort((pt1, pt2) =>
      pt1.coordinates.dist(this.vertexes[0].coordinates) >
        pt2.coordinates.dist(this.vertexes[0].coordinates)
        ? 1
        : -1,
    );
    let newSegments = [this.vertexes[0], ...points, this.vertexes[1]]
      .map((pt, idx, pts) =>
        idx == 0
          ? undefined
          : new Segment({
            layer: this.layer,
            createFromNothing: true,
            vertexCoordinates: [pts[idx - 1].coordinates, pt.coordinates],
          }),
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
      const angle = this.arcCenter.coordinates.angleWith(coordinates);
      const projection = this.centerProjectionOnSegment(angle);
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
   * @param {*} angle
   */
  centerProjectionOnSegment(angle) {
    if (this.arcCenter) {
      const projection = this.arcCenter.coordinates.add({
        x: this.radius * Math.cos(angle),
        y: this.radius * Math.sin(angle),
      });
      return projection;
    } else {
      console.trace('no arc passed here');
    }
  }

  isCoordinatesOnSegment(coord, precision = 0.001) {
    if (this.isArc()) {
      if (
        Math.abs(this.arcCenter.coordinates.dist(coord) - this.radius) >
        precision
      )
        return false;
      let angle = this.arcCenter.coordinates.angleWith(coord),
        bound1 = this.arcCenter.coordinates.angleWith(
          this.vertexes[0].coordinates,
        ),
        bound2 = this.arcCenter.coordinates.angleWith(
          this.vertexes[1].coordinates,
        );
      if (Math.abs(bound1 - bound2) < 0.001) return true;
      if (this.counterclockwise) [bound1, bound2] = [bound2, bound1];
      if (angle < bound1) angle += Math.PI * 2;
      if (bound2 < bound1) bound2 += Math.PI * 2;
      if (angle <= bound2) return true;
      return false;
    } else {
      let projection = this.projectionOnSegment(coord);
      if (this.isInfinite) {
        return projection.dist(coord) < precision;
      } else if (this.isSemiInfinite) {
        return (
          projection.dist(coord) < precision &&
          Math.abs(
            this.vertexes[0].coordinates.angleWith(
              this.vertexes[1].coordinates,
            ) - this.vertexes[0].coordinates.angleWith(projection),
          ) < 0.001
        );
      } else {
        let segmentLength = this.length,
          dist1 = this.vertexes[0].coordinates.dist(coord),
          dist2 = this.vertexes[1].coordinates.dist(coord);
        return dist1 + dist2 - segmentLength < precision;
      }
    }
  }

  arcParelleleWith(segment) {
    if (this.arcCenter.coordinates.equal(segment.arcCenter.coordinates) && this.radius == segment.radius) {
      return true;
    }
    return false;
  }

  isParalleleWith(segment) {
    if (this.isArc() && segment.isArc()) {
      return this.arcParelleleWith(segment);
    } else if (this.isArc() || segment.isArc()) {
      return false;
    }
    let thisv0x = this.vertexes[0].x,
      thisv0y = this.vertexes[0].y,
      thisv1x = this.vertexes[1].x,
      thisv1y = this.vertexes[1].y,
      segmentv0x = segment.vertexes[0].x,
      segmentv0y = segment.vertexes[0].y,
      segmentv1x = segment.vertexes[1].x,
      segmentv1y = segment.vertexes[1].y,
      thisSlope = (thisv0y - thisv1y) / (thisv0x - thisv1x),
      segmentSlope = (segmentv0y - segmentv1y) / (segmentv0x - segmentv1x);
    if (Math.abs(thisSlope - segmentSlope) < 0.001) {
      return true;
    }
    return false;
  }

  /**
   * point d'intersection de 2 segments (ou prolongation)
   * @param {object} segment
   * @return le point ou null si segments parallèles
   */
  intersectionWith(segment, precision = 1, coordinatesIfParalleleSegments) {
    if (this.isArc() || segment.isArc()) {
      return this.arcIntersectionWith(segment, precision);
    }
    let result = Coordinates.nullCoordinates,
      thisv0x = this.vertexes[0].x,
      thisv0y = this.vertexes[0].y,
      thisv1x = this.vertexes[1].x,
      thisv1y = this.vertexes[1].y,
      segmentv0x = segment.vertexes[0].x,
      segmentv0y = segment.vertexes[0].y,
      segmentv1x = segment.vertexes[1].x,
      segmentv1y = segment.vertexes[1].y,
      thisSlope = (thisv0y - thisv1y) / (thisv0x - thisv1x),
      segmentSlope = (segmentv0y - segmentv1y) / (segmentv0x - segmentv1x);

    // 2 segments parallèles
    if (Math.abs(thisSlope - segmentSlope) < 0.001) {
      if (coordinatesIfParalleleSegments) {
        if (this.isCoordinatesOnSegment(coordinatesIfParalleleSegments) && segment.isCoordinatesOnSegment(coordinatesIfParalleleSegments)) {
          return [coordinatesIfParalleleSegments];
        } else {
          return null;
        }
      }
      return null;
    }

    // 2 segments verticaux
    if (isAlmostInfinite(thisSlope) && isAlmostInfinite(segmentSlope))
      return null;
    // this vertical
    else if (isAlmostInfinite(thisSlope)) {
      let pb = segmentv0y - segmentSlope * segmentv0x;
      result.y = segmentSlope * thisv0x + pb;
      result.x = thisv0x;
      // segment vertical
    } else if (isAlmostInfinite(segmentSlope)) {
      let pa = thisv0y - thisSlope * thisv0x;
      result.y = thisSlope * segmentv0x + pa;
      result.x = segmentv0x;
      // 2 segments 'normaux'
    } else {
      let pb = segmentv0y - segmentSlope * segment.vertexes[0].x;
      let pa = thisv0y - thisSlope * this.vertexes[0].x;
      result.x = (pb - pa) / (thisSlope - segmentSlope);
      result.y = thisSlope * result.x + pa;
    }
    if (!this.isCoordinatesOnSegment(result) || !segment.isCoordinatesOnSegment(result)) {
      return null;
    }
    return [result];
  }

  arcIntersectionWith(segment, precision = 1) {
    let result = [];
    if (this.isArc() && segment.isArc()) { // two circles
      // formules tirées de http://math.15873.pagesperso-orange.fr/IntCercles.html
      const R0 = this.radius, R1 = segment.radius;
      const x0 = this.arcCenter.coordinates.x, y0 = this.arcCenter.coordinates.y;
      const x1 = segment.arcCenter.coordinates.x, y1 = segment.arcCenter.coordinates.y;
      const dist2Centers = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
      if (dist2Centers < 1 && Math.abs(R0 - R1) < 1)
        return null;
      else if (dist2Centers > R0 + R1)
        return null;
      else if (dist2Centers < Math.abs(R1 - R0))
        return null;
      else if (Math.abs(dist2Centers - R0 - R1) < 1) {
        const angleBetweenCenter = this.arcCenter.coordinates.angleWith(segment.arcCenter.coordinates);
        return [this.centerProjectionOnSegment(angleBetweenCenter)];
      } else if (dist2Centers - Math.abs(R0 - R1) < 1) {
        if (R0 > R1) {
          const angleBetweenCenter = this.arcCenter.coordinates.angleWith(segment.arcCenter.coordinates);
          return [this.centerProjectionOnSegment(angleBetweenCenter)];
        } else {
          const angleBetweenCenter = segment.arcCenter.coordinates.angleWith(this.arcCenter.coordinates);
          return [segment.centerProjectionOnSegment(angleBetweenCenter)];
        }
      } else if (y0 == y1) {
        const x = (R1 ** 2 - R0 ** 2 - x1 ** 2 + x0 ** 2) / (2 * (x0 - x1));
        const A = 1, B = -2 * y1, C = x1 ** 2 + x ** 2 - 2 * x1 * x + y1 ** 2 - R1 ** 2;
        const delta = Math.sqrt((B ** 2) - 4 * A * C);
        const resulty0 = (-B + delta) / (2 * A), resulty1 = (-B - delta) / (2 * A);
        result = [new Coordinates({ x, y: resulty0 }), new Coordinates({ x, y: resulty1 })];
      } else {
        const N = (R1 ** 2 - R0 ** 2 - x1 ** 2 + x0 ** 2 - y1 ** 2 + y0 ** 2) / (2 * (y0 - y1));
        const quotien = (x0 - x1) / (y0 - y1);
        const A = quotien ** 2 + 1, B = (2 * y0 * quotien) - (2 * N * quotien) - 2 * x0, C = x0 ** 2 + y0 ** 2 + N ** 2 - R0 ** 2 - (2 * y0 * N);
        const delta = Math.sqrt((B ** 2) - 4 * A * C);
        const resultx0 = (-B + delta) / (2 * A), resultx1 = (-B - delta) / (2 * A);
        const resulty0 = N - resultx0 * quotien, resulty1 = N - resultx1 * quotien;
        result = [new Coordinates({ x: resultx0, y: resulty0 }), new Coordinates({ x: resultx1, y: resulty1 })];
      }
    } else if (this.isArc() && !segment.isArc()) { // a circle and a right line
      let projection = segment.projectionOnSegment(this.arcCenter.coordinates);
      let dist1 = projection.dist(this.arcCenter.coordinates);
      let hypothenusLength = this.radius;
      if (dist1 > hypothenusLength)
        return null;
      else if (Math.abs(dist1 - hypothenusLength) < precision) {
        return [projection];
      } else {
        let dist2 = Math.sqrt(Math.pow(hypothenusLength, 2) - Math.pow(dist1, 2));
        let segmentAngle = segment.getAngleWithHorizontal();
        let firstCoord = new Coordinates({
          x: projection.x + Math.cos(segmentAngle) * dist2,
          y: projection.y + Math.sin(segmentAngle) * dist2,
        });
        let secondCoord = new Coordinates({
          x: projection.x + Math.cos(segmentAngle) * -dist2,
          y: projection.y + Math.sin(segmentAngle) * -dist2,
        });
        result = [firstCoord, secondCoord];
      }
    } else if (!this.isArc() && segment.isArc()) {
      return segment.arcIntersectionWith(this, precision);
    }
    result = result.filter(res => this.isCoordinatesOnSegment(res) &&
      segment.isCoordinatesOnSegment(res));
    result.sort((r1, r2) => {
      if (Math.abs(r1.y - r2.y) < 0.001)
        return r1.x - r2.x;
      return r1.y - r2.y;
    });
    if (result.length == 0)
      return null;
    return result;
  }

  /**
   * check si deux segments s'intersectent
   * @param {*} segment
   * @param {Boolean} falseIfEdgePoint si le point d'intersection est la terminaison d'un segment, return false
   */
  doesIntersect(segment, falseIfEdgePoint = false) {
    let intersections = this.intersectionWith(segment);
    if (intersections == null) return false;
    if (falseIfEdgePoint) {
      for (let i = 0; i < intersections.length; i++) {
        if ([...this.vertexes, ...segment.vertexes].some((vertex) => vertex.coordinates.equal(intersections[i]))) {
          intersections.splice(i, 1);
          i--;
        }
      }
    }
    if (intersections.length == 0)
      return false;
    if (
      intersections.some(intersection =>
        this.isCoordinatesOnSegment(intersection) &&
        segment.isCoordinatesOnSegment(intersection)
      )
    )
      return true;
    return false;
  }

  contains(object, matchSegmentPoints = true) {
    if (object instanceof Segment) {
      if (matchSegmentPoints) {
        return object.vertexes.every(
          (vx) =>
            this.points.findIndex((point) =>
              point.coordinates.equal(vx.coordinates),
            ) != -1,
        );
      } else {
        console.info('not implemented yet');
      }
    } else if (object instanceof Point)
      return (
        this.vertexes.some((vertex) => vertex.equal(object)) ||
        (matchSegmentPoints && this.points.some((point) => point.equal(object)))
      );
    else if (object instanceof Coordinates) {
      return (
        this.vertexes.some((vertex) => vertex.coordinates.equal(object)) ||
        (matchSegmentPoints &&
          this.points.some((point) => point.coordinates.equal(object)))
      );
    } else console.info('unsupported object :', object);
  }

  equal(segment) {
    if ((this.isArc()) ^ (segment.isArc())) {
      return false;
    }
    // one is arc and the other not
    else if (
      (this.vertexes[0].coordinates.equal(segment.vertexes[1].coordinates) &&
        this.vertexes[1].coordinates.equal(segment.vertexes[0].coordinates)) ||
      (this.vertexes[0].coordinates.equal(segment.vertexes[0].coordinates) &&
        this.vertexes[1].coordinates.equal(segment.vertexes[1].coordinates))
    ) {
      if (this.isArc()) {
        return (
          this.arcCenter.coordinates.equal(segment.arcCenter.coordinates) &&
          (this.counterclockwise != segment.counterclockwise) ^
          this.vertexes[1].coordinates.equal(segment.vertexes[1].coordinates)
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
    if (!matchArcAndOther && this.isArc() ^ segment.isArc()) return false;
    if (
      this.isArc() &&
      segment.isArc() &&
      !this.arcCenter.coordinates.equal(segment.arcCenter.coordinates, 0.001)
    ) {
      return false;
    }
    if (
      this.isArc() &&
      segment.isArc() &&
      this.arcCenter.coordinates.equal(segment.arcCenter.coordinates, 0.001) &&
      this.radius == 0 &&
      segment.radius == 0
    ) {
      return true;
    }
    if (this.isArc()) dir1 = this.getArcTangent(vertexNb1);
    else dir1 = this.direction;
    if (segment.isArc()) dir2 = segment.getArcTangent(vertexNb2);
    else dir2 = segment.direction;
    return (
      Math.abs(dir1.x - dir2.x) < 0.001 && Math.abs(dir1.y - dir2.y) < 0.001
    );
  }

  isArc() {
    let isArc = this.arcCenter ? true : false;
    return isArc;
  }

  saveData() {
    let data = {
      id: this.id,
      shapeId: this.shapeId,
      position: this.layer,
      idx: this.idx,
      vertexIds: [...this.vertexIds],
      // divisionPointIds: [...this.divisionPointIds],
      // arcCenterId: this.arcCenterId,
      // counterclockwise: this.counterclockwise,
      // isInfinite: this.isInfinite,
      // isSemiInfinite: this.isSemiInfinite,
      // color: this.color,
      // width: this.width,
    };

    if (this.divisionPointIds.length !== 0)
      data.divisionPointIds = [...this.divisionPointIds];
    if (this.arcCenterId != undefined)
      data.arcCenterId = this.arcCenterId;
    if (this.counterclockwise !== false)
      data.counterclockwise = this.counterclockwise;
    if (this.isInfinite !== false)
      data.isInfinite = this.isInfinite;
    if (this.isSemiInfinite !== false)
      data.isSemiInfinite = this.isSemiInfinite;
    if (this.color != undefined)
      data.color = this.color;
    if (this.width !== 1)
      data.width = this.width;
    return data;
  }

  static loadFromData(data) {
    if (!data.position) data.position = 'main';
    let segment = new Segment({ layer: data.position });
    Object.assign(segment, data);
    segment.vertexIds = [...data.vertexIds];
    if (data.divisionPointIds)
      segment.divisionPointIds = [...data.divisionPointIds];
  }
}
