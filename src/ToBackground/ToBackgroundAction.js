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

  checkDoParameters() {
    if (!Number.isFinite(this.oldIndex)) {
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

    let shape = app.workspace.shapes.splice(this.oldIndex, 1)[0];
    app.workspace.shapes.unshift(shape);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.shapes.splice(0, 1)[0];

    app.workspace.shapes.splice(this.oldIndex, 0, shape);
  }
}
