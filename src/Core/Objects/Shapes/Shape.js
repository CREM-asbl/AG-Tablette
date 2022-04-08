import { app } from '../../App';
import { getComplementaryColor, mod, uniqId } from '../../Tools/general';
import { Bounds } from '../Bounds';
import { Coordinates } from '../Coordinates';
import { Point } from '../Point';
import { Segment } from '../Segment';

/**
 * Représente une figure
 */
export class Shape {
  /**
   * @param {String}                      id
   * @param {DrawingEnvironment}          drawingEnvironment
   * @param {String}                      path
   * @param {[String]}                    segmentIds
   * @param {[String]}                    pointIds
   * @param {String}                      name
   * @param {String}                      familyName
   * @param {String}                      color - '#rrggbb'
   * @param {Number}                      opacity - between 0 and 1
   * @param {Number}                      size - 1, 2 or 3
   * @param {String}                      borderColor - '#rrggbb'
   * @param {Boolean}                     isCenterShown
   * @param {Boolean}                     isReversed
   * @param {Boolean}                     isBiface
   * @param {*}                           geometryConstructionSpec // à enlever (recalculer si besoin)
   * @param {*}                           referenceId // temporaire
   * @param {*}                           referenceSegmentIdx // temporaire
   * @param {*}                           hasGeometryReferenced // temporaire
   */
  constructor({
    id = uniqId(),
    drawingEnvironment,

    path = undefined,
    segmentIds = [],
    pointIds = [],
    divisionPointInfos = [],
    segmentsColor = null,
    pointsColor = null,

    name = 'Custom',
    familyName = 'Custom',

    strokeColor = '#000',
    strokeWidth = 1,

    isPointed = true,
    size = 2,
    _isCenterShown = undefined,
    isReversed = false,
    isBiface = false,

    geometryObject = null,
  }) {
    this.id = id;
    this.drawingEnvironment = drawingEnvironment;
    this.drawingEnvironment.shapes.push(this);

    this.name = name;
    this.familyName = familyName;

    this.isPointed = isPointed; // used for path, do not move
    if (path) {
      this.setSegmentsFromPath(path);
      this.pointIds = [...this.pointIds, ...divisionPointInfos.map((dInfo) => {
        let segment = this.segments[dInfo.segmentIdx];
        let newPoint = new Point({
          drawingEnvironment: this.drawingEnvironment,
          segmentIds: [segment.id],
          shapeId: this.id,
          type: 'divisionPoint',
          coordinates: dInfo.coordinates,
          ratio: dInfo.ratio,
          color: dInfo.color,
        });
        segment.divisionPointIds.push(newPoint.id);
        return newPoint.id;
      })];
      if (this.isCircle() && app.environment.name != 'Geometrie') {
        this.vertexes[0].visible = false;
      }
    } else {
      this.pointIds = [...pointIds];
      this.segmentIds = [...segmentIds];
    }

    this.strokeColor = strokeColor;
    this.strokeWidth = strokeWidth;

    this.size = parseInt(size);
    this._isCenterShown = false;
    if (_isCenterShown === undefined) this.isCenterShown = this.isCircle();
    else this.isCenterShown = _isCenterShown;
    this.isReversed = isReversed;
    this.isBiface = isBiface;

    if (segmentsColor) {
      segmentsColor.forEach((segColor, idx) => this.segments[idx].color = segColor);
    }
    if (pointsColor) {
      pointsColor.forEach((ptColor, idx) => this.points[idx].color = ptColor);
    }

    if (geometryObject) {
      this.geometryObject = geometryObject;
    }
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get segments() {
    let segments = this.segmentIds.map((segId) =>
      this.drawingEnvironment.segments.find((seg) => seg.id === segId),
    );
    return segments;
  }

  get points() {
    // if (this.isCircle() && app.environment.name !== 'Geometrie') => doit-on inclure le point du cercle dans Grandeurs et Cubes ?
    let points = this.pointIds.map((ptId) =>
      this.drawingEnvironment.points.find((pt) => pt.id === ptId),
    );
    return points;
  }

  get vertexes() {
    let vertexes = this.points.filter((pt) => pt.type === 'vertex');
    return vertexes;
  }

  get divisionPoints() {
    let divisionPoints = this.points.filter(
      (pt) => pt.type === 'divisionPoint',
    );
    return divisionPoints;
  }

  get center() {
    let center = this.points.filter((pt) => pt.type === 'shapeCenter')[0];
    return center;
  }

  get centerCoordinates() {
    if (this.isCircle()) {
      const center = this.segments[0].arcCenter;
      return new Coordinates(center.coordinates);
    } else {
      let totalCoordinates = Coordinates.nullCoordinates;
      this.vertexes.forEach((vertex) => {
        totalCoordinates = totalCoordinates.add(vertex.coordinates);
      });
      let averageCoordinates = totalCoordinates.multiply(
        1 / this.vertexes.length,
      );
      return averageCoordinates;
    }
  }

  get isCenterShown() {
    let isCenterShown = this._isCenterShown;
    return isCenterShown;
  }

  set isCenterShown(value) {
    if (value && !this.isCenterShown) {
      let centerCoordinates = this.centerCoordinates;
      new Point({
        coordinates: centerCoordinates,
        shapeId: this.id,
        drawingEnvironment: this.drawingEnvironment,
        type: 'shapeCenter',
        // visible: this.isPointed,
      });
    } else if (!value && this.isCenterShown) {
      let pointId = this.points.find((pt) => pt.type == 'shapeCenter').id;
      this.drawingEnvironment.removeObjectById(pointId, 'point');
      let index = this.pointIds.findIndex((pt) => pt.id == pointId);
      this.pointIds.splice(index, 1);
    }
    this._isCenterShown = value;
  }

  setSegmentsFromPath(path) {
    const allPathElements = path
      .split(/[ \n]/)
      .filter((element) => element !== '');
    let firstVertex, lastVertex, startVertex;

    let segmentIdx = 0;
    let vertexIdx = 0;

    this.pointIds = [];
    this.segmentIds = [];

    let nextVertexCoordinates = null;

    let createLineTo = (x, y) => {
      let coordinates = new Coordinates({ x, y });
      firstVertex = lastVertex;
      lastVertex = this.points.find((pt) => pt.coordinates.equal(coordinates));
      if (lastVertex == undefined || lastVertex.type != 'vertex') {
        lastVertex = new Point({
          coordinates: coordinates,
          shapeId: this.id,
          drawingEnvironment: this.drawingEnvironment,
          type: 'vertex',
          idx: vertexIdx++,
          visible: this.isPointed,
        });
      }
      new Segment({
        shapeId: this.id,
        drawingEnvironment: this.drawingEnvironment,
        idx: segmentIdx++,
        vertexIds: [firstVertex.id, lastVertex.id],
      });
    };

    if (allPathElements[0] != 'M')
      startVertex = lastVertex = new Point({
        x: 0,
        y: 0,
        shapeId: this.id,
        drawingEnvironment: this.drawingEnvironment,
        type: 'vertex',
        idx: vertexIdx++,
        visible: this.isPointed,
      });

    while (allPathElements.length) {
      const element = allPathElements.shift();

      switch (element) {
        case 'M':
        case 'm':
          nextVertexCoordinates = new Coordinates({
            x: allPathElements.shift(),
            y: allPathElements.shift(),
          });
          if (this.contains(nextVertexCoordinates)) {
            startVertex = lastVertex = this.points.find((pt) =>
              pt.coordinates.equal(nextVertexCoordinates),
            );
          } else {
            startVertex = lastVertex = new Point({
              coordinates: nextVertexCoordinates,
              shapeId: this.id,
              drawingEnvironment: this.drawingEnvironment,
              type: 'vertex',
              idx: vertexIdx++,
              visible: this.isPointed,
            });
          }
          break;

        case 'L':
        case 'l':
          createLineTo(allPathElements.shift(), allPathElements.shift());
          break;

        case 'H':
        case 'h':
          createLineTo(allPathElements.shift(), lastVertex.y);
          break;

        case 'V':
        case 'v':
          createLineTo(lastVertex.x, allPathElements.shift());
          break;

        case 'A':
        case 'a':
          const rx = allPathElements.shift(),
            ry = allPathElements.shift(),
            xAxisRotation = allPathElements.shift(),
            largeArcFlag = allPathElements.shift(),
            sweepFlag = allPathElements.shift();

          firstVertex = lastVertex;
          nextVertexCoordinates = new Coordinates({
            x: allPathElements.shift(),
            y: allPathElements.shift(),
          });
          lastVertex = this.points.find((pt) =>
            pt.coordinates.equal(nextVertexCoordinates),
          );
          if (lastVertex == undefined || lastVertex.type != 'vertex') {
            lastVertex = new Point({
              coordinates: nextVertexCoordinates,
              shapeId: this.id,
              drawingEnvironment: this.drawingEnvironment,
              type: 'vertex',
              idx: vertexIdx++,
              visible: this.isPointed,
            });
          }

          let arcCenter = this.getArcCenterFromSVG(
            firstVertex,
            lastVertex,
            rx,
            largeArcFlag,
            sweepFlag,
          );

          new Segment({
            shapeId: this.id,
            drawingEnvironment: this.drawingEnvironment,
            idx: segmentIdx++,
            vertexIds: [firstVertex.id, lastVertex.id],
            arcCenterId: arcCenter.id,
            counterclockwise: sweepFlag == 0,
          });

          this.cleanSameDirectionSegment();

          break;

        case 'Z':
        case 'z':
          createLineTo(startVertex.x, startVertex.y);
          break;

        default:
          break;
      }
    }
  }

  /**
   * moyenne des vertexes et medianes, pour l'offset de cut
   */
  get fake_center() {
    if (this.isCircle()) {
      const center = this.segments[0].arcCenter;
      return new Coordinates(center);
    } else {
      let total = {
        x: 0,
        y: 0,
        amount: 0,
      };
      this.vertexes.forEach((vertex) => {
        total.x += vertex.x;
        total.y += vertex.y;
        total.amount++;
      });
      this.segments.forEach((seg) => {
        total.x += seg.middle.x;
        total.y += seg.middle.y;
        total.amount++;
      });

      return new Coordinates(total).multiply(1 / total.amount);
    }
  }

  get bounds() {
    let segmentBounds = this.segments.map((seg) => seg.bounds);
    return Bounds.getOuterBounds(...segmentBounds);
  }

  getCommonsCoordinates(shape) {
    const commonsCoordinates = [];
    this.points.forEach((point1) => {
      shape.points.forEach((point2) => {
        if (point1.coordinates.equal(point2.coordinates))
          commonsCoordinates.push(point1.coordinates);
      });
    });
    return commonsCoordinates;
  }

  getArcCenterFromSVG(
    firstVertex,
    lastVertex,
    radius,
    largeArcFlag,
    sweepFlag,
  ) {
    let middle = firstVertex.coordinates
        .add(lastVertex.coordinates)
        .multiply(1 / 2),
      isHorizontal = Math.abs(firstVertex.y - lastVertex.y) < 0.01,
      isVertical = Math.abs(firstVertex.x - lastVertex.x) < 0.01,
      distanceMiddleArcCenter = Math.sqrt(
        Math.pow(radius, 2) -
          (Math.pow(firstVertex.x - lastVertex.x, 2) +
            Math.pow(firstVertex.y - lastVertex.y, 2)) /
            4,
      );

    if (isNaN(distanceMiddleArcCenter)) distanceMiddleArcCenter = 0;

    let theta, arcCenterCoordinates;
    // theta is the angle between the segment firstvertex - lastvertex and the x-axis

    if (isHorizontal) {
      theta = firstVertex.x < lastVertex.x ? 0 : Math.PI;
    } else if (isVertical) {
      theta = firstVertex.y < lastVertex.y ? Math.PI / 2 : (Math.PI * 3) / 2;
    } else {
      theta = Math.atan2(
        lastVertex.y - firstVertex.y,
        lastVertex.x - firstVertex.x,
      );
    }

    if (largeArcFlag !== sweepFlag) {
      arcCenterCoordinates = middle.add({
        x: distanceMiddleArcCenter * Math.cos(theta + Math.PI / 2),
        y: distanceMiddleArcCenter * Math.sin(theta + Math.PI / 2),
      });
    } else {
      arcCenterCoordinates = middle.add({
        x: distanceMiddleArcCenter * Math.cos(theta - Math.PI / 2),
        y: distanceMiddleArcCenter * Math.sin(theta - Math.PI / 2),
      });
    }
    let arcCenter = new Point({
      drawingEnvironment: this.drawingEnvironment,
      coordinates: arcCenterCoordinates,
      shapeId: this.id,
      type: 'arcCenter',
      visible: false,
    });

    return arcCenter;
  }

  /* #################################################################### */
  /* ################################ IS ################################ */
  /* #################################################################### */

  isCircle() {
    return false;
  }

  isSegment() {
    return false;
  }

  isCircleArc() {
    return false;
  }

  isStraightLine() {
    return false;
  }

  isSemiStraightLine() {
    return false;
  }

  isPoint() {
    return false;
  }

  contains(object) {
    if (object instanceof Point) {
      if (
        this.allOutlinePoints.some((outline_point) =>
          outline_point.equal(object),
        )
      )
        return true;
      if (this.isCenterShown && this.center.equal(object)) return true;
      return false;
    } else if (object instanceof Segment) {
      if (this.segments.some((segment) => segment.equal(object))) return true;
      return false;
    } else if (object instanceof Coordinates) {
      if (this.points.some((pt) => pt.coordinates.equal(object))) return true;
      // if (this.isCenterShown && this.center.equal(object)) return true;
      return false;
    } else {
      console.info('unsupported object');
      return false;
    }
  }

  isCoordinatesOnBorder(coordinates) {
    return this.segments.some((seg) => seg.isCoordinatesOnSegment(coordinates));
  }

  isCoordinatesInPath(coordinates) {
    return false;
  }

  isSegmentInside(segment) {
    return false;
  }

  /* #################################################################### */
  /* ############################# OVERLAP ############################## */
  /* #################################################################### */

  /**
   * Vérifie si cette figure se superpose avec une autre figure.
   * @param  {Shape} shape L'autre figure
   * @return {overlap}     true: si les 2 figures se superposent
   *    considéré vrai si deux segments sont confondu mais n'ont qu'un point commun ! => peut-etre probleme dans environnement libre
   */
  overlapsWith(shape) {
    if (this.isThisInsideAnotherShape(shape)) return true;
    if (shape.isThisInsideAnotherShape(this)) return true;

    if (this.doesIntersectAnotherShape(this.segments, shape.segments))
      return true;

    return false;
  }

  isThisInsideAnotherShape(shape) {
    let s1_segments = this.segments,
      s2_segments = shape.segments;
    for (let s1_segment of s1_segments) {
      if (
        s2_segments.some(
          (s2_segment) =>
            s2_segment.contains(s1_segment) || s1_segment.contains(s2_segment),
        )
      )
        continue;
      if (
        shape.isCoordinatesInPath(s1_segment.vertexes[0].coordinates) &&
        shape.isCoordinatesInPath(s1_segment.vertexes[1].coordinates) &&
        shape.isCoordinatesInPath(s1_segment.middle) &&
        !(shape.isCoordinatesOnBorder(s1_segment.vertexes[0].coordinates) &&
        shape.isCoordinatesOnBorder(s1_segment.vertexes[1].coordinates) &&
        shape.isCoordinatesOnBorder(s1_segment.middle))
      ) {
        console.info('shape inside another');
        return true;
      }
    }
    return false;
  }

  doesIntersectAnotherShape(s1_segments, s2_segments) {
    if (
      s1_segments.some((s1_segment) =>
        s2_segments.some((s2_segment) =>
          s1_segment.doesIntersect(s2_segment, false, true),
        ),
      )
    ) {
      console.info('shape intersects another');
      return true;
    }
    return false;
  }

  /* #################################################################### */
  /* ############################ TRANSFORM ############################# */
  /* #################################################################### */

  reverse() {
    this.segments.forEach((seg) => {
      if (seg.arcCenter) seg.counterclockwise = !seg.counterclockwise;
    });
    if (this.isBiface)
      this.color = getComplementaryColor(this.color);
    this.isReversed = !this.isReversed;
  }

  /**
   * move the shape with coordinates
   * @param {Coordinates} coordinates
   * @param {Boolean} negativeTranslation true if the coordinates must be reversed
   */
  translate(coordinates, negativeTranslation = false) {
    if (negativeTranslation)
      coordinates = coordinates.multiply(-1);
    this.points.forEach((pt) => pt.translate(coordinates));
  }

  /**
   * scale the shape with scaleRatio
   * @param {Number}    scaleRatio
   */
  scale(scaleRatio) {
    this.points.forEach((pt) => pt.multiply(scaleRatio));
  }

  /**
   * Applique une homothétie
   * @param {Number} scaling   scale factor
   * @param {Point}  center    center of the transformation
   */
  homothety(scaling, center = Coordinates.nullCoordinates) {
    let saveCenter = new Coordinates(center);
    let newCenter = center.multiply(scaling);
    this.scale(scaling);
    this.translate(saveCenter.substract(newCenter));
  }

  rotate(angle, center) {
    this.points.forEach(
      (pt) => (pt.coordinates = pt.coordinates.rotate(angle, center)),
    );
  }

  recomputeSegmentPoints() {
    this.segments.forEach((seg) => {
      seg.points.forEach((pt) => pt.recomputeSegmentPoint());
    });
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  /**
   * convertit la shape en commande de path svg
   */
  getSVGPath(scaling = 'scale', infiniteCheck = true) {
    // if (this.isPoint()) {
    //   path = `M ${this.points[0].coordinates.x} ${this.points[0].coordinates.y}`
    // } else {
    let path = this.segments
        .map((seg) => seg.getSVGPath(scaling, false, infiniteCheck))
        .join('\n');
    // }
    return path;
  }

  /**
   * convertit la shape en balise path de svg
   */
  toSVG() {
    let path = this.getSVGPath();

    let attributes = {
      d: path,
      fill: this.fillColor,
      'fill-opacity': this.fillOpacity,
      stroke: this.strokeColor,
      'stroke-opacity': 1, // toujours à 1 ?
      'stroke-width': this.strokeWidth,
    };

    let path_tag = '<path';
    for (let [key, value] of Object.entries(attributes)) {
      path_tag += ' ' + key + '="' + value + '"';
    }
    path_tag += '/>\n';

    let point_tags = '';
    if (app.settings.areShapesPointed && this.name != 'silhouette') {
      if (this.isSegment())
        point_tags += this.segments[0].vertexes[0].toSVG('#000', 1);
      if (!this.isCircle())
        this.segments.forEach(
          (seg) => (point_tags += seg.vertexes[1].toSVG('#000', 1)),
        );
    }

    this.segments.forEach((seg) => {
      //Points sur les segments
      seg.divisionPoints.forEach((pt) => {
        point_tags += pt.toSVG('#000', 1);
      });
    });
    if (this.isCenterShown) point_tags += this.center.toSVG('#000', 1);

    let comment =
      '<!-- ' + this.name.replace('e', 'e').replace('è', 'e') + ' -->\n';

    return comment + path_tag + point_tags + '\n';
  }

  cleanSameDirectionSegment() {
    for (let i = 0; i < this.segments.length; i++) {
      const nextIdx = mod(i + 1, this.segmentIds.length);
      if (nextIdx == i) break;
      if (
        this.segments[i].hasSameDirection(this.segments[nextIdx], 1, 0, false)
      ) {
        let middlePointId = this.segments[i].vertexIds[1];
        let ptIdx = this.pointIds.findIndex((ptId) => ptId == middlePointId);
        this.pointIds.splice(ptIdx, 1);
        this.drawingEnvironment.removeObjectById(middlePointId, 'point');
        this.segments[i].vertexIds[1] = this.segments[nextIdx].vertexIds[1];
        let idx = this.segments[i].vertexes[1].segmentIds.findIndex(
          (id) => id == this.segmentIds[nextIdx],
        );
        this.segments[i].vertexes[1].segmentIds[idx] = this.segments[i].id;
        if (this.segments[nextIdx].arcCenterId) {
          this.drawingEnvironment.removeObjectById(
            this.segments[nextIdx].arcCenterId,
            'point',
          );
          idx = this.pointIds.findIndex(
            (id) => id == this.segments[nextIdx].arcCenterId,
          );
          this.pointIds.splice(idx, 1);
        }
        this.drawingEnvironment.removeObjectById(
          this.segmentIds[nextIdx],
          'segment',
        );
        this.segmentIds.splice(nextIdx, 1);
        i--; // try to merge this new segment again!
      }
    }
    this.segments.forEach((seg, idx) => (seg.idx = idx));
    this.vertexes.forEach((vx, idx) => (vx.idx = idx));
  }

  saveData() {
    let data = {
      id: this.id,
      position: this.drawingEnvironment?.name,
      type: 'newShape',

      path: this.getSVGPath(false),
      segmentIds: [...this.segmentIds],
      pointIds: [...this.pointIds],

      name: this.name,
      familyName: this.familyName,
      color: this.color,

      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,

      isPointed: this.isPointed,
      size: this.size,
      _isCenterShown: this.isCenterShown,
      isReversed: this.isReversed,
      isBiface: this.isBiface,
    };
    if (this.geometryObject) {
      data.geometryObject = this.geometryObject.saveData();
    }
    return data;
  }

  static loadFromData(data) {
    if (!data.position) {
      data.position = 'main';
    }
    let shape = new Shape({
      drawingEnvironment: app[data.position + 'DrawingEnvironment'],
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
  }
}
