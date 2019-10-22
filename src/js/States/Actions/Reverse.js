import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { getProjectionOnSegment } from '../../Tools/geometry';
import { Points } from '../../Tools/points';

export class ReverseAction extends Action {
  constructor() {
    super();

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
        center: shape.getAbsoluteCenter(),
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
    var saveAxeCenter = arch.center;
    var newShapeCenter = this.computePointPosition(shape, arch, progression);
    arch.center = { x: 0, y: 0 };
    shape.x = newShapeCenter.x;
    shape.y = newShapeCenter.y;

    shape.buildSteps.forEach(bs => {
      let transformation = this.computePointPosition(bs.coordinates, arch, progression);
      bs.coordinates = transformation;
      if (bs.type == 'segment') {
        bs.points.forEach(pt => {
          let pointCoords = this.computePointPosition(pt, arch, progression);
          pt.x = pointCoords.x;
          pt.y = pointCoords.y;
        });
      }
    });
    shape.isReversed = !shape.isReversed;

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
    let pt1 = Points.create(axe.center.x + axe.p1.x, axe.center.y + axe.p1.y),
      pt2 = Points.create(axe.center.x + axe.p2.x, axe.center.y + axe.p2.y),
      center = getProjectionOnSegment(point, pt1, pt2);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    let transformation = {
      x: point.x + 2 * (center.x - point.x) * progress,
      y: point.y + 2 * (center.y - point.y) * progress,
    };
    return transformation;
  }
}
