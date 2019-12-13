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
    this.symmetricalArchOrientation = null; //V, H, NW, SW

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      symmetricalArchOrientation: this.symmetricalArchOrientation,
      involvedShapesIds: this.involvedShapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.symmetricalArchOrientation = save.symmetricalArchOrientation;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    if (!this.symmetricalArchOrientation) return false;
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let arch = this.getSymmetricalArch();

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      this.reverseShape(s, arch, 1);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.do();
  }

  getSymmetricalArch() {
    let shape = app.workspace.getShapeById(this.shapeId),
      arch = {
        type: this.symmetricalArchOrientation,
        center: shape.center,
        p1: { x: null, y: null },
        p2: { x: null, y: null },
      };
    if (arch.type == 'V') {
      arch.p1 = { x: 0, y: -1 };
      arch.p2 = { x: 0, y: 1 };
    } else if (arch.type == 'NW') {
      arch.p1 = { x: -1, y: -1 };
      arch.p2 = { x: 1, y: 1 };
    } else if (arch.type == 'H') {
      arch.p1 = { x: -1, y: 0 };
      arch.p2 = { x: 1, y: 0 };
    } else {
      // SW
      arch.p1 = { x: -1, y: 1 };
      arch.p2 = { x: 1, y: -1 };
    }
    return arch;
  }

  /**
   * Retourne une forme
   * @param  {Shape} shape       la forme à retourner
   * @param  {Object} arch        L'axe de symétrie à utiliser
   * @param  {float} progression  Entre 0 et 1, 1 pour un retournement complet
   */
  reverseShape(shape, arch, progression) {
    let saveAxeCenter = arch.center;
    let newShapeCenter = this.computePointPosition(shape, arch, progression);
    if (!shape.haveBeenReversed && progression > 0.5) {
      // milieu animation
      shape.isReversed = !shape.isReversed;
      // shape.segments.forEach(seg => {
      //   if (seg.arcCenter)
      //     seg.counterclockwise = !seg.counterclockwise;
      // });
    }

    shape.segments.forEach(seg => {
      let transformation = this.computePointPosition(seg.vertexes[0], arch, progression);
      seg.vertexes[0] = transformation;
      transformation = this.computePointPosition(seg.vertexes[1], arch, progression);
      seg.vertexes[1] = transformation;
      seg.points.forEach(pt => {
        let pointCoords = this.computePointPosition(pt, arch, progression);
        pt.x = pointCoords.x;
        pt.y = pointCoords.y;
      });
    });
    arch.center = saveAxeCenter;
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @param  {float} progress La progression (entre 0 et 1)
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point, axe, progress) {
    let pt1 = new Point(axe.center.x + axe.p1.x, axe.center.y + axe.p1.y),
      pt2 = new Point(axe.center.x + axe.p2.x, axe.center.y + axe.p2.y),
      center = new Segment(pt1, pt2).projectionPointOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    let transformation = point.copy();
    transformation.setCoordinates({
      x: point.x + 2 * (center.x - point.x) * progress,
      y: point.y + 2 * (center.y - point.y) * progress,
    });
    return transformation;
  }
}
