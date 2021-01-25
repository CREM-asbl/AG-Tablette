import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

export class MoveAction extends Action {
  constructor() {
    super('MoveAction');

    //L'id de la forme que l'on déplace
    this.shapeId = null;

    //Le déplacement à appliquer aux formes (à additionner aux coordonnées)
    this.translation = null;

    /*
        Liste des formes solidaires à la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.translation = save.translation;
    this.involvedShapesIds = save.involvedShapesIds;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (
      !this.shapeId ||
      !this.translation ||
      this.translation.x === undefined ||
      this.translation.y === undefined
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

    let involvedShape = this.involvedShapesIds.map(id => {
      let s = ShapeManager.getShapeById(id);
      return s;
    });
    let shape = ShapeManager.getShapeById(this.shapeId);

    involvedShape.forEach(s => {
      s.translate(this.translation);
    });

    let transformation = getShapeAdjustment(involvedShape, shape);
    involvedShape.forEach(s => {
      s.rotate(transformation.rotationAngle, shape.centerCoordinates);
      s.translate(transformation.translation);
    });
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id),
        newCoords = s.coordinates.subCoordinates(this.translation);
      s.coordinates = newCoords;
    });
  }
}
