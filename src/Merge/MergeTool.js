import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';
import { getAverageColor } from '../Core/Tools/general';

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeTool extends Tool {
  constructor() {
    super('merge', 'Fusionner', 'operation');

    // listen-canvas-click -> selecting-second-shape
    this.currentStep = null;

    this.firstShape = null;

    this.secondShape = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    const toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        fusionner deux formes ayant au moins un côté commun en une seule forme.
        Une nouvelle forme (le fruit de la fusion) est créée, et les deux formes
        d'origine restent intactes.<br />

        Pour fusionner les deux formes, touchez la première forme puis la
        seconde.<br /><br />

        <b>Note:</b> pour qu'une fusion entre deux formes soit possible, il faut
        que les deux formes aient au moins un segment en commun (un côté entier,
        ou une partie d'un côté). Il ne faut pas que les deux formes se
        chevauchent pour que la fusion puisse être réalisée.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectSecondShape() {
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    let mustExecuteAction = false;
    if (app.tool.currentStep == 'start') {
      this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
      if (this.involvedShapes.length > 1) {
        this.path = this.getPathFromGroup();
        if (this.path) {
          this.mode = 'multipleShapes';
          mustExecuteAction = true;
        } else {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message: 'Le groupe ne peut pas être fusionné',
              },
            }),
          );
          return;
        }
      } else {
        this.firstShapeId = shape.id;
        app.mainDrawingEnvironment.editingShapeIds = [this.firstShapeId];
        setState({ tool: { ...app.tool, currentStep: 'selectSecondShape' } });
        this.drawingShapes = new Shape({
          ...shape,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: shape.getSVGPath('no scale'),
          id: undefined,
          borderColor: '#E90CC8',
          borderSize: 3,
        });
      }
    } else if (app.tool.currentStep == 'selectSecondShape') {
      if (this.firstShapeId == shape.id) {
        // deselect firstShape
        setState({ tool: { ...app.tool, currentStep: 'start' } });
        this.firstShapeId = null;
      } else {
        let group = ShapeManager.getAllBindedShapes(shape, true);
        if (group.length > 1) {
          let firstShape = app.mainDrawingEnvironment.findObjectById(
            this.firstShapeId,
          );
          this.involvedShapes = [...group, firstShape];
          const path = this.getPathFromGroup();
          if (path) {
            this.mode = 'multipleShapes';
            mustExecuteAction = true;
          } else {
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: {
                  message: 'La forme ne peut pas être fusionnée au groupe',
                },
              }),
            );
            return;
          }
        } else {
          this.secondShapeId = shape.id;

          let firstShape = app.mainDrawingEnvironment.findObjectById(
            this.firstShapeId,
            );
          let secondShape = app.mainDrawingEnvironment.findObjectById(
            this.secondShapeId,
          );

          if (firstShape.getCommonsCoordinates(secondShape).length < 2) {
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: {
                  message: "Il n'y a pas de segment commun entre les formes.",
                },
              }),
            );
            return;
          }

          if (firstShape.overlapsWith(secondShape)) {
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: { message: 'Les formes se superposent.' },
              }),
            );
            return;
          }

          this.mode = 'twoShapes';
          mustExecuteAction = true;
        }
      }
    }

    if (mustExecuteAction) {
      this.executeAction();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'start' } });
    } else {
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
    }

  }

   _executeAction() {
    if (this.mode == 'twoShapes') {
      let shape1 = ShapeManager.getShapeById(this.firstShapeId),
        shape2 = ShapeManager.getShapeById(this.secondShapeId);

      const newSegments = this.createNewSegments(shape1, shape2);
      if (!newSegments) return this.alertDigShape();

      const path = this.linkNewSegments(newSegments);
      if (!path) return this.alertDigShape();

      this.createNewShape(path, shape1, shape2);
    } else {
      this.createNewShape(this.path, ...this.involvedShapes);
    }
  }

  getPathFromGroup() {
    let segmentsList = this.checkGroupMerge(this.involvedShapes);

    if (!segmentsList) return null;

    let path = this.linkNewSegments(segmentsList);

    return path;
  }

  checkGroupMerge(shapes) {
    // check if a shape overlaps another one
    if (
      shapes.some((shape) =>
        shapes.some((s) => {
          if (s.id == shape.id) return false;
          else return s.overlapsWith(shape);
        }),
      )
    )
      return null;

    let oldSegments = shapes
      .map((s) =>
        s.segments.map((seg) => {
          return new Segment({
            drawingEnvironment: app.invisibleDrawingEnvironment,
            createFromNothing: true,
            vertexCoordinates: seg.vertexes.map((vx) => vx.coordinates),
            divisionPointInfos: seg.divisionPoints.map((dp) => {
              return { coordinates: dp.coordinates, ratio: dp.ratio };
            }),
          });
        }),
      )
      .flat();

    let cutSegments = oldSegments
      .map((segment, idx, segments) => {
        let pointsInside = segments
          .filter((seg, i) => i != idx)
          .map((seg) =>
            seg.points.filter((pt1) =>
              segment.divisionPoints.some((pt2) =>
                pt1.coordinates.equal(pt2.coordinates),
              ),
            ),
          )
          .flat()
          .filter((pt, idx, pts) => {
            for (let i = idx + 1; i < pts.length; i++) {
              if (pts[i].coordinates.equal(pt.coordinates)) return false;
            }
            return true;
          });
        if (pointsInside.length) return segment.divideWith(pointsInside);
        else return segment;
      })
      .flat();

    // delete common segments
    let newSegments = [];
    cutSegments.forEach((seg, i, segments) => {
      if (seg.used) return;
      let segs = segments
        .map((segment) => (segment.equal(seg) ? segment : undefined))
        .filter(Boolean);
      if (segs.length == 1) newSegments.push(seg);
      else segs.forEach((seg) => (seg.used = true));
    });

    return newSegments;
  }

  /**
   *
   * @param {Shape} shape1 la premiere forme à fusionner
   * @param {Shape} shape2 la seconde forme à fusionner
   * @returns {Segment[]}  les segments temporaires (ni fusionnés ni ordonnés)
   */
  createNewSegments(shape1, shape2) {
    let segments1 = shape1.segments.map((seg) => {
      let segmentCopy = new Segment({
        drawingEnvironment: app.invisibleDrawingEnvironment,
        createFromNothing: true,
        vertexCoordinates: seg.vertexes.map((v) => v.coordinates),
        divisionPointInfos: seg.divisionPoints.map((d) => {
          return { coordinates: d.coordinates, ratio: d.ratio };
        }),
        arcCenterCoordinates: seg.arcCenter?.coordinates,
        counterclockwise: seg.counterclockwise,
      });
      return segmentCopy;
    });
    let segments2 = shape2.segments.map((seg) => {
      let segmentCopy = new Segment({
        drawingEnvironment: app.invisibleDrawingEnvironment,
        createFromNothing: true,
        vertexCoordinates: seg.vertexes.map((v) => v.coordinates),
        divisionPointInfos: seg.divisionPoints.map((d) => {
          return { coordinates: d.coordinates, ratio: d.ratio };
        }),
        arcCenterCoordinates: seg.arcCenter?.coordinates,
        counterclockwise: seg.counterclockwise,
      });
      return segmentCopy;
    });
    segments1.forEach((seg) => seg.sortDivisionPoints());
    segments2.forEach((seg) => seg.sortDivisionPoints());

    for (let i = 0; i < segments1.length; i++) {
      for (let j = 0; j < segments2.length; j++) {
        let firstSegment = segments1[i];
        let secondSegment = segments2[j];
        if (
          Math.abs(
            firstSegment.getAngleWithHorizontal() -
              secondSegment.getAngleWithHorizontal(),
          ) > 0.01
        ) {
          secondSegment.reverse();
        }
        let commonCoordinates = this.getCommonCoordinates(
          firstSegment,
          secondSegment,
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
              }),
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
              }),
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
              }),
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
              }),
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
    ].forEach((pt1) => {
      [
        secondSegment.vertexes[0],
        ...secondSegment.divisionPoints,
        secondSegment.vertexes[1],
      ].forEach((pt2) => {
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
          seg.contains(this.lastUsedCoordinates, false) ? idx : undefined,
        )
        .filter((seg) => Number.isInteger(seg));
      if (potentialSegmentIdx.length != 1) {
        if (potentialSegmentIdx.length == 0)
          console.warn('shape cannot be closed (dead end)');
        else
          console.warn(
            'shape is dig (a segment has more than one segment for next)',
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
      path.push(
        'A',
        radius,
        radius,
        0,
        largeArcFlag,
        sweepFlag,
        secondCoord.x,
        secondCoord.y,
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
      color: getAverageColor(...shapes.map((s) => s.color)),
      borderColor: getAverageColor(...shapes.map((s) => s.borderColor)),
      opacity:
        shapes.map((s) => s.opacity).reduce((acc, value) => acc + value) /
        shapes.length,
      isBiface: shapes.some((s) => s.isBiface),
      isReversed: shapes.some((s) => s.isReversed),
    });
    newShape.cleanSameDirectionSegment();
    newShape.translate({ x: -20, y: -20 });
  }
}
