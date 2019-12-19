import { app } from '../../App';
import { Action } from './Action';
import { Point } from '../../Objects/Point';
import { Segment } from '../../Objects/Segment';

export class ReverseAction extends Action {
  constructor() {
    super();

    this.name = 'ReverseAction';

    //L'id de la forme que l'on tourne
    this.shapeId = null;

    //L'axe de symétrie utilisé pour le retournement
    this.symmetricalAxeOrientation = null; //V, H, NW, SW

    //Longueur en pixels des 4 arcs de symétrie
    this.symmetricalAxeLength = 200;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      symmetricalAxeOrientation: this.symmetricalAxeOrientation,
      involvedShapesIds: this.involvedShapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.symmetricalAxeOrientation = save.symmetricalAxeOrientation;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    if (!this.symmetricalAxeOrientation) return false;
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let axe = this.getSymmetricalAxe();

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      this.reverseShape(s, axe, 1);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.do();
  }

  getSymmetricalAxe(orientation = this.symmetricalAxeOrientation) {
    let shape = app.workspace.getShapeById(this.shapeId),
      center = shape.center,
      axe;
    if (orientation == 'V') {
      axe = new Segment(
        new Point(center.x, center.y - this.symmetricalAxeLength / 2),
        new Point(center.x, center.y + this.symmetricalAxeLength / 2),
      );
    } else if (orientation == 'NW') {
      axe = new Segment(
        new Point(
          center.x - (0.683 * this.symmetricalAxeLength) / 2,
          center.y - (0.683 * this.symmetricalAxeLength) / 2,
        ),
        new Point(
          center.x + (0.683 * this.symmetricalAxeLength) / 2,
          center.y + (0.683 * this.symmetricalAxeLength) / 2,
        ),
      );
    } else if (orientation == 'H') {
      axe = new Segment(
        new Point(center.x + this.symmetricalAxeLength / 2, center.y),
        new Point(center.x - this.symmetricalAxeLength / 2, center.y),
      );
    } else {
      // SW
      axe = new Segment(
        new Point(
          center.x + (0.683 * this.symmetricalAxeLength) / 2,
          center.y - (0.683 * this.symmetricalAxeLength) / 2,
        ),
        new Point(
          center.x - (0.683 * this.symmetricalAxeLength) / 2,
          center.y + (0.683 * this.symmetricalAxeLength) / 2,
        ),
      );
    }
    return axe;
  }

  /**
   * Retourne une forme
   * @param  {Shape} shape       la forme à retourner
   * @param  {Object} axe        L'axe de symétrie à utiliser
   * @param  {float} progression  Entre 0 et 1, 1 pour un retournement complet
   */
  reverseShape(shape, axe, progression) {
    if (progression > 0.5) {
      // milieu animation
      shape.isReversed = !shape.isReversed;
      shape.reverse();
    }

    shape.segments.forEach(seg => {
      let points = [
        ...seg.vertexes,
        ...seg.points,
        seg.arcCenter,
        seg.tangentPoint1,
        seg.tangentPoint2,
      ];
      points.forEach(pt => {
        if (pt) this.computePointPosition(pt, axe, progression);
      });
    });
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @param  {float} progress La progression (entre 0 et 1)
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point, axe, progress) {
    let center = axe.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.setCoordinates({
      x: point.x + 2 * (center.x - point.x) * progress,
      y: point.y + 2 * (center.y - point.y) * progress,
    });
  }
}
