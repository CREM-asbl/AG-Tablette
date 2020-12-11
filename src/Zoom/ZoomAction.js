import { app } from '../Core/App';
import { Action } from '../Core/States/Action';
import { Coordinates } from '../Core/Objects/Coordinates';

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
    this.originalTranslateOffset = new Coordinates(
      save.originalTranslateOffset
    );
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
      actualWinSize = new Coordinates({
        x: app.canvasWidth,
        y: app.canvasHeight,
      }).multiply(1 / this.originalZoom),
      newWinSize = actualWinSize.multiply(1 / this.scaleOffset),
      newTranslateoffset = this.originalTranslateOffset
        .multiply(1 / this.originalZoom)
        .add(
          newWinSize
            .substract(actualWinSize)
            .multiply(this.centerProp.x, this.centerProp.y)
        )
        .multiply(newZoom);

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
