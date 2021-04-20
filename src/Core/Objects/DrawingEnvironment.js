import { GridManager } from '../../Grid/GridManager';
/**
 * Représente les bords (d'une figure ou d'un segment)
 */
import { Shape } from './Shape';
import { Segment } from './Segment';
import { Point } from './Point';
export class DrawingEnvironment {
  /**
   *
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.shapes = [];
    this.segments = [];
    this.points = [];
    this.texts = [];

    this.editingShapeIds = [];

    this.mustDrawShapes = true;
    this.mustDrawSegments = true;
    this.mustDrawPoints = true;
    this.mustDrawGrid = false;

    this.mustScaleShapes = true;
  }

  removeAllObjects() {
    this.shapes = [];
    this.segments = [];
    this.points = [];
    this.texts = [];
    this.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  redraw() {
    this.clear();
    this.texts.forEach((text) => text.updateMessage());
    if (this.mustDrawGrid) GridManager.drawGridPoints();
    this.draw();
  }

  draw() {
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id == id) == -1) {
          window.dispatchEvent(
            new CustomEvent('draw-shape', { detail: { shape: s } }),
          );
          if (this.mustDrawPoints && app.settings.get('areShapesPointed')) {
            this.points.forEach((pt) => {
              if (pt.visible && pt.shapeId === s.id) {
                window.dispatchEvent(
                  new CustomEvent('draw-point', {
                    detail: { point: pt, color: pt.color },
                  }),
                );
              }
            });
          }
        }
      });
    }
    if (this.mustDrawPoints) {
      this.points.forEach((pt) => {
        if (pt.visible && pt.shapeId === undefined) {
          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, color: pt.color },
            }),
          );
        }
      });
    }
    this.texts.forEach((text) => {
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { text: text },
        }),
      );
    });
  }

  toSVG() {
    let svg_data = '';
    if (this.mustDrawShapes) {
      this.shapes.forEach((s) => {
        if (this.editingShapeIds.findIndex((id) => s.id == id) == -1) {
          svg_data += s.toSVG();
          if (this.mustDrawPoints && app.settings.get('areShapesPointed')) {
            this.points.forEach((pt) => {
              if (pt.visible && pt.shapeId === s.id) {
                svg_data += pt.toSVG();
              }
            });
          }
        }
      });
    }
    if (this.mustDrawPoints) {
      this.points.forEach((pt) => {
        if (pt.visible && pt.shapeId === undefined) {
          svg_data += pt.toSVG();
        }
      });
    }
    return svg_data;
  }

  /**
   * find an object in this drawingEnvironment
   * @param {String} id
   * @param {String} objectType   'shape', 'segment' or 'point'
   */
  findObjectById(id, objectType = 'shape') {
    let object = this[objectType + 's'].find((obj) => obj.id == id);
    return object;
  }

  /**
   * find the index of an object in this drawingEnvironment
   * @param {String} id
   * @param {String} objectType   'shape', 'segment' or 'point'
   */
  findIndexById(id, objectType = 'shape') {
    let index = this[objectType + 's'].findIndex((obj) => obj.id == id);
    return index;
  }

  /**
   * remove an object from this drawingEnvironment
   * @param {String} id
   * @param {String} objectType   'shape', 'segment' or 'point'
   */
  removeObjectById(id, objectType = 'shape') {
    let index = this.findIndexById(id, objectType);
    if (index != -1) {
      if (objectType == 'shape') {
        let object = this.findObjectById(id, objectType);
        object.segments.forEach((seg) =>
          this.removeObjectById(seg.id, 'segment'),
        );
        object.points.forEach((pt) => this.removeObjectById(pt.id, 'point'));
      }
      this[objectType + 's'].splice(index, 1);
    }
  }

  getCommonSegmentOfTwoPoints(pt1Id, pt2Id) {
    let pt1 = this.findObjectById(pt1Id, 'point');
    let pt2 = this.findObjectById(pt2Id, 'point');
    let segmentIds1 = pt1.segmentIds;
    let segmentIds2 = pt2.segmentIds;
    let commonSegmentIds = segmentIds1.filter(
      (id1) => segmentIds2.findIndex((id2) => id2 == id1) != -1,
    );
    let commonSegments = commonSegmentIds.map((id) =>
      this.segments.find((seg) => seg.id == id),
    );
    commonSegments.sort((seg1, seg2) => seg2.idx - seg1.idx);
    return commonSegments[0];
  }

  saveData() {
    let data = {
      shapesData: this.shapes.map((shape) => shape.saveData()),
      segmentsData: this.segments.map((segment) => segment.saveData()),
      pointsData: this.points.map((point) => point.saveData()),
    };
    return data;
  }

  loadFromData(data) {
    this.removeAllObjects();
    if (data != undefined) {
      data.shapesData.forEach((shapeData) => Shape.loadFromData(shapeData));
      data.segmentsData.forEach((segmentData) =>
        Segment.loadFromData(segmentData),
      );
      data.pointsData.forEach((pointData) => Point.loadFromData(pointData));
    } else {
      console.log('nothing to see here');
    }
  }
}
