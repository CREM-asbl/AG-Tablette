import { Action } from './Action';
import { Segment } from '../../Objects/Segment';
import { Point } from '../../Objects/Point';
import { mod } from '../../Tools/general';
import { ShapeManager } from '../../ShapeManager';
import { Shape } from '../../Objects/Shape';

export class CutAction extends Action {
  constructor() {
    super('CutAction');

    // L'id de la forme
    this.shapeId = null;

    // Premier point
    this.firstPoint = null;

    // Dernier point
    this.secondPoint = null;

    // Centre de la forme
    this.centerPoint = null;

    // Id des formes à creer
    this.createdShapesIds = [];
  }

  initFromObject(save) {
    this.createdShapesIds = save.createdShapesIds;
    if (save.createdShapes) {
      this.createdShapes = save.createdShapes.map((s, idx) => {
        let newShape = new Shape(new Point(0, 0), []);
        newShape.initFromObject(s);
        newShape.id = this.createdShapesIds[idx];
        return newShape;
      });
    } else {
      this.shapeId = save.shapeId;
      this.firstPoint = new Point();
      this.firstPoint.initFromObject(save.firstPoint);
      this.secondPoint = new Point();
      this.secondPoint.initFromObject(save.secondPoint);
      if (save.centerPoint) {
        this.centerPoint = new Point();
        this.centerPoint.initFromObject(save.centerPoint);
      } else {
        this.centerPoint = null;
      }
    }
  }

  checkDoParameters() {
    if (
      !this.createdShapes &&
      (!this.shapeId || !this.firstPoint || !this.secondPoint || !this.createdShapesIds.length)
    ) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.createdShapesIds.length) {
      console.log('incomplete data for ' + this.name + ': ', this);
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.createdShapes) {
      this.createdShapes.forEach(s => ShapeManager.addShape(s));
      return;
    }

    let shape = ShapeManager.getShapeById(this.shapeId),
      segments = shape.segments,
      pt1 = this.firstPoint,
      centerPt = this.centerPoint,
      pt2 = this.secondPoint;

    //Trier les 2 points:
    if (pt1.segment.idx > pt2.segment.idx) {
      [pt1, pt2] = [pt2, pt1];
    } else if (pt1.segment.idx === pt2.segment.idx) {
      // 2 points sur le mm segment ? arc de cercle ?
      let segment = pt1.segment;
      if (segment.arcCenter) {
        let center = segment.arcCenter,
          firstVertexAngle = center.getAngle(segment.vertexes[0]),
          secondVertexAngle = center.getAngle(segment.vertexes[1]);
        let firstAngle = center.getAngle(pt1),
          secondAngle = center.getAngle(pt2);
        if (segment.counterclockwise)
          [firstVertexAngle, secondVertexAngle] = [secondVertexAngle, firstVertexAngle];
        if (firstAngle < firstVertexAngle) firstAngle += 2 * Math.PI;
        if (secondAngle < firstVertexAngle) secondAngle += 2 * Math.PI;

        if (firstAngle < secondAngle) [pt1, pt2] = [pt2, pt1];
      } else {
        // possible ?
        let segEnd = pt1.segment.vertexes[1],
          pt1Dist = segEnd.dist(pt1),
          pt2Dist = segEnd.dist(pt2);
        if (pt1Dist < pt2Dist) {
          [pt1, pt2] = [pt2, pt1];
        }
      }
    }

    //Calculer les segments des 2 formes
    let shape1SegPart1 = segments.slice(0, pt1.segment.idx + 1).map(seg => seg.copy(false)),
      shape1SegPart2 = segments.slice(pt2.segment.idx + 1).map(seg => seg.copy(false)),
      shape1Seg = [...shape1SegPart2, ...shape1SegPart1],
      shape2Seg = segments
        .slice(pt1.segment.idx + 1, pt2.segment.idx + 1)
        .map(seg => seg.copy(false)),
      junction;

    if (pt1.type === 'segmentPoint') {
      let newSegment = pt1.segment.copy(false);
      newSegment.vertexes[0] = pt1.copy();
      if (shape2Seg.length) newSegment.vertexes[1] = shape2Seg[0].vertexes[0].copy();
      else newSegment.vertexes[1] = shape1Seg[shape1Seg.length - 1].vertexes[1].copy();
      shape2Seg.unshift(newSegment);
      if (shape1Seg.length) shape1Seg[shape1Seg.length - 1].vertexes[1].setCoordinates(pt1);
    }

    if (pt2.type === 'segmentPoint') {
      let newSegment = pt2.segment.copy(false);
      newSegment.vertexes[0] = pt2.copy();
      if (shape1Seg.length) newSegment.vertexes[1] = shape1Seg[0].vertexes[0].copy();
      else newSegment.vertexes[1] = shape2Seg[shape2Seg.length - 1].vertexes[1].copy();
      shape1Seg.unshift(newSegment);
      if (shape2Seg.length) shape2Seg[shape2Seg.length - 1].vertexes[1].setCoordinates(pt2);
    }

    if (centerPt) {
      junction = [new Segment(pt1, centerPt), new Segment(centerPt, pt2)];
    } else {
      junction = [new Segment(pt1, pt2)];
    }

    shape1Seg = [...shape1Seg, ...junction.map(seg => seg.copy(false))];
    shape2Seg = [
      ...shape2Seg,
      ...junction
        .map(seg => seg.copy(false))
        .reverse()
        .map(seg => {
          seg.reverse();
          return seg;
        }),
    ];

    // cleaning same direction segments
    shape1Seg.forEach((seg, idx, segments) => {
      const mergeIdx = mod(idx + 1, segments.length);
      if (seg.hasSameDirection(segments[mergeIdx], 1, 0, false)) {
        seg.vertexes[1] = segments[mergeIdx].vertexes[1].copy();
        segments.splice(mergeIdx, 1);
      }
    });
    shape2Seg.forEach((seg, idx, segments) => {
      const mergeIdx = mod(idx + 1, segments.length);
      if (seg.hasSameDirection(segments[mergeIdx], 1, 0, false)) {
        seg.vertexes[1] = segments[mergeIdx].vertexes[1].copy();
        segments.splice(mergeIdx, 1);
      }
    });

    //Créer les 2 formes
    let [shape1, shape2] = [shape1Seg, shape2Seg].map(segments => {
      let newShape = shape.copy();
      newShape.name = 'Custom';
      newShape.familyName = 'Custom';
      newShape.segments = segments.map((seg, idx) => {
        seg.vertexes[0].type = 'vertex';
        seg.vertexes[0].segment = seg;
        seg.vertexes[1].type = 'vertex';
        seg.vertexes[1].segment = seg;
        seg.shape = newShape;
        seg.idx = idx;
        return seg;
      });
      newShape.isCenterShown = false;
      return newShape;
    });

    //Modifier les coordonnées
    let center1 = shape1.fake_center,
      center2 = shape2.fake_center,
      difference = center2.subCoordinates(center1),
      distance = center2.dist(center1),
      myOffset = 20, //px
      offset = difference.multiplyWithScalar(myOffset / distance);
    shape1.coordinates = new Point(shape1).subCoordinates(offset);
    shape1.id = this.createdShapesIds[0];
    shape2.coordinates = new Point(shape2).addCoordinates(offset);
    shape2.id = this.createdShapesIds[1];

    ShapeManager.addShape(shape1);
    ShapeManager.addShape(shape2);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.createdShapesIds.forEach(id => {
      const shape = ShapeManager.getShapeById(id);
      ShapeManager.deleteShape(shape);
    });
  }
}
