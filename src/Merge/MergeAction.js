import { Action } from '../Core/States/Action';
import { getAverageColor } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';

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

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    if (
      (this.mode == 'twoShapes' &&
        (!this.firstShapeId || !this.secondShapeId)) ||
      (this.mode == 'multipleShapes' &&
        (!this.involvedShapesIds || !this.newSegments))
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
    return this.checkDoParameters();
  }

  /**
   * effectuer l'action en cours, appelé par un state ou l'historique
   */
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

  /**
   * annuler l'action précédente, appelé par l'historique
   */
  undo() {
    if (!this.checkUndoParameters()) return;

    let shape = ShapeManager.getShapeById(this.createdShapeId);
    ShapeManager.deleteShape(shape);
  }

  alertDigShape() {
    window.dispatchEvent(
      new CustomEvent('show-notif', {
        detail: { message: 'La fusion crée une forme creuse.' },
      })
    );
    return false;
  }

  /**
   * Check if all the shapes of the group can be merged
   * @returns {Segment[]}  les segments temporaires (ni fusionnés ni ordonnés)
   */

  /**
   *
   * @param {*} shape1 la premiere forme à fusionner
   * @param {*} shape2 la seconde forme à fusionner
   * @returns {Segment[]}  les segments temporaires (ni fusionnés ni ordonnés)
   */
  createNewSegments(shape1, shape2) {
    let segments = [shape1, shape2]
      .map(s => s.segments.map(seg => seg.copy()))
      .flat();

    for (let i = 0; i < segments.length; i++) {
      let seg = segments[i];
      let commonSegmentIdx = segments.findIndex(
        (segment, idx) =>
          idx != i &&
          seg.subSegments.some(subseg =>
            segment.subSegments.some(subseg2 => subseg.equal(subseg2))
          )
      );
      if (commonSegmentIdx == -1) continue;
      let commonSegment = segments[commonSegmentIdx];
      let junction = seg.subSegments
        .filter(subseg =>
          commonSegment.subSegments.some(subseg2 => subseg.equal(subseg2))
        )
        .sort((seg1, seg2) => (seg1.length < seg2.length ? 1 : -1))[0];
      !commonSegment.hasSameDirection(seg) && commonSegment.reverse();
      !junction.hasSameDirection(seg) && junction.reverse();
      let createdSegments = [];
      if (!seg.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(
          new Segment(seg.vertexes[0], junction.vertexes[0])
        );
      if (!seg.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(
          new Segment(seg.vertexes[1], junction.vertexes[1])
        );
      if (!commonSegment.vertexes[0].equal(junction.vertexes[0]))
        createdSegments.push(
          new Segment(commonSegment.vertexes[0], junction.vertexes[0])
        );
      if (!commonSegment.vertexes[1].equal(junction.vertexes[1]))
        createdSegments.push(
          new Segment(commonSegment.vertexes[1], junction.vertexes[1])
        );
      let indexToRemove = [i, commonSegmentIdx].sort(
        (idx1, idx2) => idx1 - idx2
      );
      segments.splice(indexToRemove[1], 1);
      segments.splice(indexToRemove[0], 1, ...createdSegments);
      i = -1;
    }

    return segments;
  }

  /**
   * Crée les segments définitifs de la forme fusionnée
   * @param {Segment[]} segmentsList   les segments à modifier
   * @returns {Segment[]}              les segments définitifs
   */
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
        seg =>
          !seg.equal(currentSegment) &&
          seg.contains(currentSegment.vertexes[1], false)
      );
      if (newPotentialSegments.length != 1) {
        if (newPotentialSegments.length == 0)
          console.log('shape cannot be closed (dead end)');
        else
          console.log(
            'shape is dig (a segment has more than one segment for next)'
          );
        return null;
      }
      nextSegment = newPotentialSegments[0].copy(false);
      if (nextSegment.vertexes[1].equal(currentSegment.vertexes[1]))
        nextSegment.reverse(true);

      if (currentSegment.hasSameDirection(nextSegment, 1, 0, false)) {
        currentSegment.vertexes[1] = nextSegment.vertexes[1];
      } else {
        newSegments.push(nextSegment);
      }
      segmentUsed++;
      currentSegment = nextSegment;
    }

    if (segmentUsed != segmentsList.length) {
      // si tous les segments n'ont pas été utilisés, la forme créée est creuse
      console.log('shape is dig (not all segments have been used)');
      return null;
    }

    if (
      newSegments.length != 1 &&
      currentSegment.hasSameDirection(firstSegment, 1, 0, false)
    ) {
      // fusion dernier et premier segment s'ils sont alignés
      newSegments[0].vertexes[0] = newSegments.pop().vertexes[0];
    }
    return newSegments;
  }

  /**
   * crée la forme fusionnée et l'ajoute au workspace
   * @param {Shape} shape1            la premiere forme a fusionner
   * @param {Shape} shape2            la seconde forme a fusionner
   * @param {Segment[]} newSegments   les segments de la nouvelle forme
   */
  createNewShape(shape1, shape2, newSegments) {
    let newShape = new Shape({
      segments: newSegments,
      name: 'Custom',
      familyName: 'Custom',
      id: this.createdShapeId,
      color: getAverageColor(shape1.color, shape2.color),
      borderColor: getAverageColor(shape1.borderColor, shape2.borderColor),
      opacity: (shape1.opacity + shape2.opacity) / 2,
      isBiface: shape1.isBiface && shape2.isBiface,
      isReversed: shape1.isReversed && shape2.isReversed,
    });
    newShape.translate(-20, -20);
    ShapeManager.addShape(newShape);
  }

  /**
   * crée la forme fusionnée à partir de plusieurs formes et l'ajoute au workspace
   */
  createNewShapeFromMultiple() {
    let involvedShapes = this.involvedShapesIds.map(id =>
      ShapeManager.getShapeById(id)
    );
    let newShape = new Shape({
      segments: this.newSegments,
      name: 'Custom',
      familyName: 'Custom',
      id: this.createdShapeId,
      color: getAverageColor(...involvedShapes.map(s => s.color)),
      borderColor: getAverageColor(...involvedShapes.map(s => s.borderColor)),
      opacity:
        involvedShapes.map(s => s.opacity).reduce((acc, value) => acc + value) /
        involvedShapes.length,
      isBiface: involvedShapes.some(s => s.isBiface),
      isReversed: involvedShapes.some(s => s.isReversed),
    });
    newShape.translate(-20, -20);
    ShapeManager.addShape(newShape);
  }
}
