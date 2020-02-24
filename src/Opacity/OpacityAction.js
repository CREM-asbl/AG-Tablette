import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Managers/ShapeManager';

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

  checkDoParameters() {
    if (!Number.isFinite(this.opacity) || !this.involvedShapesIds) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.involvedShapesIds || this.oldOpacities.length != this.involvedShapesIds.length) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.opacity = this.opacity;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = ShapeManager.getShapeById(id);
      s.opacity = this.oldOpacities[index];
    });
  }
}
