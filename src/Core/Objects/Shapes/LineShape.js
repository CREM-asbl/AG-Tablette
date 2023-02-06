import { app } from '../../App';
import { mod, removeObjectById } from '../../Tools/general';
import { Bounds } from '../Bounds';
import { Coordinates } from '../Coordinates';
import { Point } from '../Point';
import { Segment } from '../Segment';
import { GeometryObject } from './GeometryObject';
import { Shape } from './Shape';

/**
 * Représente une figure linéaire (segment, demi-droite, droite, arc de cercle)
 */
export class LineShape extends Shape {

  constructor({
    id,
    layer,

    path = undefined,
    segmentIds = [],
    pointIds = [],
    divisionPointInfos = [],

    name = 'Custom',
    familyName = 'Custom',

    strokeColor = '#000',
    strokeWidth = 1,
    fillColor = '#aaa',
    fillOpacity = 0,

    isPointed = true,
    size = 2,
    _isCenterShown = undefined,
    isReversed = false,
    isBiface = false,
  }) {
    super(arguments[0]);

    this.fillColor = fillColor;
    this.fillOpacity = fillOpacity;

    let centerId = this.center?.id;
    if (centerId && this.pointIds[2] != centerId) {
      this.pointIds = [this.pointIds[0], this.pointIds[1], centerId, ...this.pointIds.slice(2, -1)];
    }

    if (this.name.endsWith('SemiStraightLine')) {
      this.segments[0].isSemiInfinite = true;
    } else if (this.name.endsWith('StraightLine')) {
      this.segments[0].isInfinite = true;
    }
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

  get segments() {
    let segments = this.segmentIds.map((segId) =>
      this.canvasLayer.segments.find((seg) => seg.id === segId),
    );
    return segments;
  }

  get points() {
    // if (this.isCircle() && app.environment.name !== 'Geometrie') => doit-on inclure le point du cercle dans Grandeurs et Cubes ?
    let points = this.pointIds.map((ptId) =>
      this.canvasLayer.points.find((pt) => pt.id === ptId),
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
    if (this.segments[0].isArc()) {
      const center = this.segments[0].arcCenter;
      return new Coordinates(center.coordinates);
    } else if (this.name.endsWith('StraightLine')) {
      return this.vertexes[0].coordinates;
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
        layer: this.layer,
        type: 'shapeCenter',
        // visible: this.isPointed,
      });
    } else if (!value && this.isCenterShown) {
      let pointId = this.points.find((pt) => pt.type == 'shapeCenter').id;
      removeObjectById(pointId);
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
      if (lastVertex == undefined || lastVertex.type != 'vertex' || this.points[this.points.length - 1].coordinates.equal(coordinates)) {
        lastVertex = new Point({
          coordinates: coordinates,
          shapeId: this.id,
          layer: this.layer,
          type: 'vertex',
          idx: vertexIdx++,
          visible: this.isPointed,
        });
      }
      new Segment({
        shapeId: this.id,
        layer: this.layer,
        idx: segmentIdx++,
        vertexIds: [firstVertex.id, lastVertex.id],
      });
    };

    if (allPathElements[0] != 'M')
      startVertex = lastVertex = new Point({
        coordinates: Coordinates.nullCoordinates,
        shapeId: this.id,
        layer: this.layer,
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
              layer: this.layer,
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
              layer: this.layer,
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
            layer: this.layer,
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
      layer: this.layer,
      coordinates: arcCenterCoordinates,
      shapeId: this.id,
      type: 'arcCenter',
      visible: false,
    });
    if (app.environment.name == 'Geometrie')
      arcCenter.visible = true;

    return arcCenter;
  }

  setCtxForDrawing(ctx, scaling) {
    ctx.strokeStyle = this.strokeColor;
    ctx.fillStyle = this.fillColor;
    ctx.globalAlpha = this.fillOpacity;
    ctx.lineWidth = this.strokeWidth * app.workspace.zoomLevel;
    if (scaling == 'no scale')
      ctx.lineWidth = this.strokeWidth;
  }

  /* #################################################################### */
  /* ################################ IS ################################ */
  /* #################################################################### */

  isSegment() {
    return true;
  }

  isCircle() {
    return (
      this.name == 'Circle'
    );
  }

  isCircleArc() {
    return (
      this.name == 'CircleArc'
      // this.segments[0].arcCenter &&
    );
  }

  isStraightLine() {
    return this.segments[0].isInfinite;
  }

  isSemiStraightLine() {
    return this.segments[0].isSemiInfinite;
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

  /**
   * Vérifie si un point se trouve sur un bord de la figure.
   * @param  {Coordinates}  coordinates
   */
  isCoordinatesOnBorder(coordinates) {
    return this.segments.some((seg) => seg.isCoordinatesOnSegment(coordinates));
  }

  /**
   * Vérifie si une coordonnée est à l'intérieur de la figure ou non
   * @param  {Coordinates}  coord  les coordonnées
   */
  isCoordinatesInPath(coord) {
    const ctx = app.invisibleCanvasLayer.ctx;
    let canvasCoord = coord.toCanvasCoordinates();
    let path = this.getSVGPath('scale', true, false, true);
    const selected = ctx.isPointInPath(
      new Path2D(path),
      canvasCoord.x,
      canvasCoord.y,
    );
    return selected;
  }

  isSegmentInside(segment) {
    return (
      this.isCoordinatesInPath(segment.vertexes[0]) &&
      this.isCoordinatesInPath(segment.vertexes[1]) &&
      (!(
        this.isCoordinatesOnBorder(segment.vertexes[0]) &&
        this.isCoordinatesOnBorder(segment.vertexes[1])
      ) ||
        (this.isCoordinatesInPath(segment.middle) &&
          !this.isCoordinatesOnBorder(segment.middle)))
    );
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
    let s1 = this,
      s2 = shape,
      s1_segments = s1.segments,
      s2_segments = s2.segments;

    // s1 in s2 ? if a point of s1 is in s2
    if (this.isThisInsideAnotherShape(shape)) return true;
    // s2 in s1 ? if a point of s2 is in s1
    if (shape.isThisInsideAnotherShape(this)) return true;

    // check if intersect segments
    if (this.doesThisIntersectAnotherShape(s1_segments, s2_segments))
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

  doesThisIntersectAnotherShape(s1_segments, s2_segments) {
    if (
      s1_segments.some((s1_segment) =>
        s2_segments.some((s2_segment) =>
          s1_segment.doesIntersect(s2_segment, true),
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
    this.isReversed = !this.isReversed;
  }

  /**
   * move the shape with coordinates
   * @param {Coordinates} coordinates
   * @param {Boolean} negativeTranslation true if the coordinates must be reversed
   */
  translate(coordinates, negativeTranslation = false) {
    this.points.forEach((pt) => pt.translate(coordinates, negativeTranslation));
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

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  /**
   * convertit la shape en commande de path svg
   */
  getSVGPath(scaling = 'scale', infiniteCheck = true, forDrawing = false, forDrawingButInvisible = false) {
    let path = '';
    path = this.segments
      .map((seg) => seg.getSVGPath(scaling, false, infiniteCheck))
      .join('\n');
    if (forDrawingButInvisible) {
      if (this.vertexes[1] && this.segments[0].isArc())
        path += ['M', this.segments[0].arcCenter.coordinates.x, this.segments[0].arcCenter.coordinates.y, 'L', this.vertexes[0].coordinates.x, this.vertexes[0].coordinates.y, 'L', this.vertexes[1].coordinates.x, this.vertexes[1].coordinates.y, 'L', this.segments[0].arcCenter.coordinates.x, this.segments[0].arcCenter.coordinates.y].join(' ');
    }
    return path;
  }

  /**
   * convertit la shape en balise path de svg
   */
  toSVG() {
    if (this.geometryObject &&
      (
        this.geometryObject.geometryIsVisible === false ||
        this.geometryObject.geometryIsHidden === true ||
        this.geometryObject.geometryIsConstaintDraw === true
      )
    ) {
      return '';
    }

    let path = this.getSVGPath();

    let attributes = {
      d: path,
      stroke: this.strokeColor,
      fill: '#000',
      'fill-opacity': 0,
      'stroke-width': this.strokeWidth,
      'stroke-opacity': 1, // toujours à 1 ?
    };

    let path_tag = '<path';
    for (let [key, value] of Object.entries(attributes)) {
      path_tag += ' ' + key + '="' + value + '"';
    }
    path_tag += '/>\n';

    let pointToDraw = [];
    if (app.settings.areShapesPointed && this.name != 'silhouette') {
      if (this.isSegment())
      pointToDraw.push(this.segments[0].vertexes[0]);
      if (!this.isCircle())
        this.segments.forEach(
          (seg) => (pointToDraw.push(seg.vertexes[1])),
        );
    }

    this.segments.forEach((seg) => {
      //Points sur les segments
      seg.divisionPoints.forEach((pt) => {
        pointToDraw.push(pt);
      });
    });
    if (this.isCenterShown) pointToDraw.push(this.center);

    let point_tags = pointToDraw.filter(pt => {
      pt.visible &&
      pt.geometryIsVisible &&
      !pt.geometryIsHidden
    }).map(pt => pt.svg).join('\n');

    let comment =
      '<!-- ' + this.name.replace('é', 'e').replace('è', 'e') + ' -->\n';

    return comment + path_tag + point_tags + '\n';
  }

  cleanSameDirectionSegment() {
    for (let i = 0; i < this.segments.length; i++) {
      const nextIdx = mod(i + 1, this.segmentIds.length);
      if (nextIdx == i) break;
      if (
        this.segments[i].hasSameDirection(this.segments[nextIdx], 1, 0, false)
      ) {
        if (this.name == 'Circle' && this.segments[0].radius < 0.001) {
          let coord = this.segments[0].arcCenter.coordinates;
          let counterclockwise = this.segments[0].counterclockwise;
          this.pointIds.forEach(ptId => removeObjectById(
            ptId
          ));
          this.segmentIds.forEach(segId => removeObjectById(
            segId
          ));
          this.pointIds = [];
          this.segmentIds = [];
          new Point({
            coordinates: coord,
            shapeId: this.id,
            layer: this.layer,
            type: 'vertex',
            idx: 0,
            visible: this.isPointed,
          });
          new Point({
            coordinates: coord,
            shapeId: this.id,
            layer: this.layer,
            type: 'arcCenter',
            visible: this.isPointed,
          });
          new Segment({
            shapeId: this.id,
            layer: this.layer,
            idx: 0,
            vertexIds: [this.pointIds[0]],
            arcCenterId: this.pointIds[1],
            counterclockwise,
          });
        } else {
          let middlePointId = this.segments[i].vertexIds[1];
          let ptIdx = this.pointIds.findIndex((ptId) => ptId == middlePointId);
          this.pointIds.splice(ptIdx, 1);
          removeObjectById(middlePointId);
          this.segments[i].vertexIds[1] = this.segments[nextIdx].vertexIds[1];
          if (this.segments[i].vertexes[1]) {
            let idx = this.segments[i].vertexes[1].segmentIds.findIndex(
              (id) => id == this.segmentIds[nextIdx],
            );
            this.segments[i].vertexes[1].segmentIds[idx] = this.segments[i].id;
          } else {
            let secondPointId = this.segments[i].vertexIds[1];
            let ptIdx = this.pointIds.findIndex((ptId) => ptId == secondPointId);
            this.pointIds.splice(ptIdx, 1);
            removeObjectById(secondPointId);
            // this.segments[i].vertexIds.splice(1);
          }
          if (this.segments[nextIdx].arcCenterId) {
            removeObjectById(
              this.segments[nextIdx].arcCenterId
            );
            let idx = this.pointIds.findIndex(
              (id) => id == this.segments[nextIdx].arcCenterId,
            );
            this.pointIds.splice(idx, 1);
          }
          removeObjectById(
            this.segmentIds[nextIdx]
          );
          this.segmentIds.splice(nextIdx, 1);
        }
        i--; // try to merge this new segment again!
      }
    }
    this.segments.forEach((seg, idx) => (seg.idx = idx));
    this.vertexes.forEach((vx, idx) => (vx.idx = idx));
  }

  saveData() {
    let data = super.saveData();
    data.type = 'LineShape';
    return data;
  }

  static loadFromData(data) {
    if (!data.position) {
      data.position = 'main';
    }
    let shape = new LineShape({
      layer: data.position,
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
    if (data.geometryObject)
      shape.geometryObject = GeometryObject.loadFromData(data.geometryObject);
  }
}
