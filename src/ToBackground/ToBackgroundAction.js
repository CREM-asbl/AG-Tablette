import { app } from '../Core/App';
import { Action } from '../Core/States/Action';

export class ToBackgroundAction extends Action {
  constructor() {
    super('ToBackgroundAction');

    this.involvedShapesIds = null;
  }

  initFromObject(save) {
    this.involvedShapesIds = save.involvedShapesIds;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    // if (!this.shapeId) {
    //   this.printIncompleteData();
    //   return false;
    // }
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

    this.involvedShapesIds.forEach((sId, index) => {
      let shapeIndex = app.mainDrawingEnvironment.findIndexById(sId);
      let shape = app.mainDrawingEnvironment.shapes.splice(shapeIndex, 1)[0];
      app.mainDrawingEnvironment.shapes.splice(index, 0, shape);
    });
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.shapes.splice(0, 1)[0];

    app.workspace.shapes.splice(this.oldIndex, 0, shape);
  }
}
