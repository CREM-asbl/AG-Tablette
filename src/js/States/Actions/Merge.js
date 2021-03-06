import { app } from '../../App';
import { Action } from './Action';
import { getAverageColor, getComplementaryColor } from '../../Tools/general';
import { Segment } from '../../Objects/Segment';

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
      createdShapeId: this.createdShapeId,
    };
    return save;
  }

  initFromObject(save) {
    this.firstShapeId = save.firstShapeId;
    this.secondShapeId = save.secondShapeId;
    this.createdShapeId = save.createdShapeId;
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

    if (!newSegments) return this.alertDigShape();
    const linkedSegments = this.linkNewSegments(newSegments);
    if (!linkedSegments) return this.alertDigShape();

    this.createNewShape(shape1, shape2, linkedSegments);
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
        .map((seg, i) => {
          if (subSegments[i].some(subseg => subSegments[idx].some(subs => subs.equal(subseg)))) {
            return i;
          } else return -1;
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
        vertexes.sort((v1, v2) =>
          v1.x - v2.x > 0.1 || (Math.abs(v1.x - v2.x) < 0.1 && v1.y > v2.y) ? 1 : -1,
        ); // imprécision : 0.1 comme limite d'égalité
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

  linkNewSegments(segmentsList) {
    // Todo : Voir si on ne peut pas la simplifier
    let newSegments = [];

    let currentSegment = segmentsList[0].copy(false);
    let firstSegment = currentSegment;
    let nextSegment;
    let segmentUsed = 0;

    newSegments.push(currentSegment);
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
      if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1])) nextSegment.reverse(true);

      if (currentSegment.hasSameDirection(nextSegment, 1, 0, false)) {
        currentSegment.vertexes[1] = nextSegment.vertexes[1];
      } else {
        newSegments.push(nextSegment);
      }
      segmentUsed++;
      currentSegment = nextSegment;
    }
    if (segmentUsed != segmentsList.length) {
      console.log('shape is dig (not all segments have been used)');
      return null;
    }
    if (newSegments.length != 1 && currentSegment.hasSameDirection(firstSegment, 1, 0, false)) {
      newSegments[0].vertexes[0] = newSegments.pop().vertexes[0];
    }
    return newSegments;
  }

  createNewShape(shape1, shape2, newSegments) {
    let newShape = shape1.copy();
    if (this.createdShapeId) newShape.id = this.createdShapeId;
    else this.createdShapeId = newShape.id;
    newShape.name = 'Custom';
    newShape.familyName = 'Custom';
    newShape.color = getAverageColor(shape1.color, shape2.color);
    newShape.second_color = getComplementaryColor(newShape.color);
    newShape.borderColor = getAverageColor(shape1.borderColor, shape2.borderColor);
    newShape.isCenterShown = false;
    newShape.opacity = (shape1.opacity + shape2.opacity) / 2;
    newShape.isBiface = shape1.isBiface && shape2.isBiface;
    newShape.isReversed = shape1.isReversed && shape2.isReversed;
    newShape.setSegments(newSegments);
    newShape.coordinates = { x: newShape.x - 20, y: newShape.y - 20 };
    if (newShape.isCircle()) newShape.isCenterShown = true;
    app.workspace.addShape(newShape);
  }
}
