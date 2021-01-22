import { Action } from '../../Core/States/Action';
import { ShapeManager } from '../../Core/Managers/ShapeManager';
import { Shape } from '../../Core/Objects/Shape';

export class CreateRegularAction extends Action {
  constructor() {
    super('CreateRegularAction');

    // numbre of points in the shape
    this.numberOfPoints = 4;

    // first point of the shape to create
    this.firstCoordinates = null;

    // second point of the shape to create
    this.secondCoordinates = null;

    // id of the shape to create
    this.shapeId = null;
  }

  initFromObject(save) {
    this.numberOfPoints = save.numberOfPoints;
    this.firstCoordinates = save.firstCoordinates;
    this.secondCoordinates = save.secondCoordinates;
    // this.reference = save.reference;
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

    let path = this.getPath(this.firstCoordinates, this.secondCoordinates);

    let newShape = new Shape({
      path: path,
      drawingEnvironment: app.mainDrawingEnvironment,
      name: this.numberOfPoints + '_corner_shape',
      familyName: 'Regular',
    });

    newShape.points[0].name = 'firstPoint';
    newShape.points[1].name = 'secondPoint';

    if (this.reference) {
      newShape.referenceShapeId = this.reference.shape.id;
      newShape.referenceSegmentIdx = this.reference.idx;
      this.reference.shape.hasGeometryReferenced.push(newShape.id);
    }

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

  getPath(firstCoordinates, secondCoordinates) {
    let externalAngle = (Math.PI * 2) / this.numberOfPoints;

    let path = [
      'M',
      firstCoordinates.x,
      firstCoordinates.y,
      'L',
      secondCoordinates.x,
      secondCoordinates.y,
    ];

    let length = firstCoordinates.dist(secondCoordinates);

    let startAngle = Math.atan2(
      -(firstCoordinates.y - secondCoordinates.y),
      -(firstCoordinates.x - secondCoordinates.x)
    );

    let currentCoordinates = secondCoordinates;

    for (let i = 0; i < this.numberOfPoints - 2; i++) {
      let dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      let dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      currentCoordinates = currentCoordinates.add({ x: dx, y: dy });

      path.push('L', currentCoordinates.x, currentCoordinates.y);
    }

    path.push('L', firstCoordinates.x, firstCoordinates.y);

    path = path.join(' ');

    return path;
  }

  // getNewSegments() {
  //   let externalAngle = (Math.PI * 2) / this.numberOfPoints;

  //   let segments = [];

  //   segments.push(new Segment(this.firstPoint, this.secondPoint));

  //   let length = this.firstPoint.dist(this.secondPoint);

  //   let startAngle = Math.atan2(
  //     -(this.firstPoint.y - this.secondPoint.y),
  //     -(this.firstPoint.x - this.secondPoint.x)
  //   );

  //   for (let i = 0; i < this.numberOfPoints - 2; i++) {
  //     let dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
  //     let dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

  //     let np = segments[i].vertexes[1].addCoordinates(dx, dy);

  //     segments.push(new Segment(segments[i].vertexes[1], np));
  //   }

  //   segments.push(
  //     new Segment(
  //       segments[this.numberOfPoints - 2].vertexes[1],
  //       this.firstPoint
  //     )
  //   );

  //   return segments;
  // }
}
