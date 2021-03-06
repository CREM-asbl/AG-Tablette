import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';

export class CreateAction extends Action {
  constructor() {
    super();

    this.name = 'CreateAction';

    //La forme que l'on souhaite ajouter
    this.shapeToCreate = null;

    //Les coordonnées
    this.coordinates = null;

    //Id de la forme ajoutée
    this.shapeId = null;

    //Taille de la forme. Pas utilisé ici, juste pour info (pour l'aide)
    this.shapeSize = null;
  }

  saveToObject() {
    let save = {
      shapeToCreate: this.shapeToCreate.saveToObject(),
      coordinates: this.coordinates,
      shapeId: this.shapeId,
      shapeSize: this.shapeSize,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeToCreate = new Shape({ x: 0, y: 0 }, []);
    this.shapeToCreate.initFromObject(save.shapeToCreate);
    // this.shapeToCreate.id = this.shapeId;

    this.coordinates = save.coordinates;
    this.shapeId = save.shapeId;
    this.shapeSize = save.shapeSize;
  }

  checkDoParameters() {
    if (!(this.shapeToCreate instanceof Shape)) return false;
    if (!this.coordinates || this.coordinates.x === undefined || this.coordinates.y === undefined)
      return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.shapeId) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    let shape = this.shapeToCreate;

    if (this.shapeId) shape.id = this.shapeId;
    else this.shapeId = shape.id;
    app.workspace.addShape(shape);
    this.shapeToCreate = this.shapeToCreate.copy();
  }

  undo() {
    if (!this.checkUndoParameters()) return;
    let shape = app.workspace.getShapeById(this.shapeId);
    app.workspace.deleteShape(shape);
  }
}
