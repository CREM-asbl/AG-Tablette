import { app } from '../../App';
import { Coordinates } from '../Coordinates';
import { Point } from '../Point';
import { Segment } from '../Segment';
import { GeometryObject } from './GeometryObject';
import { Shape } from './Shape';

/**
 * Représente une figure linéaire (segment, demi-droite, droite, arc de cercle)
 */
export class StripLineShape extends Shape {

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
    fillColor = '#ddd',
    fillOpacity = 0.7,

    isPointed = true,
    size = 2,
    _isCenterShown = undefined,
    isReversed = false,
    isBiface = false,
  }) {
    super(arguments[0]);

    this.fillColor = fillColor;
    this.fillOpacity = fillOpacity;

    if (this.segments.length == 2) {
      this.segments[0].isInfinite = true;
      this.segments[1].isInfinite = true;
    }
  }

  /* #################################################################### */
  /* ############################## GET/SET ############################# */
  /* #################################################################### */

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
    return false;
  }

  /**
   * Vérifie si une coordonnée est à l'intérieur de la figure ou non
   * @param  {Coordinates}  coord  les coordonnées
   */
  isCoordinatesInPath(coord) {
    let firstProjection = this.segments[0].projectionOnSegment(coord);
    let secondProjection = this.segments[1].projectionOnSegment(coord);
    if (firstProjection.x == secondProjection.x) {
      return (firstProjection.y - coord.y > 0) ^ (secondProjection.y - coord.y > 0);
    } else {
      return (firstProjection.x - coord.x > 0) ^ (secondProjection.x - coord.x > 0);
    }
  }

  /* #################################################################### */
  /* ############################## OTHER ############################### */
  /* #################################################################### */

  /**
   * convertit la shape en commande de path svg
   */
  getSVGPath(scaling = 'scale', infiniteCheck = true, forDrawing = false, forDrawingButInvisible = false) {
    let path //= '';
    path = this.segments
      .map((seg) => seg.getSVGPath(scaling, false, infiniteCheck))
      .join(' ').split(' ');
    if (forDrawing || forDrawingButInvisible) {
      let deletedElements = path.splice(6, 3);
      path.push('L', deletedElements[1], deletedElements[2]);
      path.push('L', path[1], path[2]);
    }
    path = path.join(' ');

    return path;
  }

  /**
   * convertit la shape en balise path de svg
   */
  toSVG() {
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

  saveData() {
    let data = super.saveData();
    data.type = 'StripLineShape';
    if (this.fillColor !== '#aaa')
      data.fillColor = this.fillColor;
    if (this.fillOpacity !== 0.7)
      data.fillOpacity = this.fillOpacity;
    return data;
  }

  static loadFromData(data) {
    if (!data.position) {
      data.position = 'main';
    }
    let shape = new StripLineShape({
      layer: data.position,
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
    if (data.geometryObject)
      shape.geometryObject = GeometryObject.loadFromData(data.geometryObject);
  }
}
