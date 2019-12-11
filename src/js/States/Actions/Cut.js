import { app } from '../../App';
import { Action } from './Action';
import { Segment } from '../../Objects/Segment';
import { Point } from '../../Objects/Point';

export class CutAction extends Action {
  constructor() {
    super();

    this.name = 'CutAction';

    //L'id de la forme
    this.shapeId = null;

    /**
     * Premier point
     * {
     *     'type': 'point',
     *     'pointType': 'vertex' ou 'segmentPoint',
     *     'shape': Shape, -> NE PAS utiliser... TODO retirer de l'objet. (idem divide)
     *     'index': int,
     *     'coordinates': Point
     *     'relativeCoordinates': Point
     * }
     */
    this.firstPoint = null;

    //Centre de la forme
    this.centerPoint = null;

    //Dernier point
    this.secondPoint = null;

    //Id des 2 formes créées
    this.createdShapesIds = null;
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      firstPoint: this.firstPoint,
      centerPoint: this.centerPoint,
      secondPoint: this.secondPoint,
      createdShapesIds: [...this.createdShapesIds],
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.firstPoint = save.firstPoint;
    this.centerPoint = save.centerPoint;
    this.secondPoint = save.secondPoint;
    this.createdShapesIds = [...save.createdShapesIds];
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    if (!this.firstPoint || !this.secondPoint) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    if (!this.createdShapesIds) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;
    let shape = app.workspace.getShapeById(this.shapeId),
      segments = shape.segments,
      pt1 = this.firstPoint,
      centerPt = this.centerPoint,
      pt2 = this.secondPoint;

    //Trier les 2 points:
    if (pt1.segment.idx > pt2.segment.idx) {
      [pt1, pt2] = [pt2, pt1];
    }

    // 2 points sur le mm segment ? arc de cercle ?
    if (pt1.segment.idx === pt2.segment.idx) {
      let segEnd = pt1.segment.vertexes[1],
        pt1Dist = segEnd.dist(pt1),
        pt2Dist = segEnd.dist(pt2);
      if (pt1Dist < pt2Dist) {
        [pt1, pt2] = [pt2, pt1];
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
      if (shape2Seg.length) shape2Seg.unshift(new Segment(pt1, shape2Seg[0].vertexes[0]));
      else shape2Seg.unshift(new Segment(pt1, shape1Seg[shape1Seg.length - 1].vertexes[1]));
      shape1Seg[shape1Seg.length - 1].vertexes[1].setCoordinates(pt1);
    }

    if (pt2.type === 'segmentPoint') {
      if (shape1Seg.length) shape1Seg.unshift(new Segment(pt2, shape1Seg[0].vertexes[0]));
      else shape1Seg.unshift(new Segment(pt2, shape2Seg[shape2Seg.length - 1].vertexes[1]));
      shape2Seg[shape2Seg.length - 1].vertexes[1].setCoordinates(pt2);
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
    let center1 = shape1.center,
      center2 = shape2.center,
      // center = center1.addCoordinates(center2).multiplyWithScalar(0.5),
      difference = center2.subCoordinates(center1),
      distance = center2.dist(center1),
      myOffset = 20, //px
      offset = difference.multiplyWithScalar(1 / distance);
    offset.multiplyWithScalar(myOffset);
    shape1.setCoordinates(new Point(shape1).subCoordinates(offset));
    shape2.setCoordinates(new Point(shape2).addCoordinates(offset));

    if (this.createdShapesIds) {
      shape1.id = this.createdShapesIds[0];
      shape2.id = this.createdShapesIds[1];
    } else {
      this.createdShapesIds = [shape1.id, shape2.id];
    }

    app.workspace.addShape(shape1);
    app.workspace.addShape(shape2);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.createdShapesIds.forEach(id => {
      let shape = app.workspace.getShapeById(id);
      app.workspace.deleteShape(shape);
    });
  }
}
