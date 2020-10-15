import { app } from '../App';
import { getComplementaryColor, uniqId, mod } from '../Tools/general';
import { Point } from './Point';
import { Segment } from './Segment';
import { ShapeManager } from '../Managers/ShapeManager';
import { isAngleBetweenTwoAngles } from '../Tools/geometry';

/**
 * Représente une forme
 */
export class Shape {
  /**
   * Constructeur
   * @param {float} x              position X
   * @param {float} y              position Y
   * @param {[Segment]} segments   segments de la forme (ne pas utiliser si construction à partir de path)
   * @param {String} path          path représentant la forme (ne pas utiliser si construction à partir de segments)
   * @param {String} name          nom de la forme
   * @param {String} familyName    nom de la famille de la forme
   */
  constructor({
    x = 0,
    y = 0,
    segments = null,
    path = null,
    name = 'Custom',
    familyName = 'Custom',
    color = '#aaa',
    opacity = 0.7,
    id = uniqId(),
    size = 2,
    borderColor = '#000',
    isCenterShown = undefined,
    isReversed = false,
    isBiface = false,
    geometryConstructionSpec = null,
    referenceShapeId = null,
    referenceSegmentIdx = null,
    hasGeometryReferenced = [],
  }) {
    this.x = x;
    this.y = y;

    //Todo: condition à supprimer quand tout en path
    if (segments) this.setSegments(segments);
    else if (path) this.setSegmentsFromPath(path);
    else this.segments = [];

    this.name = name;
    this.familyName = familyName;
    this.color = color;
    this.second_color = getComplementaryColor(color);
    this.opacity = opacity;
    this.id = id;
    this.size = size;
    this.borderColor = borderColor;
    if (isCenterShown === undefined) this.isCenterShown = this.isCircle();
    else this.isCenterShown = isCenterShown;
    this.isReversed = isReversed;
    this.isBiface = isBiface;
    this.geometryConstructionSpec = geometryConstructionSpec;
    this.referenceShapeId = referenceShapeId;
    this.referenceSegmentIdx = referenceSegmentIdx;
    this.hasGeometryReferenced = hasGeometryReferenced;
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get allOutlinePoints() {
    let points = [];
    if (this.isSegment()) points.push(this.segments[0].vertexes[0]);
    if (this.isCircle()) points.push(...this.segments[0].points);
    else
      this.segments.forEach(segment =>
        points.push(segment.vertexes[1], ...segment.points)
      );
    // filter duplicates
    points = points.filter(
      (pt, idx) => !points.some((pt2, idx2) => idx > idx2 && pt.equal(pt2))
    );
    return points;
  }

  get vertexes() {
    return this.allOutlinePoints.filter(pt => pt.type == 'vertex');
  }

  get modifiablePoints() {
    let points = this.vertexes;
    if (this.name == 'Circle') {
      points.push(this.segments[0].vertexes[0]);
      points.push(this.segments[0].arcCenter);
    } else if (this.name == 'CircleArc') {
      points.push(this.segments[0].arcCenter);
    } else if (
      this.name == 'ParalleleStraightLine' ||
      this.name == 'PerpendicularStraightLine'
    ) {
      points.pop();
    }
    return points;
  }

  get segmentPoints() {
    return this.segments.map(seg => seg.points).flat();
  }

  get coordinates() {
    return new Point(this.x, this.y);
  }

  /**
   * définit les coordonnées de la forme
   * @param {{x: float, y: float}} coordinates les coordonnées
   */
  set coordinates(coordinates) {
    const translation = new Point(coordinates).subCoordinates(this.coordinates);
    this.x = coordinates.x;
    this.y = coordinates.y;
    this.translate(translation);
  }

  get center() {
    if (this.isCircle()) {
      const center = this.segments[0].arcCenter;
      return new Point(center.x, center.y, 'center', undefined, this);
    } else {
      let total = {
        sumX: 0,
        sumY: 0,
        amount: 0,
      };
      this.vertexes.forEach(vertex => {
        total.sumX += vertex.x;
        total.sumY += vertex.y;
        total.amount++;
      });

      return new Point(
        total.sumX / total.amount,
        total.sumY / total.amount,
        'center',
        undefined,
        this
      );
    }
  }

  /**
   * moyenne des vertexes et medianes, pour l'offset de cut
   */
  get fake_center() {
    if (this.isCircle()) {
      const center = this.segments[0].arcCenter;
      return new Point(center.x, center.y, 'center', undefined, this);
    } else {
      let total = {
        sumX: 0,
        sumY: 0,
        amount: 0,
      };
      this.vertexes.forEach(vertex => {
        total.sumX += vertex.x;
        total.sumY += vertex.y;
        total.amount++;
      });
      this.segments.forEach(seg => {
        total.sumX += seg.middle.x;
        total.sumY += seg.middle.y;
        total.amount++;
      });

      return new Point(
        total.sumX / total.amount,
        total.sumY / total.amount,
        'center',
        undefined,
        this
      );
    }
  }

  get bounds() {
    //minX, maxX, minY, maxY
    let result = [[], [], [], []];
    this.segments.forEach(seg => {
      seg.bounds.forEach((bound, idx) => {
        result[idx].push(bound);
      });
    });
    return result.map((value, idx) => {
      if (idx % 2) return Math.max(...value);
      else return Math.min(...value);
    });
  }

  get allPoints() {
    let vertexes = this.segments
        .map(seg => seg.vertexes)
        .flat()
        .filter((vertex, idx, vertexes) => {
          if (vertex)
            return vertexes.findIndex(vertex2 => vertex2.equal(vertex)) == idx;
          else return false;
        }),
      segmentPoints = this.segments.map(seg => seg.points).flat();
    return [...vertexes, ...segmentPoints];
  }

  getCommonsPoints(shape) {
    const commonsPoints = [];
    this.allOutlinePoints.forEach(point1 => {
      shape.allOutlinePoints.forEach(point2 => {
        if (point1.equal(point2)) commonsPoints.push(new Point(point1));
      });
    });
    return commonsPoints;
  }

  setSegmentsFromPath(path) {
    this.segments = [];
    const allPathElements = path
      .split(/[ \n]/)
      .filter(element => element !== '');
    let firstVertex, lastVertex, startVertex;

    while (allPathElements.length) {
      const element = allPathElements.shift();

      switch (element) {
        case 'M':
        case 'm':
          lastVertex = new Point(
            allPathElements.shift(),
            allPathElements.shift()
          );
          startVertex = lastVertex;
          break;

        case 'L':
        case 'l':
          firstVertex = lastVertex;
          lastVertex = new Point(
            allPathElements.shift(),
            allPathElements.shift()
          );
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          break;

        case 'H':
        case 'h':
          firstVertex = lastVertex;
          lastVertex = new Point(allPathElements.shift(), firstVertex.y);
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          break;

        case 'V':
        case 'v':
          firstVertex = lastVertex;
          lastVertex = new Point(firstVertex.x, allPathElements.shift());
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          break;

        case 'A':
        case 'a':
          const rx = allPathElements.shift(),
            ry = allPathElements.shift(),
            xAxisRotation = allPathElements.shift(),
            largeArcFlag = allPathElements.shift(),
            sweepFlag = allPathElements.shift();

          const nextVertex = new Point(
            allPathElements.shift(),
            allPathElements.shift()
          );

          if (this.segments.length > 0 && nextVertex.equal(firstVertex)) {
            // if circle
            this.segments[this.segments.length - 1].vertexes[1] = nextVertex;
            lastVertex = nextVertex;
          } else {
            // if arc
            firstVertex = lastVertex;
            lastVertex = nextVertex;
            let arcCenter = this.getArcCenterFromSVG(
              firstVertex,
              lastVertex,
              rx,
              largeArcFlag,
              sweepFlag
            );

            this.segments.push(
              new Segment(
                firstVertex,
                lastVertex,
                this,
                this.segments.length,
                arcCenter,
                1 - sweepFlag
              )
            );
          }

          break;

        case 'Z':
        case 'z':
          firstVertex = lastVertex;
          lastVertex = startVertex;
          this.segments.push(
            new Segment(firstVertex, lastVertex, this, this.segments.length)
          );
          // console.log('Z');
          break;

        /* default = closePath car case Z et z ne passe pas  */
        default:
          // firstVertex = lastVertex;
          // lastVertex = startVertex;
          // this.segments.push(
          //   new Segment(firstVertex, lastVertex, this, this.segments.length)
          // );
          break;
      }
    }
  }

  getArcCenterFromSVG(
    firstVertex,
    lastVertex,
    radius,
    largeArcFlag,
    sweepFlag
  ) {
    let middle = new Point(
        (firstVertex.x + lastVertex.x) / 2,
        (firstVertex.y + lastVertex.y) / 2
      ),
      isHorizontal = Math.abs(firstVertex.y - lastVertex.y) < 0.01,
      isVertical = Math.abs(firstVertex.x - lastVertex.x) < 0.01,
      distanceMiddleArcCenter = Math.sqrt(
        Math.pow(radius, 2) -
          (Math.pow(firstVertex.x - lastVertex.x, 2) +
            Math.pow(firstVertex.y - lastVertex.y, 2)) /
            4
      );

    let theta, arcCenter;
    // theta is the angle between the segment firstvertex - lastvertex and the x-axis

    if (isHorizontal) {
      theta = firstVertex.x < lastVertex.x ? 0 : Math.PI;
    } else if (isVertical) {
      theta = firstVertex.y < lastVertex.y ? Math.PI / 2 : (Math.PI * 3) / 2;
    } else {
      theta = Math.atan2(
        lastVertex.y - firstVertex.y,
        lastVertex.x - firstVertex.x
      );
    }

    if (largeArcFlag !== sweepFlag) {
      arcCenter = middle.addCoordinates({
        x: distanceMiddleArcCenter * Math.cos(theta + Math.PI / 2),
        y: distanceMiddleArcCenter * Math.sin(theta + Math.PI / 2),
      });
    } else {
      arcCenter = middle.addCoordinates({
        x: distanceMiddleArcCenter * Math.cos(theta - Math.PI / 2),
        y: distanceMiddleArcCenter * Math.sin(theta - Math.PI / 2),
      });
    }

    return arcCenter;
  }

  /* #################################################################### */
  /* ################################ IS ################################ */
  /* #################################################################### */

  /**
   * Renvoie true si la forme est un cercle, c'est-à-dire si buildSteps
   * commence par un moveTo puis est uniquement composé de segments de
   * type arc.
   * @return {Boolean} true si cercle, false sinon.
   */
  isCircle() {
    return (
      this.segments.length == 1 &&
      this.segments[0].arcCenter &&
      this.segments[0].vertexes[0].equal(this.segments[0].vertexes[1]) &&
      this.name != 'CircleArc'
    );
  }

  /**
   * say if the shape is a Segment (either a real segment or an arc)
   */
  isSegment() {
    return this.segments.length == 1 && !this.isCircle();
  }

  /**
   * say if the shape is a circle arc
   */
  isCircleArc() {
    return (
      this.segments.length == 1 &&
      this.segments[0].arcCenter &&
      this.name == 'CircleArc'
    );
  }

  isStraightLine() {
    return this.segments.length == 1 && this.segments[0].isInfinite;
  }

  /**
   * say if a point is on one of the segments of the shape
   * @param {Point} point   le point à analyser
   */
  isPointOnSegment(point) {
    if (!this.isSegment()) return false;

    const segment = this.segments[0];

    let projection = segment.projectionOnSegment(point);

    if (!segment.isPointOnSegment(projection)) return false;

    let dist = point.dist(projection);

    if (dist <= app.settings.get('selectionDistance')) return true;
    return false;
  }

  contains(object) {
    if (object instanceof Point) {
      if (
        this.allOutlinePoints.some(outline_point => outline_point.equal(object))
      )
        return true;
      if (this.isCenterShown && this.center.equal(object)) return true;
      return false;
    } else if (object instanceof Segment) {
      if (this.segments.some(segment => segment.equal(object))) return true;
      return false;
    } else {
      console.log('unsupported object');
      return false;
    }
  }

  /**
   * Vérifie si un point se trouve sur un bord de la forme.
   * @param  {Point}  point Le point (coordonnées absolues)
   * @return {Boolean}       true si le point se trouve sur le bord.
   */
  isPointInBorder(point) {
    return this.segments.some(seg => seg.isPointOnSegment(point));
  }

  /**
   * Vérifie si un point est à l'intérieur de la forme ou non
   * @param  {Point}  point le point
   */
  isPointInPath(point) {
    const ctx = app.invisibleCtx;
    let pointCopy = new Point(point);
    pointCopy.setToCanvasCoordinates();
    const selected = ctx.isPointInPath(
      new Path2D(this.getSVGPath()),
      pointCopy.x,
      pointCopy.y
    );
    return selected;
  }

  isSegmentInside(segment) {
    return (
      this.isPointInPath(segment.vertexes[0]) &&
      this.isPointInPath(segment.vertexes[1]) &&
      (!(
        this.isPointInBorder(segment.vertexes[0]) &&
        this.isPointInBorder(segment.vertexes[1])
      ) ||
        (this.isPointInPath(segment.middle) &&
          !this.isPointInBorder(segment.middle)))
    );
  }

  /* #################################################################### */
  /* ############################# OVERLAP ############################## */
  /* #################################################################### */

  /**
   * check si this est complètement dans shape
   * @param {Shape} shape l'autre forme
   */
  isInside(shape) {
    return this.allOutlinePoints.every(pt => shape.isPointInPath(pt));
  }

  /**
   * Vérifie si cette forme se superpose avec une autre forme.
   * @param  {Shape} shape L'autre forme
   * @return {overlap}     true: si les 2 formes se superposent
   *    considéré vrai si deux segments sont confondu mais n'ont qu'un point commun ! => peut-etre probleme dans environnement libre
   */
  overlapsWith(shape) {
    let s1 = this,
      s2 = shape,
      s1_segments = s1.segments,
      s2_segments = s2.segments;

    // s1 in s2 ? if a point of s1 is in s2
    if (this.overlapCheckIfShapeIsInsideAnother(s2, s1_segments, s2_segments))
      return true;
    // s2 in s1 ? if a point of s2 is in s1
    if (this.overlapCheckIfShapeIsInsideAnother(s1, s2_segments, s1_segments))
      return true;

    // check if intersect segments
    if (this.overlapCheckIntersectSegments(s1_segments, s2_segments))
      return true;

    return false;
  }

  overlapCheckIfShapeIsInsideAnother(shape, s1_segments, s2_segments) {
    let vertexes_to_check = [],
      middles_to_check = [];
    for (let s1_segment of s1_segments) {
      if (
        s2_segments.some(
          s2_segment =>
            s2_segment.subSegments.some(subSeg => subSeg.equal(s1_segment)) ||
            s1_segment.subSegments.some(subSeg => subSeg.equal(s2_segment))
        )
      )
        continue;
      vertexes_to_check = [
        ...vertexes_to_check,
        ...s2_segments
          .map(seg => s1_segment.getNonCommonPointIfJoined(seg))
          .filter(pt => pt),
      ];
      middles_to_check = [
        ...middles_to_check,
        ...s2_segments
          .map(seg => s1_segment.getMiddleIfJoined(seg))
          .filter(pt => pt),
      ];
    }

    if (
      vertexes_to_check.some(
        (pt, idx) =>
          shape.isPointInPath(pt) &&
          shape.isPointInPath(middles_to_check[idx]) &&
          !shape.isPointInBorder(middles_to_check[idx])
      )
    ) {
      console.log('shape inside another');
      return true;
    }
    return false;
  }

  overlapCheckIntersectSegments(s1_segments, s2_segments) {
    if (
      !s1_segments.every(s1_segment => {
        if (
          !s2_segments.some(s2_segment =>
            s1_segment.subSegments.some(sub1 =>
              s2_segment.subSegments.some(sub2 => sub2.equal(sub1))
            )
          ) &&
          s2_segments
            .filter(
              s2_segment =>
                !s1_segment.equal(s2_segment) &&
                !s1_segment.getNonCommonPointIfJoined(s2_segment)
            )
            .some(s2_segment =>
              s1_segment.doesIntersect(s2_segment, false, true)
            )
        ) {
          return false;
        }
        return true;
      })
    )
      return true;
  }

  /* #################################################################### */
  /* ############################ TRANSFORM ############################# */
  /* #################################################################### */

  reverse() {
    this.segments.forEach(seg => {
      if (seg.arcCenter) seg.counterclockwise = !seg.counterclockwise;
    });
  }

  /**
   * move the shape with Point or coordinates
   * @param {Point} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} neg - negative translation
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
      neg = arguments[++i];
    } else {
      x = arguments[i];
      y = !isNaN(arguments[i + 1]) ? arguments[++i] : arguments[i];
      neg = arguments[++i];
    }
    multiplier = neg ? -1 : 1;
    const translation = new Point(x * multiplier, y * multiplier);
    this.segments.forEach(seg => seg.translate(translation));
  }

  /**
   *
   * @param {Number}    scaling   scale ratio
   */
  scale(scaling) {
    this.segments.forEach(seg => seg.scale(scaling));
  }

  /**
   * Applique une homothétie
   * @param {Number} scaling   scale factor
   * @param {Point}  center    center of the transformation
   */
  homothety(scaling, center = new Point(0, 0)) {
    let saveCenter = new Point(center);
    let newCenter = center.multiplyWithScalar(scaling);
    this.scale(scaling);
    this.translate(saveCenter.x - newCenter.x, saveCenter.y - newCenter.y);
  }

  rotate(angle, center) {
    // this.angle = (this.angle + angle) % (2 * Math.PI);
    this.segments.forEach(seg => seg.rotate(angle, center));
  }

  applyTransform(pointSelected, pointDest) {
    let v1, v2, v3, v4;
    let transformMethod;
    if (this.familyName == 'Irregular') {
      transformMethod = 'onlyMovePoint';
    } else if (
      pointSelected.name == 'firstPoint' &&
      (this.familyName == 'Regular' ||
        this.familyName == '3-corner-shape' ||
        this.familyName == '4-corner-shape')
    ) {
      v1 = pointDest;
      v2 = this.vertexes.filter(pt => pt.name == 'secondPoint')[0];
      transformMethod = 'computeShape';
    } else if (
      pointSelected.name == 'secondPoint' &&
      (this.familyName == 'Regular' ||
        this.familyName == '3-corner-shape' ||
        this.familyName == '4-corner-shape')
    ) {
      v1 = this.vertexes.filter(pt => pt.name == 'firstPoint')[0];
      v2 = pointDest;
      transformMethod = 'computeShape';
    } else if (
      pointSelected.name == 'thirdPoint' &&
      this.familyName == '3-corner-shape'
    ) {
      transformMethod = 'onlyMovePoint';
    } else if (
      pointSelected.name == 'thirdPoint' &&
      this.familyName == '4-corner-shape'
    ) {
      v1 = this.vertexes.filter(pt => pt.name == 'firstPoint')[0];
      v2 = this.vertexes.filter(pt => pt.name == 'secondPoint')[0];
      v3 = pointDest;
      transformMethod = 'computeShape';
    } else if (
      pointSelected.name == 'fourthPoint' &&
      this.familyName == '4-corner-shape'
    ) {
      transformMethod = 'onlyMovePoint';
    } else if (pointSelected.name == 'firstPoint' && this.name == 'Circle') {
      transformMethod = 'computeShape';
    } else if (
      (pointSelected.name == 'arcCenter' ||
        pointSelected.name == 'firstPoint') &&
      this.name == 'CirclePart'
    ) {
      transformMethod = 'computeShape';
    } else if (this.name == 'CirclePart') {
      transformMethod = 'onlyMovePoint';
    } else if (
      (pointSelected.name == 'arcCenter' ||
        pointSelected.name == 'firstPoint') &&
      this.name == 'CircleArc'
    ) {
      transformMethod = 'computeShape';
    } else if (this.name == 'CircleArc') {
      transformMethod = 'onlyMovePoint';
    } else if (this.name == 'StraightLine' || this.name == 'Segment') {
      transformMethod = 'onlyMovePoint';
    } else if (this.name == 'ParalleleStraightLine') {
      transformMethod = 'computeShape';
    } else if (this.name == 'PerpendicularStraightLine') {
      transformMethod = 'computeShape';
    } else if (
      pointSelected.name == 'firstPoint' &&
      this.name == 'ParalleleSegment'
    ) {
      transformMethod = 'computeShape';
    } else if (
      pointSelected.name == 'secondPoint' &&
      this.name == 'ParalleleSegment'
    ) {
      transformMethod = 'onlyMovePoint';
    }

    if (transformMethod == 'onlyMovePoint') {
      pointSelected.setCoordinates(pointDest);
      let nextSeg =
        pointSelected.shape.segments[
          mod(
            pointSelected.segment.idx + 1,
            pointSelected.shape.segments.length
          )
        ];
      if (!this.isCircleArc() && !this.isStraightLine() && !this.isSegment())
        nextSeg.vertexes[0].setCoordinates(pointDest);
    } else if (transformMethod == 'computeShape') {
      if (this.familyName == 'Regular') {
        let externalAngle = (Math.PI * 2) / this.segments.length;
        if (this.isReversed) {
          externalAngle *= -1;
        }
        let length = v1.dist(v2);
        let startAngle = Math.atan2(-(v1.y - v2.y), -(v1.x - v2.x));

        this.segments[0].vertexes[0].setCoordinates(v1);
        this.segments[0].vertexes[1].setCoordinates(v2);

        for (let i = 1; i < this.segments.length; i++) {
          let dx = length * Math.cos(startAngle - i * externalAngle);
          let dy = length * Math.sin(startAngle - i * externalAngle);

          let np = this.segments[i - 1].vertexes[1].addCoordinates(dx, dy);

          this.segments[i].vertexes[0].setCoordinates(
            this.segments[i - 1].vertexes[1]
          );
          this.segments[i].vertexes[1].setCoordinates(np);
        }
      } else if (this.familyName == '3-corner-shape') {
        if (this.name == 'RightAngleTriangle') {
          let angle = new Segment(v1, v2).getAngleWithHorizontal();
          let perpendicularAngle = angle + Math.PI / 2;
          if (this.geometryConstructionSpec.height > 0) {
            perpendicularAngle += Math.PI;
          }
          let absHeight = Math.abs(this.geometryConstructionSpec.height);
          v3 = new Point(
            v2.x + absHeight * Math.cos(perpendicularAngle),
            v2.y + absHeight * Math.sin(perpendicularAngle)
          );
        } else if (this.name == 'IsoscelesTriangle') {
          let initialSegment = new Segment(v1, v2);
          let angle = initialSegment.getAngleWithHorizontal();
          let perpendicularAngle = angle + Math.PI / 2;
          if (this.geometryConstructionSpec.height > 0) {
            perpendicularAngle += Math.PI;
          }
          let absHeight = Math.abs(this.geometryConstructionSpec.height);
          let middleOfSegment = initialSegment.middle;
          v3 = new Point(
            middleOfSegment.x + absHeight * Math.cos(perpendicularAngle),
            middleOfSegment.y + absHeight * Math.sin(perpendicularAngle)
          );
        } else if (this.name == 'RightAngleIsoscelesTriangle') {
          let initialSegment = new Segment(v1, v2);
          let angle = initialSegment.getAngleWithHorizontal();
          let perpendicularAngle = angle + Math.PI / 2;
          if (this.geometryConstructionSpec.height > 0) {
            perpendicularAngle += Math.PI;
          }
          let segmentLength = initialSegment.length;
          v3 = new Point(
            v2.x + segmentLength * Math.cos(perpendicularAngle),
            v2.y + segmentLength * Math.sin(perpendicularAngle)
          );
        }
        this.segments.forEach(seg =>
          seg.vertexes.forEach(pt => {
            if (pt.name == 'firstPoint') {
              pt.setCoordinates(v1);
            } else if (pt.name == 'secondPoint') {
              pt.setCoordinates(v2);
            } else {
              pt.setCoordinates(v3);
            }
          })
        );
      } else if (this.familyName == '4-corner-shape') {
        if (this.name == 'Rectangle') {
          if (pointSelected.name != 'thirdPoint') {
            let angle = new Segment(v1, v2).getAngleWithHorizontal();
            let perpendicularAngle = angle + Math.PI / 2;
            if (this.geometryConstructionSpec.height > 0) {
              perpendicularAngle += Math.PI;
            }
            let absHeight = Math.abs(this.geometryConstructionSpec.height);
            v3 = new Point(
              v2.x + absHeight * Math.cos(perpendicularAngle),
              v2.y + absHeight * Math.sin(perpendicularAngle)
            );
          }
          v4 = new Point(v3.x - v2.x + v1.x, v3.y - v2.y + v1.y);
        } else if (this.name == 'Losange') {
          if (pointSelected.name != 'thirdPoint') {
            let firstSegment = new Segment(v1, v2);
            let angle =
              firstSegment.getAngleWithHorizontal() -
              this.geometryConstructionSpec.angle;
            let length = firstSegment.length;
            v3 = new Point(
              v2.x + length * Math.cos(angle),
              v2.y + length * Math.sin(angle)
            );
          }
          v4 = new Point(v3.x - v2.x + v1.x, v3.y - v2.y + v1.y);
        } else if (this.name == 'Parallelogram') {
          if (pointSelected.name != 'thirdPoint') {
            let angle =
              new Segment(v1, v2).getAngleWithHorizontal() -
              this.geometryConstructionSpec.angle;
            let length = this.geometryConstructionSpec.segmentLength;
            v3 = new Point(
              v2.x + length * Math.cos(angle),
              v2.y + length * Math.sin(angle)
            );
          }
          v4 = new Point(v3.x - v2.x + v1.x, v3.y - v2.y + v1.y);
        } else if (this.name == 'RightAngleTrapeze') {
          let initialSegment = new Segment(v1, v2);
          if (pointSelected.name != 'thirdPoint') {
            let angle =
              initialSegment.getAngleWithHorizontal() -
              this.geometryConstructionSpec.angle;
            let length = this.geometryConstructionSpec.segmentLength;
            v3 = new Point(
              v2.x + length * Math.cos(angle),
              v2.y + length * Math.sin(angle)
            );
          }
          let projection = initialSegment.projectionOnSegment(v3);
          v4 = new Point(
            v3.x - projection.x + v1.x,
            v3.y - projection.y + v1.y
          );
        } else if (this.name == 'IsoscelesTrapeze') {
          let initialSegment = new Segment(v1, v2);
          if (pointSelected.name != 'thirdPoint') {
            let angle =
              initialSegment.getAngleWithHorizontal() -
              this.geometryConstructionSpec.angle;
            let length = this.geometryConstructionSpec.segmentLength;
            v3 = new Point(
              v2.x + length * Math.cos(angle),
              v2.y + length * Math.sin(angle)
            );
          }
          let projection = initialSegment.projectionOnSegment(v3);
          let middleOfSegment = initialSegment.middle;
          v4 = new Point(
            v3.x - 2 * projection.x + 2 * middleOfSegment.x,
            v3.y - 2 * projection.y + 2 * middleOfSegment.y
          );
        } else if (this.name == 'Trapeze') {
          let firstSegment = new Segment(v1, v2);
          if (pointSelected.name != 'thirdPoint') {
            let angle =
              firstSegment.getAngleWithHorizontal() -
              this.geometryConstructionSpec.angle;
            let length = this.geometryConstructionSpec.segmentLength;
            v3 = new Point(
              v2.x + length * Math.cos(angle),
              v2.y + length * Math.sin(angle)
            );
          }
          let angle = firstSegment.getAngleWithHorizontal();
          let length = this.geometryConstructionSpec.segmentLength2;
          v4 = new Point(
            v3.x + length * Math.cos(angle),
            v3.y + length * Math.sin(angle)
          );
        }

        this.segments.forEach(seg =>
          seg.vertexes.forEach(pt => {
            if (pt.name == 'firstPoint') {
              pt.setCoordinates(v1);
            } else if (pt.name == 'secondPoint') {
              pt.setCoordinates(v2);
            } else if (pt.name == 'thirdPoint') {
              pt.setCoordinates(v3);
            } else {
              pt.setCoordinates(v4);
            }
          })
        );
      } else if (this.familyName == 'circle-shape') {
        if (this.name == 'Circle') {
          if (pointSelected.name == 'arcCenter') {
            let diff = pointDest.subCoordinates(pointSelected);
            this.segments[0].arcCenter.setCoordinates(pointDest);
            this.segments[0].vertexes.forEach(v => v.translate(diff.x, diff.y));
          } else {
            this.segments[0].vertexes.forEach(v => v.setCoordinates(pointDest));
          }
        } else if (this.name == 'CirclePart') {
          if (pointSelected.name == 'arcCenter') {
            let diff = pointDest.subCoordinates(pointSelected);
            this.segments[1].arcCenter.setCoordinates(pointDest);
            this.segments.forEach(seg =>
              seg.vertexes.forEach(v => v.translate(diff.x, diff.y))
            );
          } else {
            let angle1 = this.segments[0].vertexes[0].getAngle(
                this.segments[0].vertexes[1]
              ),
              angle2 = this.segments[0].vertexes[0].getAngle(
                this.segments[1].vertexes[1]
              ),
              angleDiff = angle2 - angle1;
            this.segments[0].vertexes[1].setCoordinates(pointDest);
            this.segments[1].vertexes[0].setCoordinates(pointDest);
            let radius = this.segments[0].length,
              angle3 = this.segments[0].vertexes[0].getAngle(
                this.segments[0].vertexes[1]
              ),
              resultAngle = angle3 + angleDiff,
              thirdPoint = this.segments[1].arcCenter.addCoordinates(
                radius * Math.cos(resultAngle),
                radius * Math.sin(resultAngle)
              );
            this.segments[1].vertexes[1].setCoordinates(thirdPoint);
            this.segments[2].vertexes[0].setCoordinates(thirdPoint);
          }
        } else if (this.name == 'CircleArc') {
          if (pointSelected.name == 'arcCenter') {
            let diff = pointDest.subCoordinates(pointSelected);
            this.segments[0].arcCenter.setCoordinates(pointDest);
            this.segments.forEach(seg =>
              seg.vertexes.forEach(v => v.translate(diff.x, diff.y))
            );
          } else {
            let angle1 = this.segments[0].arcCenter.getAngle(
                this.segments[0].vertexes[0]
              ),
              angle2 = this.segments[0].arcCenter.getAngle(
                this.segments[0].vertexes[1]
              ),
              angleDiff = angle2 - angle1;
            this.segments[0].vertexes[0].setCoordinates(pointDest);
            let radius = this.segments[0].arcCenter.dist(
                this.segments[0].vertexes[0]
              ),
              angle3 = this.segments[0].arcCenter.getAngle(
                this.segments[0].vertexes[0]
              ),
              resultAngle = angle3 + angleDiff;
            let thirdPoint = this.segments[0].arcCenter.addCoordinates(
              radius * Math.cos(resultAngle),
              radius * Math.sin(resultAngle)
            );
            this.segments[0].vertexes[1].setCoordinates(thirdPoint);
          }
        }
      } else if (this.familyName == 'Line') {
        if (
          this.name == 'ParalleleStraightLine' ||
          this.name == 'PerpendicularStraightLine' ||
          this.name == 'ParalleleSegment'
        ) {
          let diff = pointDest.subCoordinates(pointSelected);
          this.segments[0].vertexes.forEach(v => v.translate(diff.x, diff.y));
        }
      }
    }

    this.setGeometryConstructionSpec();
  }

  updateGeometry(mustDraw = false) {
    let reference = ShapeManager.getShapeById(this.referenceShapeId).segments[
      this.referenceSegmentIdx
    ];
    if (this.name == 'ParalleleStraightLine') {
      let segment = Segment.segmentWithAnglePassingThroughPoint(
        reference.getAngleWithHorizontal(),
        this.segments[0].vertexes[0]
      );
      segment.isInfinite = true;
      this.setSegments([segment]);
    } else if (this.name == 'PerpendicularStraightLine') {
      let segment = Segment.segmentWithAnglePassingThroughPoint(
        reference.getAngleWithHorizontal() + Math.PI / 2,
        this.segments[0].vertexes[0]
      );
      segment.isInfinite = true;
      this.setSegments([segment]);
    } else if (this.name == 'ParalleleSegment') {
      let length = this.segments[0].length,
        previousAngle = this.segments[0].getAngleWithHorizontal(),
        referenceAngle = reference.getAngleWithHorizontal(),
        nextAngle;

      if (
        isAngleBetweenTwoAngles(
          mod(referenceAngle + Math.PI / 4, 2 * Math.PI),
          mod(referenceAngle - Math.PI / 4, 2 * Math.PI),
          true,
          previousAngle
        )
      )
        nextAngle = referenceAngle;
      else nextAngle = referenceAngle + Math.PI;

      this.segments[0].vertexes[1].setCoordinates(
        new Point(
          this.segments[0].vertexes[0].x + length * Math.cos(nextAngle),
          this.segments[0].vertexes[0].y + length * Math.sin(nextAngle)
        )
      );
    }
    this.updateGeometryReferenced(mustDraw);
    if (mustDraw) {
      let savedBorderColor = this.borderColor;
      this.borderColor = app.settings.get('temporaryDrawColor');
      window.dispatchEvent(
        new CustomEvent('draw-shape', {
          detail: { shape: this, borderSize: 2 },
        })
      );
      this.borderColor = savedBorderColor;
    }
  }

  updateGeometryReferenced(mustDraw = false) {
    this.hasGeometryReferenced.forEach(shapeId => {
      let shape = ShapeManager.getShapeById(shapeId);
      shape.updateGeometry(mustDraw);
    });
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  /**
   * Renvoie une copie d'une forme
   * @param  {Boolean} full si copie de l'id aussi
   * @return {Shape} la copie
   */
  copy(full = false) {
    return new Shape({ ...this, id: full ? this.id : undefined });
  }

  /**
   * convertit la shape en commande de path svg
   * @param {Number} axeAngle - l'angle de l'axe de l'axe (pour reverse)
   */
  getSVGPath(scaling = 'scale', axeAngle = undefined) {
    let path = '';
    // const point = new Point(this.segments[0].vertexes[0]);
    // if (scaling == 'scale') point.setToCanvasCoordinates();
    path = this.segments
      .map(seg => seg.getSVGPath(scaling, axeAngle))
      .join('\n');
    // path += 'Z';
    return path;
  }

  /**
   * convertit la shape en balise path de svg
   */
  toSVG() {
    let path = this.getSVGPath();

    let attributes = {
      d: path,
      stroke: this.borderColor,
      fill: this.isBiface && this.isReversed ? this.second_color : this.color,
      'fill-opacity': this.opacity,
      'stroke-width': 1, // toujours à 1 ?
      'stroke-opacity': 1, // toujours à 1 ?
    };

    let path_tag = '<path';
    for (let [key, value] of Object.entries(attributes)) {
      path_tag += ' ' + key + '="' + value + '"';
    }
    path_tag += '/>\n';

    let point_tags = '';
    if (app.settings.get('areShapesPointed') && this.name != 'silhouette') {
      if (this.isSegment())
        point_tags += this.segments[0].vertexes[0].toSVG('#000', 1);
      if (!this.isCircle())
        this.segments.forEach(
          seg => (point_tags += seg.vertexes[1].toSVG('#000', 1))
        );
    }

    this.segments.forEach(seg => {
      //Points sur les segments
      seg.points.forEach(pt => {
        point_tags += pt.toSVG('#000', 1);
      });
    });
    if (this.isCenterShown) point_tags += this.center.toSVG('#000', 1);

    let comment = '<!-- ' + this.name + ' -->\n';

    return comment + path_tag + point_tags + '\n';
  }

  setSegments(segments) {
    if (!segments) return;
    this.segments = segments.map((seg, idx) => {
      let newSeg = new Segment();
      newSeg.initFromObject(seg);
      newSeg.idx = idx;
      newSeg.shape = this;
      return newSeg;
    });
  }

  saveToObject() {
    let save = {
      ...{ ...this, segments: undefined },
      // coordinates: this.coordinates.saveToObject(),
      path: this.getSVGPath('no scale'),
    };
    return save;
  }

  setGeometryConstructionSpec() {
    this.geometryConstructionSpec = {};
    let negativeMultiplier;
    if (this.familyName == '3-corner-shape' || this.name == 'Rectangle') {
      negativeMultiplier =
        this.segments[0].vertexes[1].getVertexAngle() > Math.PI ? -1 : 1;
    } else if (this.name == 'Trapeze') {
      negativeMultiplier = this.segments[0].hasSameDirection(this.segments[2])
        ? 1
        : -1;
    }
    if (
      this.name == 'RightAngleTriangle' ||
      this.name == 'RightAngleIsoscelesTriangle' ||
      this.name == 'Rectangle'
    ) {
      this.geometryConstructionSpec.height =
        this.segments[1].length * negativeMultiplier;
    } else if (this.name == 'IsoscelesTriangle') {
      this.geometryConstructionSpec.height =
        this.segments[0].middle.dist(this.segments[1].vertexes[1]) *
        negativeMultiplier;
    } else if (this.name == 'Losange') {
      this.geometryConstructionSpec.angle = this.segments[0].vertexes[1].getVertexAngle();
    } else if (this.name == 'Parallelogram') {
      this.geometryConstructionSpec.angle = this.segments[0].vertexes[1].getVertexAngle();
      this.geometryConstructionSpec.segmentLength = this.segments[1].length;
    } else if (this.name == 'RightAngleTrapeze') {
      this.geometryConstructionSpec.angle = this.segments[0].vertexes[1].getVertexAngle();
      this.geometryConstructionSpec.segmentLength = this.segments[1].length;
    } else if (this.name == 'IsoscelesTrapeze') {
      this.geometryConstructionSpec.angle = this.segments[0].vertexes[1].getVertexAngle();
      this.geometryConstructionSpec.segmentLength = this.segments[1].length;
    } else if (this.name == 'Trapeze') {
      this.geometryConstructionSpec.angle = this.segments[0].vertexes[1].getVertexAngle();
      this.geometryConstructionSpec.segmentLength = this.segments[1].length;
      this.geometryConstructionSpec.segmentLength2 =
        this.segments[2].length * negativeMultiplier;
    }
  }

  // static retrieveFrom(shape) {
  //   return app.workspace.getShapeById(shape.id);
  // }
}
