import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';

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

  saveToObject() {
    let save = {
      involvedShapesIds: this.involvedShapesIds,
      selectedColor: this.selectedColor,
      oldColors: this.oldColors,
    };
    return save;
  }

  initFromObject(save) {
    this.involvedShapesIds = save.involvedShapesIds;
    this.selectedColor = save.selectedColor;
    this.oldColors = save.oldColors;
  }

  checkDoParameters() {
    if (!this.selectedColor) return false;
    return true;
  }

  checkUndoParameters() {
    if (this.oldColors.length != this.involvedShapesIds.length) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      s.borderColor = this.selectedColor;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = app.workspace.getShapeById(id);
      s.borderColor = this.oldColors[index];
    });
  }
}
