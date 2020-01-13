import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';

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

  saveToObject() {
    let save = {
      shapeToCreate: this.shapeToCreate.saveToObject(),
      shapeId: this.shapeId,
      shapeSize: this.shapeSize,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeToCreate = new Shape({ x: 0, y: 0 }, []);
    this.shapeToCreate.initFromObject(save.shapeToCreate);
    this.shapeId = save.shapeId;
    this.shapeSize = save.shapeSize;
  }

  checkDoParameters() {
    if (!(this.shapeToCreate instanceof Shape)) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.shapeToCreate.id = this.shapeId;
    app.workspace.addShape(this.shapeToCreate);
  }

  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = app.workspace.getShapeById(this.shapeId);
    app.workspace.deleteShape(shape);
  }
}
