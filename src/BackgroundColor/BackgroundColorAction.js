import { Action } from '../Core/States/Action';
import { getComplementaryColor } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';

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

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!this.selectedColor || !this.involvedShapesIds.length) {
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

    let mustChangeOpacity = false;

    // setOpacity quand transparent
    if (
      this.involvedShapesIds.some(sId => {
        let s = ShapeManager.getShapeById(sId);
        return s.opacity != 1;
      })
    ) {
      mustChangeOpacity = true;
    }

    this.involvedShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      if (mustChangeOpacity) s.opacity = 0.7;
      s.color = this.selectedColor;
      s.second_color = getComplementaryColor(s.color);
    });
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = ShapeManager.getShapeById(id);
      s.color = this.oldColors[index];
      s.second_color = getComplementaryColor(s.color);
    });
  }
}
