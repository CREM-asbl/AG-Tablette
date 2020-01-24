import { app } from '../../App';
import { Action } from './Action';
import { Point } from '../../Objects/Point';

export class TranslatePlaneAction extends Action {
  constructor() {
    super('TranslatePlaneAction');

    //Translation à appliquer
    this.offset = null;
  }

  initFromObject(save) {
    this.offset = new Point();
    this.offset.initFromObject(save.offset);
  }

  checkDoParameters() {
    if (!this.offset || this.offset.x === undefined || this.offset.y === undefined) return false;
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
