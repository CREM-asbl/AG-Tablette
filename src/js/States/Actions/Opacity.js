import { app } from '../../App';
import { Action } from './Action';
import { Shape } from '../../Objects/Shape';

export class OpacityAction extends Action {
  constructor() {
    super('OpacityAction');

    //L'id de la forme sélectionnée
    this.shapeId = null;

    //L'opacité
    this.opacity = null;

    /*
        Liste des formes solidaires à la la forme sélectionnée, y compris
        la forme elle-même
         */
    this.involvedShapesIds = [];

    //Pour chaque forme de involvedShapesIds, l'opacité initiale
    this.oldOpacities = [];
  }

  saveToObject() {
    let save = {
      opacity: this.opacity,
      involvedShapesIds: [...this.involvedShapesIds],
      oldOpacities: [...this.oldOpacities],
    };
    return save;
  }

  initFromObject(save) {
    this.opacity = save.opacity;
    this.involvedShapesIds = save.involvedShapesIds;
    this.oldOpacities = save.oldOpacities;
  }

  checkDoParameters() {
    if (!Number.isFinite(this.opacity)) return false;
    return true;
  }

  checkUndoParameters() {
    if (this.oldOpacities.length != this.involvedShapesIds.length) return false;
    return true;
  }

  do() {
    if (!this.checkDoParameters()) return;

    this.involvedShapesIds.forEach(id => {
      let s = app.workspace.getShapeById(id);
      s.opacity = this.opacity;
    });
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    this.involvedShapesIds.forEach((id, index) => {
      let s = app.workspace.getShapeById(id);
      s.opacity = this.oldOpacities[index];
    });
  }
}
