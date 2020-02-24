import { app } from '../Core/App';
import { Action } from '../Core/States/Action';
import { Point } from '../Objects/Point';

export class TranslateAction extends Action {
  constructor() {
    super('TranslateAction');

    //Translation à appliquer
    this.offset = null;
  }

  initFromObject(save) {
    this.offset = new Point();
    this.offset.initFromObject(save.offset);
  }

  checkDoParameters() {
    if (!this.offset || this.offset.x === undefined || this.offset.y === undefined) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    let originalOffset = app.workspace.translateOffset,
      newOffset = originalOffset.addCoordinates(this.offset);

    app.workspace.setTranslateOffset(newOffset);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let originalOffset = app.workspace.translateOffset,
      newOffset = originalOffset.subCoordinates(this.offset);

    app.workspace.setTranslateOffset(newOffset);
  }
}
