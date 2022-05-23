import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Tool } from '../Core/States/Tool';
import { getAverageColor } from '../Core/Tools/general';

/**
 * Fusionner 2 figures en une nouvelle figure
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
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        fusionner deux figures ayant au moins un côté commun en une seule figure.
        Une nouvelle figure (le fruit de la fusion) est créée, et les deux figures
        d'origine restent intactes.<br />

        Pour fusionner les deux figures, touchez la première figure puis la
        seconde.<br /><br />

        <b>Note:</b> pour qu'une fusion entre deux figures soit possible, il faut
        que les deux figures aient au moins un segment en commun (un côté entier,
        ou une partie d'un côté). Il ne faut pas que les deux figures se
        chevauchent pour que la fusion puisse être réalisée.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
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
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure a été sélectionnée (onClick)
   */
  objectSelected(shape) {
    let mustExecuteAction = false;
    if (app.tool.currentStep == 'listen') {
      this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
      if (this.involvedShapes.length > 1) {
        this.path = this.getPathFromGroup();
        if (this.path) {
          this.mode = 'multipleShapes';
          mustExecuteAction = true;
        } else {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message: 'Le groupe ne peut pas être fusionné.',
              },
            }),
          );
          return;
        }
      } else {
        this.firstShapeId = shape.id;
        app.mainCanvasLayer.editingShapeIds = [this.firstShapeId];
        this.drawingShapes = new shape.constructor({
          ...shape,
          layer: 'upper',
          path: shape.getSVGPath('no scale'),
          id: undefined,
          strokeColor: '#E90CC8',
          strokeWidth: 3,
        });
        setState({ tool: { ...app.tool, currentStep: 'selectSecondShape' } });
      }
    } else if (app.tool.currentStep == 'selectSecondShape') {
      if (this.firstShapeId == shape.id) {
        // deselect firstShape
        this.firstShapeId = null;
        setState({ tool: { ...app.tool, currentStep: 'listen' } });
      } else {
        let group = ShapeManager.getAllBindedShapes(shape);
        if (group.length > 1) {
          let firstShape = app.mainCanvasLayer.findObjectById(
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
                  message: 'La figure ne peut pas être fusionnée au groupe',
                },
              }),
            );
            return;
          }
        } else {
          this.secondShapeId = shape.id;

          let firstShape = app.mainCanvasLayer.findObjectById(
            this.firstShapeId,
          );
          let secondShape = app.mainCanvasLayer.findObjectById(
            this.secondShapeId,
          );

          if (firstShape.getCommonsCoordinates(secondShape).length < 2) {
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: {
                  message: "Il n'y a pas de segment commun entre les figures.",
                },
              }),
            );
            return;
          }

          if (firstShape.overlapsWith(secondShape)) {
            window.dispatchEvent(
              new CustomEvent('show-notif', {
                detail: { message: 'Les figures se superposent.' },
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
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'listen' },
      });
    } else {
      // window.dispatchEvent(new CustomEvent('refresh'));
      // window.dispatchEvent(new CustomEvent('refreshUpper'));
    }
  }

  _executeAction() {
    if (this.mode == 'twoShapes') {
      let shape1 = ShapeManager.getShapeById(this.firstShapeId),
        shape2 = ShapeManager.getShapeById(this.secondShapeId);

      const newSegments = this.createNewSegments(shape1, shape2);

      const path = this.linkNewSegments(newSegments);
      if (!path) return this.alertDigShape();

      this.createNewShape(path, shape1, shape2);
    } else {
      this.createNewShape(this.path, ...this.involvedShapes);
    }
  }

  alertDigShape() {
    window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'La figure créée est creuse' } }));
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
            layer: 'invisible',
            createFromNothing: true,
            vertexCoordinates: seg.vertexes.map((vx) => vx.coordinates),
            divisionPointInfos: seg.divisionPoints.map((dp) => {
              return { coordinates: dp.coordinates, ratio: dp.ratio, color: dp.color };
            }),
            arcCenterCoordinates: seg.arcCenter?.coordinates,
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
      if (seg.used) {
        return;
      }
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
   * @returns {Segment[]}  les segments temporaires (ni fusionnés ni ordonnés)
   */
  createNewSegments(shape1, shape2) {
    let segments1 = shape1.segments.map((seg) => {
      let segmentCopy = new Segment({
        layer: 'invisible',
        createFromNothing: true,
        vertexCoordinates: seg.vertexes.map((v) => v.coordinates),
        divisionPointInfos: seg.divisionPoints.map((d) => {
          return { coordinates: d.coordinates, ratio: d.ratio, color: dp.color };
        }),
        arcCenterCoordinates: seg.arcCenter?.coordinates,
        counterclockwise: seg.counterclockwise,
      });
      return segmentCopy;
    });
    let segments2 = shape2.segments.map((seg) => {
      let segmentCopy = new Segment({
        layer: 'invisible',
        createFromNothing: true,
        vertexCoordinates: seg.vertexes.map((v) => v.coordinates),
        divisionPointInfos: seg.divisionPoints.map((d) => {
          return { coordinates: d.coordinates, ratio: d.ratio, color: dp.color };
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
        if (firstSegment.isArc() || secondSegment.isArc()) {
          continue;
        }
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
                layer: 'invisible',
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
                layer: 'invisible',
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
                layer: 'invisible',
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
                layer: 'invisible',
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
   * Crée les segments définitifs de la figure fusionnée
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
          console.info('shape cannot be closed (dead end)');
        else
          console.info(
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
      // si tous les segments n'ont pas été utilisés, la figure créée est creuse
      console.info('shape is dig (not all segments have been used)');
      return null;
    }

    path = path.join(' ');

    return path;
  }

  addPathElem(path, segment, mustReverse) {
    let firstCoord = segment.vertexes[0].coordinates;
    let secondCoord = segment.vertexes[1].coordinates;
    if (!segment.isArc()) {
      if (mustReverse) [firstCoord, secondCoord] = [secondCoord, firstCoord];
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
        [firstCoord, secondCoord] = [secondCoord, firstCoord];
        sweepFlag = Math.abs(sweepFlag - 1);
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
    this.lastUsedCoordinates = secondCoord;
  }

  /**
   * crée la figure fusionnée et l'ajoute au workspace
   * @param {String} path
   */
  createNewShape(path, ...shapes) {
    let newShape = new shapes[0].constructor({
      layer: 'main',
      path: path,
      name: 'Custom',
      familyName: 'Custom',
      fillColor: getAverageColor(...shapes.map((s) => s.fillColor)),
      strokeColor: getAverageColor(...shapes.map((s) => s.strokeColor)),
      fillOpacity:
        shapes.map((s) => s.fillOpacity).reduce((acc, value) => acc + value) /
        shapes.length,
      isBiface: shapes.some((s) => s.isBiface),
      // isReversed: shapes.some((s) => s.isReversed),
    });
    newShape.cleanSameDirectionSegment();
    newShape.translate({ x: -20, y: -20 });
  }
}
