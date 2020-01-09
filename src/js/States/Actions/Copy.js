import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';

export class CopyAction extends Action {
  constructor() {
    super('CopyAction');

    //Le décalage entre la position de la forme originale et celle de la copie
    this.transformation = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    //Les id des copies des formes à dupliquer
    this.newShapesIds = [];

    //L'id du nouvel userGroup créé (si la forme dupliquée faisait partie
    //d'un autre userGroup)
    this.createdUsergroupId = null;
  }

  saveToObject() {
    let save = {
      transformation: this.transformation,
      involvedShapesIds: this.involvedShapesIds,
      newShapesIds: this.newShapesIds,
      createdUsergroupId: this.createdUsergroupId,
    };
    return save;
  }

  initFromObject(save) {
    this.transformation = save.transformation;
    this.involvedShapesIds = save.involvedShapesIds;
    this.newShapesIds = save.newShapesIds;
    this.createdUsergroupId = save.createdUsergroupId;
  }

  checkDoParameters() {
    if (
      !this.transformation ||
      this.transformation.x === undefined ||
      this.transformation.y === undefined
    )
      return false;
    return true;
  }

  checkUndoParameters() {
    if (this.involvedShapesIds.length != this.newShapesIds.length) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    let shapesList = [];

    this.involvedShapesIds.forEach((id, index) => {
      let s = app.workspace.getShapeById(id),
        copy = s.copy(),
        newCoords = s.coordinates.addCoordinates(this.transformation);
      shapesList.push(copy);
      copy.coordinates = newCoords;
      copy.id = this.newShapesIds[index];
      app.workspace.addShape(copy);
    });

    //Si nécessaire, créer le userGroup
    if (shapesList.length > 1) {
      let userGroup = new ShapeGroup(0, 1);
      if (Number.isFinite(this.createdUsergroupId)) userGroup.id = this.createdUsergroupId;
      else this.createdUsergroupId = userGroup.id;
      userGroup.shapesIds = this.newShapesIds;
      app.workspace.addGroup(userGroup);
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.newShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      app.workspace.deleteShape(s);
    });

    if (this.newShapesIds.length > 1) {
      let group = app.workspace.getGroup(this.createdUsergroupId);
      app.workspace.deleteGroup(group);
    }
  }
}
