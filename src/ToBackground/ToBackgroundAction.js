import { app } from '../Core/App';
import { Action } from '../Core/States/Action';

export class ToBackgroundAction extends Action {
  constructor() {
    super('ToBackgroundAction');

    //L'index original de la forme dans workspace.shapes
    this.oldIndex = null;
  }

  initFromObject(save) {
    this.oldIndex = save.oldIndex;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!Number.isFinite(this.oldIndex)) {
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

    let shape = app.workspace.shapes.splice(this.oldIndex, 1)[0];
    app.workspace.shapes.unshift(shape);
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
