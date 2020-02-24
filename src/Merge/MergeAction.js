import { Action } from '../js/States/Actions/Action';
import { getAverageColor, getComplementaryColor } from '../js/Tools/general';
import { Segment } from '../js/Objects/Segment';
import { ShapeManager } from '../js/ShapeManager';

export class MergeAction extends Action {
  constructor() {
    super('MergeAction');

    // Id de la forme résultant de la fusion
    this.createdShapeId = null;

    // mode de fusion: twoShapes ou multipleShapes (si groupe lié)
    this.mode = undefined;

    // Première forme (si twoShapes)
    this.firstShapeId = null;

    // Seconde forme (si twoShapes)
    this.secondShapeId = null;

    // Id des formes fusionnées (si multipleShapes)
    this.involvedShapesIds = [];

    // Nouveaux segments de la forme (si multipleShapes)
    this.newSegments = [];
  }

  initFromObject(save) {
    this.createdShapeId = save.createdShapeId;
    if (save.mode == undefined || save.mode == 'twoShapes') {
      this.mode = 'twoShapes';
      this.firstShapeId = save.firstShapeId;
      this.secondShapeId = save.secondShapeId;
    } else {
      this.mode = 'multipleShapes';
      this.involvedShapesIds = save.involvedShapesIds;
      this.newSegments = save.newSegments;
    }
  }

  checkDoParameters() {
    if (
      (this.mode == 'twoShapes' && (!this.firstShapeId || !this.secondShapeId)) ||
      (this.mode == 'multipleShapes' && (!this.involvedShapesIds || !this.newSegments))
    ) {
      this.printIncompleteData();
      return false;
    }
    return true;
  }

  checkUndoParameters() {
    return this.checkDoParameters();
  }

  do() {
    if (!this.checkDoParameters()) return;

    if (this.mode == 'twoShapes') {
      let shape1 = ShapeManager.getShapeById(this.firstShapeId),
        shape2 = ShapeManager.getShapeById(this.secondShapeId);

      const newSegments = this.createNewSegments(shape1, shape2);

      if (!newSegments) return this.alertDigShape();
      const linkedSegments = this.linkNewSegments(newSegments);
      if (!linkedSegments) return this.alertDigShape();

      this.createNewShape(shape1, shape2, linkedSegments);
    } else {
      this.createNewShapeFromMultiple();
    }
  }

  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.createdShapeId);
    ShapeManager.deleteShape(shape);
  }

  alertDigShape() {
    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Formes creuses' } }));
    return false;
  }

  createNewSegments(shape1, shape2) {
    let segments = [shape1, shape2].map(s => s.segments.map(seg => seg.copy())).flat();

    for (let i = 0; i < segments.length; i++) {
      let seg = segments[i];
      let commonSegmentIdx = segments.findIndex(
        (segment, idx) =>
          idx != i &&
          seg.subSegments.some(subseg =>
            segment.subSegments.some(subseg2 => subseg.equal(subseg2)),
          ),
      );
      if (commonSegmentIdx == -1) continue;
      let commonSegment = segments[commonSegmentIdx];
      let junction = seg.subSegments
        .filter(subseg => commonSegment.subSegments.some(subseg2 => subseg.equal(subseg2)))
        .sort((seg1, seg2) => (seg1.length < seg2.length ? 1 : -1))[0];
      !commonSegment.hasSameDirection(seg) && commonSegment.reverse();
      !junction.hasSameDirection(seg) && junction.reverse();
      let createdSegments = [];
      if (!seg.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(new Segment(seg.vertexes[0], junction.vertexes[0]));
      if (!seg.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(new Segment(seg.vertexes[1], junction.vertexes[1]));
      if (!commonSegment.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(new Segment(commonSegment.vertexes[0], junction.vertexes[0]));
      if (!commonSegment.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(new Segment(commonSegment.vertexes[1], junction.vertexes[1]));
      let indexToRemove = [i, commonSegmentIdx].sort((idx1, idx2) => idx1 - idx2);
      segments.splice(indexToRemove[1], 1);
      segments.splice(indexToRemove[0], 1, ...createdSegments);
      i = -1;
    }

    return segments;
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
    newShape.id = this.createdShapeId;
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
    ShapeManager.addShape(newShape);
  }

  createNewShapeFromMultiple() {
    let involvedShapes = this.involvedShapesIds.map(id => ShapeManager.getShapeById(id));
    let newShape = involvedShapes[0].copy();
    newShape.id = this.createdShapeId;
    newShape.name = 'Custom';
    newShape.familyName = 'Custom';
    newShape.color = getAverageColor(...involvedShapes.map(s => s.color));
    newShape.second_color = getComplementaryColor(newShape.color);
    newShape.borderColor = getAverageColor(...involvedShapes.map(s => s.borderColor));
    newShape.isCenterShown = false;
    newShape.opacity =
      involvedShapes.map(s => s.opacity).reduce((acc, value) => acc + value) /
      involvedShapes.length;
    newShape.isBiface = involvedShapes.some(s => s.isBiface);
    newShape.isReversed = involvedShapes.some(s => s.isReversed);
    newShape.setSegments(this.newSegments);
    newShape.coordinates = { x: newShape.x - 20, y: newShape.y - 20 };
    if (newShape.isCircle()) newShape.isCenterShown = true;
    ShapeManager.addShape(newShape);
  }
}