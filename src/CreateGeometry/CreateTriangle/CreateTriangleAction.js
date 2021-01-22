import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';

export class CreateTriangleAction extends Action {
  constructor() {
    super('CreateTriangleAction');

    // points of the shape to create
    this.coordinates = [];

    // name of the triangle to create (rectangle, isocele, quelconque)
    this.triangleName = null;
  }

  initFromObject(save) {
    this.coordinates = save.coordinates;
    this.triangleName = save.triangleName;
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

    let familyName = '3-corner-shape';
    if (this.triangleName == 'EquilateralTriangle') {
      familyName = 'Regular';
    } else if (this.triangleName == 'IrregularTriangle') {
      familyName = 'Irregular';
    }

    let path = ['M', this.coordinates[0].x, this.coordinates[0].y];
    path.push('L', this.coordinates[1].x, this.coordinates[1].y);
    path.push('L', this.coordinates[2].x, this.coordinates[2].y);
    path.push('L', this.coordinates[0].x, this.coordinates[0].y);
    path = path.join(' ');

    let shape = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: path,
      name: this.triangleName,
      familyName: familyName,
    });

    shape.points[0].name = 'firstPoint';
    shape.points[1].name = 'secondPoint';
    shape.points[2].name = 'thirdPoint';
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
