import { app } from '../../App';
import { mod, removeObjectById } from '../../Tools/general';
import { Coordinates } from '../Coordinates';
import { GeometryObject } from './GeometryObject';
import { LineShape } from './LineShape';

/**
 * Représente une figure linéaire (segment, demi-droite, droite, arc de cercle)
 */
export class ArrowLineShape extends LineShape {

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
      if (this.vertexes[1] && this.segments[0].isArc()) {
        let arcCenterCoordinates =  this.segments[0].arcCenter.coordinates;
        let firstVertex =  this.vertexes[0].coordinates;
        let secondVertex =  this.vertexes[1].coordinates;
        if (scaling == 'scale') {
          arcCenterCoordinates = arcCenterCoordinates.toCanvasCoordinates();
          firstVertex = firstVertex.toCanvasCoordinates();
          secondVertex = secondVertex.toCanvasCoordinates();
        }
        path += ['M', arcCenterCoordinates.x, arcCenterCoordinates.y, 'L', firstVertex.x, firstVertex.y, 'L', secondVertex.x, secondVertex.y, 'L', arcCenterCoordinates.x, arcCenterCoordinates.y].join(' ');
      }
    }
    if (forDrawing) {
      let seg = this.segments[0];
      let arrowEndCoordinates = seg.vertexes[1].coordinates;
      let arrowAngle = seg.getAngleWithHorizontal() + Math.PI;
      if (seg.isArc()) {
        let originVector = this.segments[0].getArcTangent(1);
        arrowAngle = Math.atan2(originVector.y, originVector.x) + Math.PI;
      }
      let firstTriangleCoord = arrowEndCoordinates.add(new Coordinates({
        x: 20 * Math.cos(arrowAngle + 0.35),
        y: 20 * Math.sin(arrowAngle + 0.35),
      }));
      let secondTriangleCoord = arrowEndCoordinates.add(new Coordinates({
        x: 20 * Math.cos(arrowAngle - 0.35),
        y: 20 * Math.sin(arrowAngle - 0.35),
      }));
      if (scaling == 'scale') {
        arrowEndCoordinates = arrowEndCoordinates.toCanvasCoordinates();
        firstTriangleCoord = firstTriangleCoord.toCanvasCoordinates();
        secondTriangleCoord = secondTriangleCoord.toCanvasCoordinates();
      }
      path += ` M ${arrowEndCoordinates.x} ${arrowEndCoordinates.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} M ${arrowEndCoordinates.x} ${arrowEndCoordinates.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y}`;
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
        let middlePointId = this.segments[i].vertexIds[1];
        let ptIdx = this.pointIds.findIndex((ptId) => ptId == middlePointId);
        this.pointIds.splice(ptIdx, 1);
        removeObjectById(middlePointId);
        this.segments[i].vertexIds[1] = this.segments[nextIdx].vertexIds[1];
        let idx = this.segments[i].vertexes[1].segmentIds.findIndex(
          (id) => id == this.segmentIds[nextIdx],
        );
        this.segments[i].vertexes[1].segmentIds[idx] = this.segments[i].id;
        if (this.segments[nextIdx].arcCenterId) {
          removeObjectById(
            this.segments[nextIdx].arcCenterId
          );
          idx = this.pointIds.findIndex(
            (id) => id == this.segments[nextIdx].arcCenterId,
          );
          this.pointIds.splice(idx, 1);
        }
        removeObjectById(
          this.segmentIds[nextIdx]
        );
        this.segmentIds.splice(nextIdx, 1);
        i--; // try to merge this new segment again!
      }
    }
    this.segments.forEach((seg, idx) => (seg.idx = idx));
    this.vertexes.forEach((vx, idx) => (vx.idx = idx));
  }

  saveData() {
    let data = super.saveData();
    data.type = 'ArrowLineShape';
    return data;
  }

  static loadFromData(data) {
    if (!data.position) {
      data.position = 'main';
    }
    let shape = new ArrowLineShape({
      layer: data.position,
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
    if (data.geometryObject)
      shape.geometryObject = GeometryObject.loadFromData(data.geometryObject);
  }
}
