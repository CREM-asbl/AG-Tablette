import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';

export class IsoscelesTriangleAction extends Action {
  constructor() {
    super('IsoscelesTriangleAction');

    // first point of the shape to create
    this.firstPoint = null;

    // second point of the shape to create
    this.secondPoint = null;

    // third point of the shape to create
    this.thirdPoint = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.firstPoint = save.firstPoint;
    this.secondPoint = save.secondPoint;
    this.thirdPoint = save.thirdPoint;
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
    this.firstPoint.name = 'firstPoint';
    this.secondPoint.name = 'secondPoint';
    let shape = new Shape({
      id: this.shapeId,
      segments: [
        new Segment(this.firstPoint, this.secondPoint),
        new Segment(this.secondPoint, this.thirdPoint),
        new Segment(this.thirdPoint, this.firstPoint),
      ],
      name: 'isosceles-triangle',
      familyName: 'triangle',
    });
    shape.recalculateHeight();
    ShapeManager.addShape(shape);
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
