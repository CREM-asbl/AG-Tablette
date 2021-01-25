import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';

export class CreateIrregularAction extends Action {
  constructor() {
    super('CreateIrregularAction');

    // Les sommets de la formes à créer
    this.coordinates = null;
  }

  initFromObject(save) {
    this.coordinates = save.coordinates; //.map(pt => new Point(pt));
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
    let path = [];
    this.coordinates.forEach((coord, idx) => {
      if (idx == 0) path.push('M', coord.x, coord.y);
      else if (idx == this.coordinates.length - 1)
        path.push('L', this.coordinates[0].x, this.coordinates[0].y);
      else path.push('L', coord.x, coord.y);
    });
    path = path.join(' ');
    new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: path,
      name: this.coordinates.length + '_corner_shape',
      familyName: 'Irregular',
    });
    window.dispatchEvent(new CustomEvent('refresh'));
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
