import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';

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
    console.log(save);
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

    if (shape.familyName.startsWith('regular')) {
      let homothetyCenter = this.line.segment.vertexes[
        this.line.segment.vertexes[0].equal(this.pointSelected) ? 1 : 0
      ];
      console.log(homothetyCenter, shape.segments[0].vertexes[0]);
      console.log(
        'scaling',
        homothetyCenter.dist(this.pointDest) / this.pointSelected.segment.length
      );
      window.dispatchEvent(
        new CustomEvent('draw-point', {
          detail: {
            point: homothetyCenter,
            size: 3,
            color: '#ee00ee',
            ctx: app.mainCtx,
          },
        })
      );
      shape.homothety(
        homothetyCenter.dist(this.pointDest) /
          this.pointSelected.segment.length, //.dist(this.pointSelected),
        homothetyCenter
      );
    }
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
