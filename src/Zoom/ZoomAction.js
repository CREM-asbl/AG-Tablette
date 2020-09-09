import { app } from '../Core/App';
import { Action } from '../Core/States/Action';
import { Point } from '../Core/Objects/Point';

export class ZoomAction extends Action {
  constructor() {
    super('ZoomAction');

    // Scale à appliquer
    this.scaleOffset = null;

    this.originalZoom = null;

    this.originalTranslateOffset = null;

    this.centerProp = null;
  }

  initFromObject(save) {
    this.scaleOffset = save.scaleOffset;
    this.originalZoom = save.originalZoom;
    this.originalTranslateOffset = new Point(save.originalTranslateOffset);
    this.centerProp = save.centerProp;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!Number.isFinite(this.scaleOffset)) {
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

    let newZoom = this.originalZoom * this.scaleOffset,
      actualWinSize = new Point(
        app.canvasWidth,
        app.canvasHeight
      ).multiplyWithScalar(1 / this.originalZoom),
      newWinSize = actualWinSize.multiplyWithScalar(1 / this.scaleOffset),
      newTranslateoffset = new Point(
        (this.originalTranslateOffset.x / this.originalZoom -
          (actualWinSize.x - newWinSize.x) * this.centerProp.x) *
          newZoom,
        (this.originalTranslateOffset.y / this.originalZoom -
          (actualWinSize.y - newWinSize.y) * this.centerProp.y) *
          newZoom
      );

    app.workspace.setZoomLevel(newZoom, false);
    app.workspace.setTranslateOffset(newTranslateoffset);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    let originalZoom = app.workspace.zoomLevel,
      newZoom = originalZoom * (1 / this.scaleOffset);

    app.workspace.setZoomLevel(newZoom);
    app.workspace.setTranslateOffset(this.originalTranslateOffset);
  }
}
