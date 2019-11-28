import { app } from '../../App';
import { Action } from './Action';
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

    if (shape2.x < shape1.x) {
      [shape1, shape2] = [shape2, shape1];
    }

    const commonsPoints = shape1.getCommonsPoints(shape2);

    let segments = [...shape1.segments, ...shape2.segments];

    segments = segments.filter(
      segment =>
        !(
          commonsPoints.includes(JSON.stringify(segment.vertexes[0])) &&
          commonsPoints.includes(JSON.stringify(segment.vertexes[1]))
        ),
    );

    segments = segments.map(segment => {
      const newSegment = segment.copy(false);
      segment.points.forEach(point => {
        if (commonsPoints.includes(JSON.stringify(point))) {
          if (commonsPoints.includes(JSON.stringify(segment.vertexes[0]))) {
            newSegment.vertexes[0].setCoordinates(point);
          }
          if (commonsPoints.includes(JSON.stringify(segment.vertexes[1]))) {
            newSegment.vertexes[1].setCoordinates(point);
          }
        }
      });
      return newSegment;
    });

    const buildSteps = this.computeNewBuildSteps(segments);

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
    newShape.setCoordinates({ x: newShape.x - 20, y: newShape.y - 20 });

    app.workspace.addShape(newShape);

    return;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.createdShapeId);
    app.workspace.deleteShape(shape);
  }

  computeNewBuildSteps(segmentsList) {
    // Todo : Traiter le cas des formes "percées"
    // Todo : Voir si on ne peut pas la simplifier
    let newBuildSteps = [];
    // propriété pour éviter une boucle infinie et le cas des formes creuses
    let numberOfSegmentsRefused = 0;
    let precSegment;

    while (segmentsList.length > 0 && numberOfSegmentsRefused !== segmentsList.length) {
      const currentSegment = segmentsList.shift();
      let copy = null;
      if (!precSegment || currentSegment.vertexes[0].equal(precSegment.vertexes[1])) {
        copy = currentSegment;
      }

      if (precSegment && currentSegment.vertexes[1].equal(precSegment.vertexes[1])) {
        currentSegment.reverse();
        copy = currentSegment;
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

      if (precSegment && precSegment.hasSameDirection(copy)) {
        precSegment.vertexes[1] = copy.vertexes[1];
        precSegment.coordinates = copy.coordinates;
      } else {
        newBuildSteps.push(new Vertex(copy.vertexes[0]));
        newBuildSteps.push(copy);
        precSegment = copy;
      }
      numberOfSegmentsRefused = 0;
    }
    return newBuildSteps;
  }
}
