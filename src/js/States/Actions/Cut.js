import { app } from '../../App';
import { Action } from './Action';
import { Segment, Vertex, MoveTo } from '../../Objects/ShapeBuildStep';
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
      bs = shape.buildSteps,
      pt1 = this.firstPoint,
      centerPt = this.centerPoint,
      pt2 = this.secondPoint;

    //Trier les 2 points:
    if (pt1.index > pt2.index) {
      [pt1, pt2] = [pt2, pt1];
    }

    if (pt1.index === pt2.index) {
      let segEnd = bs[pt1.index].coordinates,
        pt1Dist = segEnd.dist(pt1.relativeCoordinates),
        pt2Dist = segEnd.dist(pt2.relativeCoordinates);
      if (pt1Dist < pt2Dist) {
        [pt1, pt2] = [pt2, pt1];
      }
    }

    //Calculer les buildSteps des 2 formes
    let shape1BSPart1 = bs.slice(0, pt1.index + 1).map(b => b.copy(false)),
      shape1BSPart2 = bs.slice(pt2.index).map(b => b.copy(false)),
      shape2BS = bs.slice(pt1.index, pt2.index + 1).map(b => b.copy(false));

    if (pt1.pointType === 'segmentPoint') {
      let lastIndex = shape1BSPart1.length - 1,
        s1LastBS = shape1BSPart1[lastIndex];
      s1LastBS.vertexes[1].setCoordinates(pt1.relativeCoordinates);
      shape1BSPart1.push(new Vertex(pt1.relativeCoordinates));
      shape2BS[0].vertexes[0].setCoordinates(pt1.relativeCoordinates);
      shape2BS.unshift(new Vertex(pt1.relativeCoordinates));
    }

    if (pt2.pointType === 'segmentPoint') {
      let lastIndex = shape2BS.length - 1,
        s2LastBS = shape2BS[lastIndex];
      s2LastBS.vertexes[1].setCoordinates(pt2.relativeCoordinates);
      shape2BS.push(new Vertex(pt2.relativeCoordinates));
      shape1BSPart2[0].vertexes[0].setCoordinates(pt2.relativeCoordinates);
      shape1BSPart2.unshift(new Vertex(pt2.relativeCoordinates));
    }

    if (centerPt) {
      shape1BSPart1.push(
        new Segment(
          shape1BSPart1[shape1BSPart1.length - 1].coordinates,
          centerPt.relativeCoordinates,
        ),
      );
      shape1BSPart1.push(new Vertex(centerPt.relativeCoordinates));
      shape2BS.push(
        new Segment(shape2BS[shape2BS.length - 1].coordinates, centerPt.relativeCoordinates),
      );
      shape2BS.push(new Vertex(centerPt.relativeCoordinates));
    }

    shape1BSPart1.push(
      new Segment(
        shape1BSPart1[shape1BSPart1.length - 1].coordinates,
        shape1BSPart2[0].coordinates,
      ),
    );
    shape2BS.push(new Segment(shape2BS[shape2BS.length - 1].coordinates, shape2BS[0].coordinates));
    let shape1BS = shape1BSPart1.concat(shape1BSPart2);

    //Créer les 2 formes
    let [shape1, shape2] = [shape1BS, shape2BS].map(bs => {
      let newShape = shape.copy();
      newShape.name = 'Custom';
      newShape.familyName = 'Custom';
      newShape.buildSteps = bs;
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
