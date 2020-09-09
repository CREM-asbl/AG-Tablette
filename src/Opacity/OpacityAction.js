import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';

export class OpacityAction extends Action {
  constructor() {
    super('OpacityAction');

    //L'opacité
    this.opacity = null;

    /*
        Liste des formes solidaires à la la forme sélectionnée, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    //Pour chaque forme de involvedShapesIds, l'opacité initiale
    this.oldOpacities = [];
  }

  initFromObject(save) {
    this.opacity = save.opacity;
    this.involvedShapesIds = save.involvedShapesIds;
    this.oldOpacities = save.oldOpacities;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!Number.isFinite(this.opacity) || !this.involvedShapesIds) {
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
      !this.involvedShapesIds ||
      this.oldOpacities.length != this.involvedShapesIds.length
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

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.opacity = this.opacity;
    });
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = ShapeManager.getShapeById(id);
      s.opacity = this.oldOpacities[index];
    });
  }
}
