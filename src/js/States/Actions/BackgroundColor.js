import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { getComplementaryColor } from '../../Tools/general';

export class BackgroundColorAction extends Action {
  constructor() {
    super();

    this.name = 'BackgroundColorAction';

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

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      selectedColor: this.selectedColor,
      involvedShapesIds: [...this.involvedShapesIds],
      oldColors: [...this.oldColors],
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.selectedColor = save.selectedColor;
    this.involvedShapesIds = [...save.involvedShapesIds];
    this.oldColors = [...save.oldColors];
  }

  checkDoParameters() {
    if (!this.shapeId || !this.selectedColor) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    if (this.oldColors.length != this.involvedShapesIds.length) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.oldColors = [];
    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      this.oldColors.push(s.color);
      s.color = this.selectedColor;
      s.second_color = getComplementaryColor(s.color);
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.shapeId);

    this.involvedShapesIds.forEach((id, index) => {
      let s = app.workspace.getShapeById(id);
      s.color = this.oldColors[index];
      s.second_color = getComplementaryColor(s.color);
    });
  }
}
