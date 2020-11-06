import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { ShapeTemplate } from '../Core/Objects/ShapeTemplate';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

export class CreateAction extends Action {
  constructor() {
    super('CreateAction');

    this.selectedTemplate = null;

    this.shapeId = null;

    //Taille de la forme. Pas utilisé ici, juste pour info (pour l'aide)
    this.shapeSize = null;
  }

  initFromObject(save) {
    this.selectedTemplate = save.selectedTemplate;
    this.coordinates = save.coordinates;
    this.shapeId = save.shapeId;
    this.shapeSize = save.shapeSize;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (!(this.selectedTemplate instanceof ShapeTemplate)) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    if (!this.shapeId) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
  do() {
    if (!this.checkDoParameters()) return;
    let shape = new Shape({
      ...this.selectedTemplate,
      id: this.shapeId,
      size: this.shapeSize,
      drawingEnvironment: app.mainDrawingEnvironment,
    });
    shape.scale(this.shapeSize);
    shape.translate(this.coordinates.substract(shape.vertexes[0]));

    let transformation = getShapeAdjustment([shape], shape);
    console.log(transformation);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
    // if (transformation.rotation != 0) {
    //   let rotateAction = {
    //     name: 'RotateAction',
    //     shapeId: this.shapeToCreate.id,
    //     involvedShapesIds: involvedShapes.map(s => s.id),
    //     rotationAngle: transformation.rotation,
    //   };
    //   this.actions.push(rotateAction);
    // }
    // if (transformation.move.x != 0 || transformation.move.y != 0) {
    //   let moveAction = {
    //     name: 'MoveAction',
    //     shapeId: this.shapeToCreate.id,
    //     involvedShapesIds: involvedShapes.map(s => s.id),
    //     transformation: transformation.move,
    //   };
    //   this.actions.push(moveAction);
    // }
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
