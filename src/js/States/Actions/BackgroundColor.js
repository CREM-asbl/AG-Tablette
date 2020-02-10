import { Action } from './Action';
import { getComplementaryColor } from '../../Tools/general';
import { ShapeManager } from '../../ShapeManager';

export class BackgroundColorAction extends Action {
  constructor() {
    super('BackgroundColorAction');

    //L'id de la forme que l'on va colorier
    this.shapeId = null;

    //La couleur
    this.selectedColor = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    //Pour chaque forme de involvedShapesIds, la couleur initiale
    this.oldColors = [];
  }

  initFromObject(save) {
    this.selectedColor = save.selectedColor;
    this.involvedShapesIds = save.involvedShapesIds;
    this.oldColors = save.oldColors;
  }

  checkDoParameters() {
    if (!this.selectedColor || !this.involvedShapesIds.length) {
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
      s.color = this.selectedColor;
      s.second_color = getComplementaryColor(s.color);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = ShapeManager.getShapeById(id);
      s.color = this.oldColors[index];
      s.second_color = getComplementaryColor(s.color);
    });
  }
}
