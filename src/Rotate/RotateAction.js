import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';

export class RotateAction extends Action {
  constructor() {
    super('RotateAction');

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

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.rotationAngle = save.rotationAngle;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (
      !this.shapeId ||
      !this.involvedShapesIds ||
      !Number.isFinite(this.rotationAngle)
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

    let shape = ShapeManager.getShapeById(this.shapeId),
      center = shape.center;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.rotate(this.rotationAngle, center);
    });
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.shapeId),
      center = shape.center;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.rotate(-this.rotationAngle, center);
    });
  }
}
