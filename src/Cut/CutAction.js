import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';

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
    this.shapeId = save.shapeId;
    this.firstPoint = app.mainDrawingEnvironment.findObjectById(
      save.firstPointId,
      'point'
    );
    this.secondPoint = app.mainDrawingEnvironment.findObjectById(
      save.secondPointId,
      'point'
    );
    this.centerPoint = app.mainDrawingEnvironment.findObjectById(
      save.centerPointId,
      'point'
    );

    // this.createdShapesIds = save.createdShapesIds;
    // if (save.createdShapes) {
    //   this.createdShapes = save.createdShapes.map(
    //     (s, idx) => new Shape({ ...s, id: this.createdShapesIds[idx] })
    //   );
    // } else {
    //   this.shapeId = save.shapeId;
    //   this.firstPoint = new Point();
    //   this.firstPoint.initFromObject(save.firstPoint);
    //   if (save.secondPoint) {
    //     this.secondPoint = new Point();
    //     this.secondPoint.initFromObject(save.secondPoint);
    //   } else {
    //     this.secondPoint = null;
    //   }
    //   if (save.centerPoint) {
    //     this.centerPoint = new Point();
    //     this.centerPoint.initFromObject(save.centerPoint);
    //   } else {
    //     this.centerPoint = null;
    //   }
    // }
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!this.shapeId || !this.firstPoint) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    // if (!this.createdShapesIds.length) {
    //   this.printIncompleteData();
    //   return false;
    // }
    return true;
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;

    let shape = app.mainDrawingEnvironment.findObjectById(
        this.shapeId,
        'shape'
      ),
      pt1 = this.firstPoint,
      pt2 = this.secondPoint,
      firstPath,
      secondPath;

    if (shape.isSegment()) {
      firstPath = [
        'M',
        shape.segments[0].vertexes[0].x,
        shape.segments[0].vertexes[0].y,
        'L',
        pt1.x,
        pt1.y,
      ];
      secondPath = [
        'M',
        pt1.x,
        pt1.y,
        'L',
        shape.segments[0].vertexes[1].x,
        shape.segments[0].vertexes[1].y,
      ];
    } else {
      // Trier les 2 points:
      if (pt1.type == 'vertex' && pt1.idx === 0) {
        [pt1, pt2] = [pt2, pt1];
      } else if (!(pt2.type == 'vertex' && pt2.idx === 0)) {
        let pt1Idx = pt1.idx || pt1.segments[0].idx;
        let pt2Idx = pt2.idx || pt2.segments[0].idx;
        if (pt1Idx > pt2Idx) {
          [pt1, pt2] = [pt2, pt1];
        } else if (pt1Idx === pt2Idx) {
          if ((pt1.ratio || 0) > (pt2.ratio || 0)) {
            [pt1, pt2] = [pt2, pt1];
          }
        }
      }

      let nbOfSegments = shape.segmentIds.length;

      firstPath = [
        'M',
        shape.vertexes[0].coordinates.x,
        shape.vertexes[0].coordinates.y,
      ];
      for (let i = 0; i < nbOfSegments; i++) {
        if (pt1.type === 'divisionPoint' && pt1.segments[0].idx === i) {
          firstPath.push('L', pt1.coordinates.x, pt1.coordinates.y);
          break;
        } else {
          firstPath.push(
            'L',
            shape.vertexes[i + 1].coordinates.x,
            shape.vertexes[i + 1].coordinates.y
          );
        }
        if (pt1.type === 'vertex' && pt1.idx === i + 1) {
          break;
        }
      }
      if (this.centerPoint) {
        firstPath.push(
          'L',
          this.centerPoint.coordinates.x,
          this.centerPoint.coordinates.y
        );
      }
      firstPath.push('L', pt2.coordinates.x, pt2.coordinates.y);
      let endJunctionIndex = pt2.idx || pt2.segments[0].idx;
      if (!(pt2.type == 'vertex' && pt2.idx === 0)) {
        for (let i = endJunctionIndex + 1; i <= nbOfSegments; i++) {
          firstPath.push(
            'L',
            shape.vertexes[i % nbOfSegments].coordinates.x,
            shape.vertexes[i % nbOfSegments].coordinates.y
          );
        }
      }

      secondPath = ['M', pt1.coordinates.x, pt1.coordinates.y];
      endJunctionIndex = pt1.idx || pt1.segments[0].idx;
      for (let i = endJunctionIndex; i < nbOfSegments; i++) {
        if (pt2.type === 'divisionPoint' && pt2.segments[0].idx === i) {
          secondPath.push('L', pt2.coordinates.x, pt2.coordinates.y);
          break;
        } else {
          secondPath.push(
            'L',
            shape.vertexes[(i + 1) % nbOfSegments].coordinates.x,
            shape.vertexes[(i + 1) % nbOfSegments].coordinates.y
          );
        }
        if (pt2.type === 'vertex' && pt2.idx === (i + 1) % nbOfSegments) {
          break;
        }
      }
      if (this.centerPoint) {
        secondPath.push(
          'L',
          this.centerPoint.coordinates.x,
          this.centerPoint.coordinates.y
        );
      }
      secondPath.push('L', pt1.coordinates.x, pt1.coordinates.y);
    }

    firstPath = firstPath.join(' ');
    secondPath = secondPath.join(' ');

    let shape1 = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: firstPath,
      color: shape.color,
      borderColor: shape.borderColor,
    });
    let shape2 = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: secondPath,
      color: shape.color,
      borderColor: shape.borderColor,
    });

    shape1.cleanSameDirectionSegment();
    shape2.cleanSameDirectionSegment();

    // Modifier les coordonnées
    let center1 = shape1.fake_center,
      center2 = shape2.fake_center,
      difference = center2.substract(center1),
      distance = center2.dist(center1),
      myOffset = 20, //px
      offset = difference.multiply(myOffset / distance);

    shape1.translate(offset.multiply(-1));
    if (shape.isSegment()) {
      shape1.translate(
        new Coordinates({
          x: -shape.segments[0].direction.y,
          y: shape.segments[0].direction.x,
        }).multiply(myOffset / 2)
      );
    }
    // shape1.id = this.createdShapesIds[0];

    shape2.translate(offset);
    if (shape.isSegment()) {
      shape2.translate(
        new Coordinates({
          x: shape.segments[0].direction.y,
          y: -shape.segments[0].direction.x,
        }).multiply(myOffset / 2)
      );
    }
    // shape2.id = this.createdShapesIds[1];

    // ShapeManager.addShape(shape1);
    // ShapeManager.addShape(shape2);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.createdShapesIds.forEach(id => {
      const shape = ShapeManager.getShapeById(id);
      ShapeManager.deleteShape(shape);
    });
  }
}
