import { app } from '../../App';
import { uniqId, mod } from '../../Tools/general';
import { Point } from '../Point';
import { Segment } from '../Segment';
import { Bounds } from '../Bounds';
import { Coordinates } from '../Coordinates';
import { LineShape } from './LineShape';

/**
 * Représente une figure linéaire (segment, demi-droite, droite, arc de cercle)
 */
export class ArrowLineShape extends LineShape {

  constructor({
    id = uniqId(),
    drawingEnvironment,

    path = undefined,
    segmentIds = [],
    pointIds = [],
    divisionPointInfos = [],

    name = 'Custom',
    familyName = 'Custom',

    strokeColor = '#000',
    strokeWidth = 1,

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
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0;
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
  getSVGPath(scaling = 'scale', infiniteCheck = true) {
    let path = '';
    path = this.segments
      .map((seg) => seg.getSVGPath(scaling, false, infiniteCheck))
      .join('\n');
    let seg = this.segments[0];
    let arrowEndCoordinates = seg.vertexIds[1].coordinates;
    if (this.isCircleArc()) {
      seg = this.segments[0].getArcTangent(1);
    }
    let arrowAngle = seg.getAngleWithHorizontal();
    let firstTriangleCoord = arrowEndCoordinates.add(new Coordinates({
      x: 20 * Math.cos(arrowAngle + 0.35),
      y: 20 * Math.sin(arrowAngle + 0.35),
    }));
    let secondTriangleCoord = arrowEndCoordinates.add(new Coordinates({
      x: 20 * Math.cos(arrowAngle - 0.35),
      y: 20 * Math.sin(arrowAngle - 0.35),
    }));
    path += `M ${arrowEndCoordinates.x} ${arrowEndCoordinates.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} Z`;
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
    let data = super.saveData();
    data.type = 'ArrowLineShape';
    return data;
  }

  static loadFromData(data) {
    if (!data.position) {
      data.position = 'main';
    }
    let shape = new ArrowLineShape({
      drawingEnvironment: app[data.position + 'DrawingEnvironment'],
    });
    Object.assign(shape, data);
    shape.segmentIds = [...data.segmentIds];
    shape.pointIds = [...data.pointIds];
  }
}