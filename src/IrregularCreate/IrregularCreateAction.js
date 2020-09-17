import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';

export class IrregularCreateAction extends Action {
  constructor() {
    super('IrregularCreateAction');

    // Les sommets de la formes à créer
    this.points = null;

    // Id de la forme à créer
    this.shapeId = null;
  }

  initFromObject(save) {
    this.points = save.points; //.map(pt => new Point(pt));
    this.shapeId = save.shapeId;
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
    let newSegments = this.points.map(
      (pt, idx, pts) => new Segment(pt, pts[(idx + 1) % pts.length])
    );
    let newShape = new Shape({
      segments: newSegments,
      id: this.shapeId,
      name: 'Irregular_polygon',
      familyName: 'Custom',
    });
    ShapeManager.addShape(newShape);
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = ShapeManager.getShapeById(this.shapeId);
    ShapeManager.deleteShape(shape);
  }
}
