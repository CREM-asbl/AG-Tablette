import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';

export class BorderColorAction extends Action {
  constructor() {
    super('BorderColorAction');

    //La couleur
    this.selectedColor = null;

    /*
        Liste des formes solidaires à la la forme dont on colorie les bords, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    //Pour chaque forme de involvedShapesIds, la couleur initiale
    this.oldColors = [];
  }

  initFromObject(save) {
    this.involvedShapesIds = save.involvedShapesIds;
    this.selectedColor = save.selectedColor;
    this.oldColors = save.oldColors;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!this.involvedShapesIds.length || !this.selectedColor) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    if (
      !this.involvedShapesIds.length ||
      this.involvedShapesIds.length != this.oldColors.length
    ) {
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

    this.involvedShapesIds.forEach((id) => {
      let s = ShapeManager.getShapeById(id);
      s.borderColor = this.selectedColor;
    });
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = ShapeManager.getShapeById(id);
      s.borderColor = this.oldColors[index];
    });
  }
}
