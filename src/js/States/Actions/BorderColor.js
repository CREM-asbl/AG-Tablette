import { Action } from './Action';
import { ShapeManager } from '../../ShapeManager';

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

  checkDoParameters() {
    if (!this.involvedShapesIds.length || !this.selectedColor) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.involvedShapesIds.length || this.involvedShapesIds.length != this.oldColors.length) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      s.borderColor = this.selectedColor;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = ShapeManager.getShapeById(id);
      s.borderColor = this.oldColors[index];
    });
  }
}
