import { Action } from '../Core/States/Action';
import { getAverageColor } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { app } from '../Core/App';

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
      this.path = save.path;
    }
  }

  /**
   * vérifie si toutes les conditions sont réunies pour effectuer l'action
   */
  checkDoParameters() {
    // if (
    //   (this.mode == 'twoShapes' &&
    //     (!this.firstShapeId || !this.secondShapeId)) ||
    //   (this.mode == 'multipleShapes' &&
    //     (!this.involvedShapesIds || !this.newSegments))
    // ) {
    //   this.printIncompleteData();
    //   return false;
    // }
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

      this.createNewShape(path, shape1, shape2);
    } else {
      let shapes = this.involvedShapesIds.map(id =>
        app.mainDrawingEnvironment.findObjectById(id)
      );
      this.createNewShape(this.path, ...shapes);
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
        arcCenterCoordinates: seg.arcCenter?.coordinates,
        counterclockwise: seg.counterclockwise,
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
        arcCenterCoordinates: seg.arcCenter?.coordinates,
        counterclockwise: seg.counterclockwise,
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
                arcCenterCoordinates: firstSegment.arcCenter?.coordinates,
                counterclockwise: firstSegment.counterclockwise,
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
                arcCenterCoordinates: firstSegment.arcCenter?.coordinates,
                counterclockwise: firstSegment.counterclockwise,
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
                arcCenterCoordinates: firstSegment.arcCenter?.coordinates,
                counterclockwise: firstSegment.counterclockwise,
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
                arcCenterCoordinates: firstSegment.arcCenter?.coordinates,
                counterclockwise: firstSegment.counterclockwise,
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
    // todo à changer si on peut faire des arcs de cercles concaves
    if (firstSegment.isArc() || secondSegment.isArc()) return null;
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

    let nextSegmentIndex = 0;
    this.addPathElem(path, segmentsList[0]);
    this.lastUsedCoordinates = segmentsList[0].vertexes[1].coordinates;
    segmentsList.splice(nextSegmentIndex, 1);
    segmentUsed++;

    while (!this.lastUsedCoordinates.equal(startCoordinates)) {
      const potentialSegmentIdx = segmentsList
        .map((seg, idx) =>
          seg.contains(this.lastUsedCoordinates, false) ? idx : undefined
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
      let mustReverse = false;
      if (
        !nextSegment.vertexes[0].coordinates.equal(this.lastUsedCoordinates)
      ) {
        mustReverse = true;
      }
      this.addPathElem(path, nextSegment, mustReverse);
      // path.push('L', this.lastUsedCoordinates.x, this.lastUsedCoordinates.y);
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

  addPathElem(path, segment, mustReverse) {
    let firstCoord = segment.vertexes[0].coordinates;
    let secondCoord = segment.vertexes[1].coordinates;
    if (mustReverse) [firstCoord, secondCoord] = [secondCoord, firstCoord];
    this.lastUsedCoordinates = secondCoord;
    if (!segment.isArc()) {
      path.push('L', secondCoord.x, secondCoord.y);
    } else {
      let centerCoordinates = segment.arcCenter.coordinates;
      let radius = centerCoordinates.dist(secondCoord),
        firstAngle = centerCoordinates.angleWith(firstCoord),
        secondAngle = centerCoordinates.angleWith(secondCoord);

      if (secondAngle < firstAngle) secondAngle += 2 * Math.PI;
      let largeArcFlag = secondAngle - firstAngle > Math.PI ? 1 : 0,
        sweepFlag = 1;
      if (segment.counterclockwise) {
        sweepFlag = Math.abs(sweepFlag - 1);
        largeArcFlag = Math.abs(largeArcFlag - 1);
      }
      if (mustReverse) {
        sweepFlag = Math.abs(sweepFlag - 1);
        largeArcFlag = Math.abs(largeArcFlag - 1);
      }
      path.push(
        'A',
        radius,
        radius,
        0,
        largeArcFlag,
        sweepFlag,
        secondCoord.x,
        secondCoord.y
      );
    }
  }

  /**
   * crée la forme fusionnée et l'ajoute au workspace
   * @param {String} path
   * @param {Shape} shapes            les formes a fusionner
   */
  createNewShape(path, ...shapes) {
    let newShape = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: path,
      name: 'Custom',
      familyName: 'Custom',
      color: getAverageColor(...shapes.map(s => s.color)),
      borderColor: getAverageColor(...shapes.map(s => s.borderColor)),
      opacity:
        shapes.map(s => s.opacity).reduce((acc, value) => acc + value) /
        shapes.length,
      isBiface: shapes.some(s => s.isBiface),
      isReversed: shapes.some(s => s.isReversed),
    });
    newShape.cleanSameDirectionSegment();
    newShape.translate({ x: -20, y: -20 });
  }
}
