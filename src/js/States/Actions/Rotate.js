import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { Points } from '../../Tools/points';
import { rotatePoint } from '../../Tools/geometry';

export class RotateAction extends Action {
  constructor() {
    super();

    //L'id de la forme que l'on tourne
    this.shapeId = null;

    //L'angle de rotation (dans le sens horloger)
    this.rotationAngle = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      rotationAngle: this.rotationAngle,
      involvedShapesIds: this.involvedShapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.rotationAngle = save.rotationAngle;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
    if (!Number.isFinite(this.rotationAngle)) return false;
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId),
      center = Points.add(shape, shape.center); //.getAbsoluteCenter();

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      this.rotateShape(s, this.rotationAngle, center);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId),
      center = shape.getAbsoluteCenter();

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      this.rotateShape(s, -this.rotationAngle, center);
    });
  }

  /**
   * Applique une rotation d'un certain angle sur une forme.
   * @param  {Shape} shape La forme
   * @param  {float} angle L'angle en radians
   * @param  {Point} center Le centre autour duquel effectuer la rotation
   */
  rotateShape(shape, angle, center) {
    let newCoords = rotatePoint(shape, angle, center);
    shape.setCoordinates(newCoords);

    shape.buildSteps.forEach(bs => {
      let coords = rotatePoint(bs.coordinates, angle, { x: 0, y: 0 });
      bs.coordinates = coords;
      if (bs.type == 'segment') {
        bs.points.forEach(pt => {
          let pointCoords = rotatePoint(pt, angle, { x: 0, y: 0 });
          pt.x = pointCoords.x;
          pt.y = pointCoords.y;
        });
      }
    });
  }
}
