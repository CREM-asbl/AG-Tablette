import { Action } from '../Core/States/Action';
import { getAverageColor } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';

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

      const path = this.linkNewSegments(newSegments);
      if (!path) return this.alertDigShape();

      this.createNewShape(shape1, shape2, path);
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
   * @param {Shape} shape1 la premiere forme à fusionner
   * @param {Shape} shape2 la seconde forme à fusionner
   * @returns {Segment[]}  les segments temporaires (ni fusionnés ni ordonnés)
   */
  createNewSegments(shape1, shape2) {
    let segments1 = shape1.segments.map(seg => {
      let segmentCopy = new Segment({
        drawingEnvironment: app.invisibleDrawingEnvironment,
        createFromNothing: true,
        vertexCoordinates: seg.vertexes.map(v => v.coordinates),
        divisionPointInfos: seg.divisionPoints.map(d => {
          return { coordinates: d.coordinates, ratio: d.ratio };
        }),
      });
      return segmentCopy;
    });
    let segments2 = shape2.segments.map(seg => {
      let segmentCopy = new Segment({
        drawingEnvironment: app.invisibleDrawingEnvironment,
        createFromNothing: true,
        vertexCoordinates: seg.vertexes.map(v => v.coordinates),
        divisionPointInfos: seg.divisionPoints.map(d => {
          return { coordinates: d.coordinates, ratio: d.ratio };
        }),
      });
      return segmentCopy;
    });
    segments1.forEach(seg => seg.sortDivisionPoints());
    segments2.forEach(seg => seg.sortDivisionPoints());

    for (let i = 0; i < segments1.length; i++) {
      for (let j = 0; j < segments2.length; j++) {
        let firstSegment = segments1[i];
        let secondSegment = segments2[j];
        if (
          Math.abs(
            firstSegment.getAngleWithHorizontal() -
              secondSegment.getAngleWithHorizontal()
          ) > 0.01
        ) {
          secondSegment.reverse();
        }
        let commonCoordinates = this.getCommonCoordinates(
          firstSegment,
          secondSegment
        );
        if (commonCoordinates) {
          // todo: quand on crée un nouveau segment, copier les points de division de son modele
          // si on veut faire la fusion d'un groupe
          if (
            !firstSegment.vertexes[0].coordinates.equal(commonCoordinates[0])
          ) {
            segments1.push(
              new Segment({
                drawingEnvironment: app.invisibleDrawingEnvironment,
                createFromNothing: true,
                vertexCoordinates: [
                  firstSegment.vertexes[0].coordinates,
                  commonCoordinates[0],
                ],
              })
            );
          }
          if (
            !firstSegment.vertexes[1].coordinates.equal(commonCoordinates[1])
          ) {
            segments1.push(
              new Segment({
                drawingEnvironment: app.invisibleDrawingEnvironment,
                createFromNothing: true,
                vertexCoordinates: [
                  commonCoordinates[1],
                  firstSegment.vertexes[1].coordinates,
                ],
              })
            );
          }
          if (
            !secondSegment.vertexes[0].coordinates.equal(commonCoordinates[0])
          ) {
            segments2.push(
              new Segment({
                drawingEnvironment: app.invisibleDrawingEnvironment,
                createFromNothing: true,
                vertexCoordinates: [
                  secondSegment.vertexes[0].coordinates,
                  commonCoordinates[0],
                ],
              })
            );
          }
          if (
            !secondSegment.vertexes[1].coordinates.equal(commonCoordinates[1])
          ) {
            segments2.push(
              new Segment({
                drawingEnvironment: app.invisibleDrawingEnvironment,
                createFromNothing: true,
                vertexCoordinates: [
                  commonCoordinates[1],
                  secondSegment.vertexes[1].coordinates,
                ],
              })
            );
          }
          segments1.splice(i, 1);
          segments2.splice(j, 1);
          i = -1;
          break;
        }
      }
    }
    let segments = [...segments1, ...segments2];
    return segments;
  }

  getCommonCoordinates(firstSegment, secondSegment) {
    let firstCommonCoordinates = null;
    let secondCommonCoordinates = null;
    [
      firstSegment.vertexes[0],
      ...firstSegment.divisionPoints,
      firstSegment.vertexes[1],
    ].forEach(pt1 => {
      [
        secondSegment.vertexes[0],
        ...secondSegment.divisionPoints,
        secondSegment.vertexes[1],
      ].forEach(pt2 => {
        if (pt1.coordinates.equal(pt2.coordinates)) {
          if (firstCommonCoordinates == null) {
            firstCommonCoordinates = pt1.coordinates;
          } else {
            secondCommonCoordinates = pt1.coordinates;
          }
        }
      });
    });
    if (firstCommonCoordinates != null && secondCommonCoordinates != null)
      return [firstCommonCoordinates, secondCommonCoordinates];
    else return null;
  }

  /**
   * Crée les segments définitifs de la forme fusionnée
   * @param {Segment[]} segmentsList   les segments à modifier
   * @returns {Segment[]}              les segments définitifs
   */
  linkNewSegments(segmentsList) {
    let startCoordinates = segmentsList[0].vertexes[0].coordinates;
    let path = ['M', startCoordinates.x, startCoordinates.y];
    let segmentUsed = 0;
    let numberOfSegments = segmentsList.length;
    let currentCoordinates;

    let nextSegmentIndex = 0;
    let nextCoordinates = segmentsList[0].vertexes[1].coordinates;
    path.push('L', nextCoordinates.x, nextCoordinates.y);
    segmentsList.splice(nextSegmentIndex, 1);
    segmentUsed++;

    while (!nextCoordinates.equal(startCoordinates)) {
      currentCoordinates = nextCoordinates;
      const potentialSegmentIdx = segmentsList
        .map((seg, idx) =>
          seg.contains(currentCoordinates, false) ? idx : undefined
        )
        .filter(seg => Number.isInteger(seg));
      if (potentialSegmentIdx.length != 1) {
        if (potentialSegmentIdx.length == 0)
          console.warn('shape cannot be closed (dead end)');
        else
          console.warn(
            'shape is dig (a segment has more than one segment for next)'
          );
        return null;
      }
      nextSegmentIndex = potentialSegmentIdx[0];
      let nextSegment = segmentsList[nextSegmentIndex];
      if (nextSegment.vertexes[0].coordinates.equal(currentCoordinates)) {
        nextCoordinates = nextSegment.vertexes[1].coordinates;
      } else {
        nextCoordinates = nextSegment.vertexes[0].coordinates;
      }
      path.push('L', nextCoordinates.x, nextCoordinates.y);
      segmentsList.splice(nextSegmentIndex, 1);
      segmentUsed++;
    }

    if (segmentUsed != numberOfSegments) {
      // si tous les segments n'ont pas été utilisés, la forme créée est creuse
      console.warn('shape is dig (not all segments have been used)');
      return null;
    }

    path = path.join(' ');

    return path;
  }

  /**
   * crée la forme fusionnée et l'ajoute au workspace
   * @param {Shape} shape1            la premiere forme a fusionner
   * @param {Shape} shape2            la seconde forme a fusionner
   * @param {String} path
   */
  createNewShape(shape1, shape2, path) {
    let newShape = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: path,
      name: 'Custom',
      familyName: 'Custom',
      color: getAverageColor(shape1.color, shape2.color),
      borderColor: getAverageColor(shape1.borderColor, shape2.borderColor),
      opacity: (shape1.opacity + shape2.opacity) / 2,
      isBiface: shape1.isBiface && shape2.isBiface,
      isReversed: shape1.isReversed && shape2.isReversed,
    });
    newShape.cleanSameDirectionSegment();
    newShape.translate({ x: -20, y: -20 });
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
