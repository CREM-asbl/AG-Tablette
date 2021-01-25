import { app } from '../Core/App';
import { Action } from '../Core/States/Action';

export class ToBackgroundAction extends Action {
  constructor() {
    super('ToBackgroundAction');

    this.shapeId = null;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!this.shapeId) {
      this.printIncompleteData();
      return false;
    }
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

    let shapeIndex = app.mainDrawingEnvironment.findIndexById(this.shapeId);
    let shape = app.mainDrawingEnvironment.shapes.splice(shapeIndex, 1)[0];
    app.mainDrawingEnvironment.shapes.unshift(shape);
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
