import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { mod } from '../Core/Tools/general';

export class TransformAction extends Action {
  constructor() {
    super('TransformAction');

    // id of the shape that contains the point
    this.shapeId = null;

    // point to modify
    this.pointSelected = null;

    // destination point
    this.pointDest = null;

    // the constraint applied to pointSelected
    this.line = null;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.pointSelected = save.pointSelected;
    this.pointDest = save.pointDest;
    this.line = save.line;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    // if (!(this.shapeToCreate instanceof Shape)) {
    //   this.printIncompleteData();
    //   return false;
    // }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    // if (!this.shapeId) {
    //   this.printIncompleteData();
    //   return false;
    // }
    return true;
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;

    let shape = ShapeManager.getShapeById(this.shapeId);

    if (
      this.pointSelected.name == 'firstPoint' ||
      this.pointSelected.name == 'secondPoint'
    ) {
      shape.applyTransform(this.pointSelected, this.pointDest);
    } else {
      this.pointSelected.setCoordinates(this.pointDest);
      this.pointSelected.shape.segments[
        mod(
          this.pointSelected.segment.idx + 1,
          this.pointSelected.shape.segments.length
        )
      ].vertexes[0].setCoordinates(this.pointDest);
    }
    shape.recalculateHeight();
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;
  }
}