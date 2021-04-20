import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { ShapeTemplate } from '../Core/Objects/ShapeTemplate';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { app } from '../Core/App';

export class CreateAction extends Action {
  constructor() {
    super('CreateAction');

    this.selectedTemplate = null;

    this.shapeId = null;

    //Taille de la forme. Pas utilisé ici, juste pour info (pour l'aide)
    this.shapeSize = null;
  }

  initFromObject(save) {
    this.selectedTemplate = save.selectedTemplate;
    this.coordinates = save.coordinates;
    this.shapeId = save.shapeId;
    this.shapeSize = save.shapeSize;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!(this.selectedTemplate instanceof ShapeTemplate)) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    if (!this.shapeId) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = ShapeManager.getShapeById(this.shapeId);
    ShapeManager.deleteShape(shape);
  }
}
