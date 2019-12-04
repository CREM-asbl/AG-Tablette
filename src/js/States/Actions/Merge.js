import { app } from '../../App';
import { Action } from './Action';
import { getAverageColor } from '../../Tools/general';
import { Vertex, Segment, MoveTo } from '../../Objects/ShapeBuildStep';

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

    const newSegments = this.createNewSegments(shape1, shape2);

    const newBuildSteps = this.computeNewBuildSteps(newSegments);
    if (!newBuildSteps) return this.alertDigShape();

    this.createNewShape(shape1, shape2, newBuildSteps);
    return;
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = app.workspace.getShapeById(this.createdShapeId);
    app.workspace.deleteShape(shape);
  }

  alertDigShape() {
    alert('Les formes creuses ne sont pas supportées actuellement');
    return false;
  }

  createNewSegments(shape1, shape2) {
    let oldSegments = [...shape1.segments, ...shape2.segments],
      subSegments = oldSegments.map(segment => segment.subSegments);

    let pairs = oldSegments.map((segment, idx, segments) => {
      return segments
        .map((seg, i, segs) => {
          if (subSegments[i].some(subseg => subSegments[idx].some(subs => subs.equal(subseg))))
            return i;
          else return -1;
        })
        .filter(s => s != -1);
    });

    // if trio (more than 2 segments inside another)
    if (pairs.filter(pair => pair.length > 2).length) {
      console.log('shape is dig (a segment has multiple joined segments)');
      return this.alertDigShape();
    }

    // 2D array of all segments
    const segments_array = pairs.map((pair, idx, pairs) => {
      if (pair.length == 1) {
        return oldSegments[pair[0]];
      } else if (pair.length == 2) {
        if (pairs.slice(idx + 1).some(p => pair[0] == p[0] && pair[1] == p[1]))
          // filter doubles
          return null;
        let vertexes = [...oldSegments[pair[0]].vertexes, ...oldSegments[pair[1]].vertexes];
        vertexes.sort((v1, v2) => (v1.x > v2.x || (v1.x == v2.x && v1.y > v2.y) ? 1 : -1));
        let newSegments = [];
        if (!vertexes[0].equal(vertexes[1]))
          newSegments.push(new Segment(vertexes[0], vertexes[1]));
        if (!vertexes[2].equal(vertexes[3]))
          newSegments.push(new Segment(vertexes[2], vertexes[3]));
        return newSegments;
      } else {
        console.log('cannot happen');
        return null;
      }
    });

    // back to 1D
    const newSegments = segments_array.filter(p => p).flat();

    return newSegments;
  }

  computeNewBuildSteps(segmentsList) {
    // Todo : Voir si on ne peut pas la simplifier
    let newBuildSteps = [];

    let currentSegment = segmentsList[0].copy(false);
    let firstSegment = currentSegment;
    let nextSegment;
    let segmentUsed = 0;

    newBuildSteps.push(currentSegment);
    segmentUsed++;

    while (!firstSegment.vertexes[0].equal(currentSegment.vertexes[1])) {
      // while not closed
      const newPotentialSegments = segmentsList.filter(
        seg => !seg.equal(currentSegment) && seg.contains(currentSegment.vertexes[1], false),
      );
      if (newPotentialSegments.length != 1) {
        if (newPotentialSegments.length == 0) console.log('shape cannot be closed (dead end)');
        else console.log('shape is dig (a segment has more than one segment for next)');
        return null;
      }
      nextSegment = newPotentialSegments[0].copy(false);
      if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse();

      if (currentSegment.hasSameDirection(nextSegment)) {
        currentSegment.vertexes[1] = nextSegment.vertexes[1];
        currentSegment.coordinates = nextSegment.coordinates;
      } else {
        newBuildSteps.push(new Vertex(nextSegment.vertexes[0]));
        newBuildSteps.push(nextSegment);
      }
      segmentUsed++;
      currentSegment = nextSegment;
    }
    if (segmentUsed != segmentsList.length) {
      console.log('shape is dig (not all segments have been used)');
      return null;
    }
    if (currentSegment.hasSameDirection(firstSegment))
      newBuildSteps[0].vertexes[0] = newBuildSteps.pop().vertexes[0];
    else newBuildSteps.push(new Vertex(currentSegment.vertexes[1]));
    newBuildSteps.unshift(new MoveTo(newBuildSteps[0].vertexes[0]));
    return newBuildSteps;
  }

  createNewShape(shape1, shape2, newBuildSteps) {
    let newShape = shape1.copy();
    if (this.createdShapeId) newShape.id = this.createdShapeId;
    else this.createdShapeId = newShape.id;
    newShape.name = 'Custom';
    newShape.familyName = 'Custom';
    newShape.color = getAverageColor(shape1.color, shape2.color);
    newShape.borderColor = getAverageColor(shape1.borderColor, shape2.borderColor);
    newShape.isCenterShown = false;
    newShape.opacity = (shape1.opacity + shape2.opacity) / 2;
    newShape.buildSteps = newBuildSteps;
    newShape.setCoordinates({ x: newShape.x - 20, y: newShape.y - 20 });

    app.workspace.addShape(newShape);
  }
}
