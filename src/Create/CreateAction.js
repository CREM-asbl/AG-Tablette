import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';

export class CreateAction extends Action {
  constructor() {
    super('CreateAction');

    //La forme que l'on souhaite ajouter
    this.shapeToCreate = null;

    //Id de la forme ajoutée
    this.shapeId = null;

    //Taille de la forme. Pas utilisé ici, juste pour info (pour l'aide)
    this.shapeSize = null;
  }

  initFromObject(save) {
    this.shapeToCreate = new Shape({ x: 0, y: 0 }, []);
    this.shapeToCreate.initFromObject(save.shapeToCreate);
    this.shapeId = save.shapeId;
    this.shapeSize = save.shapeSize;
  }

  checkDoParameters() {
    if (!(this.shapeToCreate instanceof Shape)) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.shapeToCreate.id = this.shapeId;
    ShapeManager.addShape(this.shapeToCreate);
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.shapeId);
    ShapeManager.deleteShape(shape);
  }
}
