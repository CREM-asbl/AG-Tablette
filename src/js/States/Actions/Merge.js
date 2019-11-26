import { app } from '../../App';
import { Action } from './Action';
import { Points } from '../../Tools/points';
import { getAverageColor } from '../../Tools/general';
import { Vertex } from '../../Objects/ShapeBuildStep';

export class MergeAction extends Action {
  constructor() {
    super();

    this.name = 'MergeAction';

    //Première forme
    this.firstShapeId = null;

    //Seconde forme
    this.secondShapeId = null;

    //Id de la forme résultant de la fusion
    this.createdShapeId = null;
  }

  saveToObject() {
    let save = {
      firstShapeId: this.firstShapeId,
      secondShapeId: this.secondShapeId,
    };
    return save;
  }

  initFromObject(save) {
    this.firstShapeId = save.firstShapeId;
    this.secondShapeId = save.secondShapeId;
  }

  checkDoParameters() {
    if (!this.firstShapeId || !this.secondShapeId) return false;
    return true;
  }

  checkUndoParameters() {
    if (!this.createdShapeId) return false;
    return true;
  }

  //Si renvoie false, annulera l'ajout à l'historique
  do() {
    if (!this.checkDoParameters()) return;

    let shape1 = app.workspace.getShapeById(this.firstShapeId),
      shape2 = app.workspace.getShapeById(this.secondShapeId);

    const segmentsOfMergedShape = this.computeSegmentsOfMergedShape(shape1, shape2);

    const buildSteps = this.computeNewBuildSteps(segmentsOfMergedShape);

    if (!buildSteps) return;

    //Créer la forme
    let newShape = shape1.copy();
    if (this.createdShapeId) newShape.id = this.createdShapeId;
    else this.createdShapeId = newShape.id;
    newShape.name = 'Custom';
    newShape.familyName = 'Custom';
    newShape.color = getAverageColor(shape1.color, shape2.color);
    newShape.borderColor = getAverageColor(shape1.borderColor, shape2.borderColor);
    newShape.isCenterShown = false;
    newShape.opacity = (shape1.opacity + shape2.opacity) / 2;
    newShape.buildSteps = buildSteps;
    newShape.setCoordinates(Points.sub(newShape, Points.create(20, 20)));

    app.workspace.addShape(newShape);

    return;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.createdShapeId);
    app.workspace.deleteShape(shape);
  }

  hasCommonSegment(shape1, shape2) {
    const segmentsFromShape1 = shape1.getSegments();
    const segmentsFromShape2 = shape2.getSegments();
    for (let i = 0; i < segmentsFromShape1.length; i++) {
      for (let j = 0; j < segmentsFromShape2.length; j++) {
        if (this.isCommonSegment(segmentsFromShape1[i], segmentsFromShape2[j])) return true;
      }
    }
    return false;
  }

  computeSegmentsOfMergedShape(shape1, shape2) {
    // Todo: A améliorer pour les arcs
    let segments = shape1.getSegments();
    const segmentsFromShape2 = shape2.getSegments();

    for (let i = 0; i < segmentsFromShape2.length; i++) {
      const commonsSegments = segments.filter(segment =>
        this.isCommonSegment(segment, segmentsFromShape2[i]),
      );

      if (commonsSegments.length > 0) {
        segments = segments.filter(segment => !commonsSegments.includes(segment));
      }

      if (commonsSegments.length === 0) {
        segments.push(segmentsFromShape2[i]);
      }
    }
    return segments;
  }

  computeNewBuildSteps(segmentsList) {
    // Todo : Traiter le cas des formes "percées"
    // Todo : Gérer les arcs
    let newBuildSteps = [];
    // propriété pour éviter une boucle infinie et le cas des formes creuses
    let numberOfSegmentsRefused = 0;
    let precSegment;

    while (segmentsList.length > 0 && numberOfSegmentsRefused !== segmentsList.length) {
      const currentSegment = segmentsList.shift();
      let copy = null;
      if (!precSegment || Points.equal(currentSegment.vertexes[0], precSegment.vertexes[1])) {
        copy = currentSegment.copy(false);
      }

      if (precSegment && Points.equal(currentSegment.vertexes[1], precSegment.vertexes[1])) {
        copy = currentSegment.copy(false);
        copy.reverse();
      }

      if (!copy) {
        segmentsList.push(currentSegment);
        numberOfSegmentsRefused++;
        if (numberOfSegmentsRefused === segmentsList.length) {
          alert('Les formes creuses ne sont pas supportées actuellement');
          newBuildSteps = null;
        }
        continue;
      }

      // if (this.isSegmentsHaveSameDirection(precSegment, copy)) {
      //   precSegment.vertexes[1] = copy.vertexes[1]
      // } else {
      newBuildSteps.push(new Vertex(copy.vertexes[0]));
      newBuildSteps.push(copy);
      precSegment = copy;
      numberOfSegmentsRefused = 0;
      // }
    }
    console.log(newBuildSteps);
    return newBuildSteps;
  }

  //TODO : à placer dans Segment
  isCommonSegment(segment1, segment2) {
    return (
      (Points.equal(segment1.vertexes[0], segment2.vertexes[0]) &&
        Points.equal(segment1.vertexes[1], segment2.vertexes[1])) ||
      (Points.equal(segment1.vertexes[0], segment2.vertexes[1]) &&
        Points.equal(segment1.vertexes[1], segment2.vertexes[0]))
    );
  }

  isSegmentsHaveSameDirection(segment1, segment2) {
    if (!segment1 || !segment2) return false;
    return Points.equal(segment1.direction, segment2.direction);
  }
}
