import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';
import { ShapeGroup } from '../../Objects/ShapeGroup';

export class CopyAction extends Action {
  constructor() {
    super();

    this.name = 'CopyAction';

    //L'id de la forme sélectionnée
    this.shapeId = null;

    //Le décalage entre la position de la forme originale et celle de la copie
    this.transformation = null;

    /*
        Liste des formes solidaires à la la forme que l'on déplace, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    //L'id de la forme sélectionnée
    this.shapeCopyId = [];

    //Les id des copies des formes à dupliquer
    this.newShapesIds = [];

    //L'id du nouvel userGroup créé (si la forme dupliquée faisait partie
    //d'un autre userGroup)
    this.createdUsergroupId = null;

    //L'index (dans le tableau de groupes du worksapce) de l'userGroup créé
    this.createdUserGroupIndex = null;
  }

  saveToObject() {
    let save = {
      shapeId: this.shapeId,
      transformation: this.transformation,
      involvedShapesIds: this.involvedShapesIds,
      shapeCopyId: this.shapeCopyId,
      newShapesIds: this.newShapesIds,
      createdUsergroupId: this.createdUsergroupId,
      createdUserGroupIndex: this.createdUserGroupIndex,
    };
    return save;
  }

  initFromObject(save) {
    this.shapeId = save.shapeId;
    this.transformation = save.transformation;
    this.involvedShapesIds = save.involvedShapesIds;
    this.shapeCopyId = save.shapeCopyId;
    this.newShapesIds = save.newShapesIds;
    this.createdUsergroupId = save.createdUsergroupId;
    this.createdUserGroupIndex = save.createdUserGroupIndex;
  }

  checkDoParameters() {
    if (!this.shapeId) return false;
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
      if (this.newShapesIds.length > index) copy.id = this.newShapesIds[index];
      else this.newShapesIds.push(copy.id);
      if (id == this.shapeId && !this.shapeCopyId.length) this.shapeCopyId.push(copy.id);
      app.workspace.addShape(copy);
    });

    //Si nécessaire, créer le userGroup
    if (shapesList.length > 1) {
      let userGroup = new ShapeGroup(shapesList[0].id, shapesList[1].id);
      if (Number.isFinite(this.createdUsergroupId)) userGroup.id = this.createdUsergroupId;
      else this.createdUsergroupId = userGroup.id;
      shapesList.splice(2).forEach(s => {
        userGroup.addShape(s.id);
      });
      if (Number.isFinite(this.createdUserGroupIndex))
        app.workspace.addGroup(userGroup, this.createdUserGroupIndex);
      else {
        app.workspace.addGroup(userGroup);
        this.createdUserGroupIndex = app.workspace.getGroupIndex(userGroup);
      }
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
