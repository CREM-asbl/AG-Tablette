import { Action } from '../Core/States/Action';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Shape } from '../Core/Objects/Shape';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { app } from '../Core/App';

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

  initFromObject(save) {
    this.transformation = save.transformation;
    this.involvedShapesIds = save.involvedShapesIds;
    this.newShapesIds = save.newShapesIds;
    this.createdUsergroupId = save.createdUsergroupId;
    if (save.shapeId) {
      // for update history from 1.0.0
      window.dispatchEvent(
        new CustomEvent('update-history', {
          detail: {
            name: 'CopyAction',
            transformation: this.transformation,
            involvedShapesIds: this.involvedShapesIds,
            newShapesIds: this.newShapesIds,
            createdUsergroupId: this.createdUsergroupId,
          },
        })
      );
    }
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (
      !this.transformation ||
      this.transformation.x === undefined ||
      this.transformation.y === undefined
    ) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  /**
   * vérifie si toutes les conditions sont réunies pour annuler l'action précédente
   */
  checkUndoParameters() {
    if (this.involvedShapesIds.length != this.newShapesIds.length) {
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

    let shapesList = [];

    let involvedShapes = this.involvedShapesIds.map(id =>
      app.mainDrawingEnvironment.findObjectById(id, 'shape')
    );

    // sort shapes by height
    // this.involvedShapesIds = this.involvedShapesIds
    //   .map(id => ShapeManager.getShapeById(id))
    //   .sort((s1, s2) =>
    //     ShapeManager.getShapeIndex(s1) > ShapeManager.getShapeIndex(s2) ? 1 : -1
    //   )
    //   .map(s => s.id);

    involvedShapes.forEach(s => {
      let newShape = new Shape({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
        path: s.getSVGPath('no scale'),
        id: undefined,
      });
      shapesList.push(newShape);
      newShape.translate(this.transformation);
      // newShape.id = this.newShapesIds[index];
    });

    let transformation = getShapeAdjustment(shapesList, shapesList[0]);

    shapesList.forEach(newShape => {
      newShape.rotate(
        transformation.rotationAngle,
        shapesList[0].centerCoordinates
      );
      newShape.translate(transformation.translation);
    });

    //Si nécessaire, créer le userGroup
    // if (shapesList.length > 1) {
    //   let userGroup = new ShapeGroup(0, 1);
    //   if (Number.isFinite(this.createdUsergroupId))
    //     userGroup.id = this.createdUsergroupId;
    //   else this.createdUsergroupId = userGroup.id;
    //   userGroup.shapesIds = this.newShapesIds;
    //   GroupManager.addGroup(userGroup);
    // }
  }

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    this.newShapesIds.forEach(id => {
      let s = ShapeManager.getShapeById(id);
      ShapeManager.deleteShape(s);
    });

    if (this.newShapesIds.length > 1) {
      let group = GroupManager.getGroup(this.createdUsergroupId);
      GroupManager.deleteGroup(group);
    }
  }
}
