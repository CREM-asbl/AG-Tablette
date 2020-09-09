import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';

export class BuildCenterAction extends Action {
  constructor() {
    super('BuildCenterAction');

    //L'id de la forme dont on va colorier les bords
    this.shapeId = null;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!this.shapeId) {
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

    let shape = ShapeManager.getShapeById(this.shapeId);
    shape.isCenterShown = !shape.isCenterShown;
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.shapeId);
    shape.isCenterShown = !shape.isCenterShown;
  }
}
