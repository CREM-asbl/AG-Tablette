import { app } from '../Core/App';
import { Action } from '../Core/States/Action';

export class TranslateAction extends Action {
  constructor() {
    super('TranslateAction');

    //Translation à appliquer
    this.offset = null;
  }

  initFromObject(save) {
    this.offset = save.offset;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (
      !this.offset ||
      this.offset.x === undefined ||
      this.offset.y === undefined
    ) {
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

    let originalOffset = app.workspace.translateOffset,
      newOffset = originalOffset.add(this.offset);

    app.workspace.setTranslateOffset(newOffset);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    let originalOffset = app.workspace.translateOffset,
      newOffset = originalOffset.subCoordinates(this.offset);

    app.workspace.setTranslateOffset(newOffset);
  }
}
