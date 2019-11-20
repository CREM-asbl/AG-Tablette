import { app } from '../../App';
import { Action } from './Action';
import { Points } from '../../Tools/points';
import { Segment, Vertex, MoveTo } from '../../Objects/ShapeBuildStep';

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
    if (pt1.index == pt2.index) {
      let segEnd = bs[pt1.index].coordinates,
        pt1Dist = Points.dist(segEnd, pt1.relativeCoordinates),
        pt2Dist = Points.dist(segEnd, pt2.relativeCoordinates);
      if (pt1Dist < pt2Dist) {
        [pt1, pt2] = [pt2, pt1];
      }
    }

    //Calculer les buildSteps des 2 formes
    let shape1BSPart1 = bs.slice(0, pt1.index + 1).map(b => b.copy()),
      shape1BSPart2 = bs.slice(pt2.index).map(b => b.copy()),
      shape2BS = bs.slice(pt1.index, pt2.index + 1).map(b => b.copy());

    if (pt1.pointType == 'segmentPoint') {
      let lastIndex = shape1BSPart1.length - 1,
        s1LastBS = shape1BSPart1[lastIndex],
        s1SecLastBS = shape1BSPart1[lastIndex - 1];
      s1LastBS.coordinates = pt1.relativeCoordinates;
      shape1BSPart1.push(new Vertex(pt1.relativeCoordinates));
      shape2BS.unshift(new Vertex(pt1.relativeCoordinates));

      //Ne garder que les points qui sont sur cette partie du segment:
      let refDist = Points.dist(s1LastBS.coordinates, s1SecLastBS.coordinates);
      s1LastBS.points = s1LastBS.points.filter(pt => {
        let dist = Points.dist(pt, s1SecLastBS.coordinates);
        return dist < refDist;
      });
      refDist = Points.dist(shape2BS[0].coordinates, shape2BS[1].coordinates);
      shape2BS[1].points = shape2BS[1].points.filter(pt => {
        let dist = Points.dist(pt, shape2BS[1].coordinates);
        return dist < refDist;
      });
    }
    shape2BS.unshift(new MoveTo(pt1.relativeCoordinates));

    if (pt2.pointType == 'segmentPoint') {
      let lastIndex = shape2BS.length - 1,
        s2LastBS = shape2BS[lastIndex],
        s2SecLastBS = shape2BS[lastIndex - 1];
      s2LastBS.coordinates = pt2.relativeCoordinates;
      shape2BS.push(new Vertex(pt2.relativeCoordinates));
      shape1BSPart2.unshift(new Vertex(pt2.relativeCoordinates));

      //Ne garder que les points qui sont sur cette partie du segment:
      let refDist = Points.dist(s2LastBS.coordinates, s2SecLastBS.coordinates);
      s2LastBS.points = s2LastBS.points.filter(pt => {
        let dist = Points.dist(pt, s2SecLastBS.coordinates);
        return dist < refDist;
      });
      refDist = Points.dist(shape1BSPart2[0].coordinates, shape1BSPart2[1].coordinates);
      shape1BSPart2[1].points = shape1BSPart2[1].points.filter(pt => {
        let dist = Points.dist(pt, shape1BSPart2[1].coordinates);
        return dist < refDist;
      });
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
      center = Points.multInt(Points.add(center1, center2), 0.5),
      difference = Points.sub(center2, center1),
      distance = Points.dist(center2, center1),
      offset = Points.multInt(difference, 1 / distance),
      myOffset = 20; //px
    shape1.setCoordinates(Points.sub(shape1, Points.multInt(offset, myOffset)));
    shape2.setCoordinates(Points.add(shape2, Points.multInt(offset, myOffset)));

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
