import { app } from '../../App';
import { Action } from './Action';
import { Segment } from '../../Objects/Segment';
import { Point } from '../../Objects/Point';
import { Shape } from '../../Objects/Shape';
import { mod } from '../../Tools/general';

export class CutAction extends Action {
  constructor() {
    super('CutAction');

    //L'id de la forme
    this.shapeId = null;

    //Premier point
    this.firstPoint = null;

    //Centre de la forme
    this.centerPoint = null;

    //Dernier point
    this.secondPoint = null;

    //Formes créées
    this.createdShapes = null;
  }

  // => commented useful if case of full history (every actions)
  saveToObject() {
    let save = {
      // shapeId: this.shapeId,
      // firstPoint: this.firstPoint.saveToObject(),
      // firstSegIdx: this.firstPoint.segment.idx,
      // secondPoint: this.secondPoint.saveToObject(),
      // secondSegIdx: this.secondPoint.segment.idx,
      createdShapes: this.createdShapes.map(shape => shape.saveToObject()),
      createdShapesIds: this.createdShapesIds,
    };
    // if (this.centerPoint) {
    //   save.centerPoint = this.centerPoint.saveToObject();
    // }
    return save;
  }

  initFromObject(save) {
    // this.createdShapes = save.createdShapes.map((shape, idx) => {
    //   let newShape = new Shape({ x: 0, y: 0 }, []);
    //   newShape.initFromObject(shape);
    //   newShape.id = save.createdShapesIds[idx];
    //   return newShape;
    // });
    this.createdShapesIds = save.createdShapesIds;
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

  checkDoParameters() {
    // if (!this.shapeId) return false;
    return true;
  }

  checkUndoParameters() {
    // if (!this.shapeId) return false;
    if (!this.createdShapes) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    // if (this.createdShapes) {
    //   this.createdShapes.forEach((shape, idx) => {
    //     let newShape = shape.copy();
    //     newShape.id = this.createdShapesIds[idx];
    //     app.workspace.addShape(newShape);
    //   });
    //   return;
    // }

    let shape = app.workspace.getShapeById(this.shapeId),
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
        // if (firstVertexAngle > secondVertexAngle) secondVertexAngle += 2 * Math.PI;
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
      // center = center1.addCoordinates(center2).multiplyWithScalar(0.5),
      difference = center2.subCoordinates(center1),
      distance = center2.dist(center1),
      myOffset = 20, //px
      offset = difference.multiplyWithScalar(myOffset / distance);
    shape1.coordinates = new Point(shape1).subCoordinates(offset);
    shape2.coordinates = new Point(shape2).addCoordinates(offset);

    this.createdShapes = [shape1.copy(), shape2.copy()];
    this.createdShapesIds = [shape1.id, shape2.id];

    app.workspace.addShape(shape1);
    app.workspace.addShape(shape2);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.createdShapesIds.forEach(id => {
      const shape = app.workspace.getShapeById(id);
      app.workspace.deleteShape(shape);
    });
  }
}
