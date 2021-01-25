import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { app } from '../Core/App';

export class ReverseAction extends Action {
  constructor() {
    super('ReverseAction');

    //L'id de la forme que l'on tourne
    this.shapeId = null;

    this.axis = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    this.shapesPos = [];

    this.symmetricalAxeLength = 200; // for update history from 1.0.0
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.involvedShapesIds = save.involvedShapesIds;
    if (save.selectedAxisId) {
      this.axis = app.upperDrawingEnvironment.segments.find(
        seg => seg.id == save.selectedAxisId
      );
    } else if (save.axe) {
      this.axe = new Segment();
      this.axe.initFromObject(save.axe);
      this.shapesPos = save.shapesPos;
    } else {
      // for update history from 1.0.0
      this.axe = this.getSymmetricalAxe(
        ShapeManager.getShapeById(this.shapeId),
        save.symmetricalAxeOrientation
      );
      this.shapesPos = save.involvedShapesIds.map(s =>
        ShapeManager.getShapeIndex(s)
      );
      window.dispatchEvent(
        new CustomEvent('update-history', {
          detail: {
            name: 'ReverseAction',
            shapeId: this.shapeId,
            involvedShapesIds: this.involvedShapesIds,
            axe: this.axe,
            shapePos: this.shapesPos,
          },
        })
      );
    }
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (
      !this.shapeId ||
      !this.axis ||
      !this.involvedShapesIds ||
      !this.shapesPos
    ) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    return this.checkDoParameters();
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      this.reverseShape(s);
      // s.setGeometryConstructionSpec();
    });
    // ShapeManager.moveShapesUp(this.shapesPos);
    // ShapeManager.reverseUpperShapes(this.shapesPos.length);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      this.reverseShape(s, this.axe, 1);
    });
    ShapeManager.reverseUpperShapes(this.shapesPos.length);
    ShapeManager.moveShapesBackToTheirPlace(this.shapesPos);
  }

  /**
   * Retourne une forme
   * @param  {Shape} shape       la forme à retourner
   */
  reverseShape(shape) {
    shape.isReversed = !shape.isReversed;
    shape.reverse();

    shape.points.forEach(pt => {
      this.computePointPosition(pt);
    });
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point) {
    let center = this.axis.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.coordinates = point.coordinates.add(
      center.substract(point.coordinates).multiply(2)
    );
  }

  // for update history from 1.0.0
  getSymmetricalAxe(shape, orientation) {
    let center = shape.center,
      axe;
    if (orientation == 'V') {
      axe = new Segment(
        new Point(center.x, center.y - this.symmetricalAxeLength / 2),
        new Point(center.x, center.y + this.symmetricalAxeLength / 2)
      );
    } else if (orientation == 'NW') {
      axe = new Segment(
        new Point(
          center.x - (0.683 * this.symmetricalAxeLength) / 2,
          center.y - (0.683 * this.symmetricalAxeLength) / 2
        ),
        new Point(
          center.x + (0.683 * this.symmetricalAxeLength) / 2,
          center.y + (0.683 * this.symmetricalAxeLength) / 2
        )
      );
    } else if (orientation == 'H') {
      axe = new Segment(
        new Point(center.x + this.symmetricalAxeLength / 2, center.y),
        new Point(center.x - this.symmetricalAxeLength / 2, center.y)
      );
    } else {
      // SW
      axe = new Segment(
        new Point(
          center.x + (0.683 * this.symmetricalAxeLength) / 2,
          center.y - (0.683 * this.symmetricalAxeLength) / 2
        ),
        new Point(
          center.x - (0.683 * this.symmetricalAxeLength) / 2,
          center.y + (0.683 * this.symmetricalAxeLength) / 2
        )
      );
    }
    return axe;
  }
}
