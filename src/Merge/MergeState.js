import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Segment } from '../Core/Objects/Segment';
import { Shape } from '../Core/Objects/Shape';

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeState extends State {
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
    this.currentStep = 'listen-canvas-click';
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.currentStep == 'selecting-second-shape')
      app.mainDrawingEnvironment.editingShapeIds = [this.firstShapeId];
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (this.status != 'paused') {
      this.currentStep = 'listen-canvas-click';
      app.mainDrawingEnvironment.editingShapeIds = [];
      app.upperDrawingEnvironment.removeAllObjects();
    }
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    let mustExecuteAction = false;
    if (this.currentStep == 'listen-canvas-click') {
      this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
      if (this.involvedShapes.length > 1) {
        // execute a groupMerge if possible
        const path = this.getPathFromGroup();
        if (path) {
          this.actions = [
            {
              name: 'MergeAction',
              mode: 'multipleShapes',
              involvedShapesIds: this.involvedShapes.map(s => s.id),
              path: path,
            },
          ];
          mustExecuteAction = true;
        }
      }
      if (!mustExecuteAction) {
        this.currentStep = 'selecting-second-shape';
        this.firstShapeId = shape.id;
        app.mainDrawingEnvironment.editingShapeIds = [this.firstShapeId];
        this.drawingShapes = new Shape({
          ...shape,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: shape.getSVGPath('no scale'),
          id: undefined,
          borderColor: '#E90CC8',
          borderSize: 3,
        });
      }
    } else if (this.currentStep == 'selecting-second-shape') {
      if (this.firstShapeId == shape.id) {
        // deselect firstShape
        this.currentStep = 'listen-canvas-click';
        this.firstShapeId = null;
        app.mainDrawingEnvironment.editingShapeIds = [];
      } else {
        this.secondShapeId = shape.id;
        this.actions = [
          {
            name: 'MergeAction',
            mode: 'twoShapes',
            firstShapeId: this.firstShapeId,
            secondShapeId: this.secondShapeId,
          },
        ];
        mustExecuteAction = true;
      }
    }

    if (mustExecuteAction) {
      if (this.actions[0].mode == 'twoShapes') {
        let firstShape = app.mainDrawingEnvironment.findObjectById(
          this.firstShapeId
        );
        let secondShape = app.mainDrawingEnvironment.findObjectById(
          this.secondShapeId
        );

        if (firstShape.getCommonsCoordinates(secondShape).length < 2) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message: "Il n'y a pas de segment commun entre les formes.",
              },
            })
          );
          return;
        }

        if (firstShape.overlapsWith(secondShape)) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: { message: 'Les formes se superposent.' },
            })
          );
          return;
        }
      }

      this.executeAction();
      this.restart();
    }
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  getPathFromGroup() {
    let segmentsList = this.checkGroupMerge(this.involvedShapes);

    if (!segmentsList)
      return null;

    let path = this.linkNewSegments(segmentsList);

    return path;
  }

  checkGroupMerge(shapes) {
    // check if a shape overlaps another one
    if (
      shapes.some(shape =>
        shapes.some(s => {
          if (s.id == shape.id) return false;
          else return s.overlapsWith(shape);
        })
      )
    )
      return null;

    let oldSegments = shapes
      .map(s =>
        s.segments.map(seg => {
          return new Segment({
            drawingEnvironment: app.invisibleDrawingEnvironment,
            createFromNothing: true,
            vertexCoordinates: seg.vertexes.map(vx => vx.coordinates),
            divisionPointInfos: seg.divisionPoints.map(dp => {
              return { coordinates: dp.coordinates, ratio: dp.ratio };
            }),
          });
        })
      )
      .flat();

    let cutSegments = oldSegments
      .map((segment, idx, segments) => {
        let pointsInside = segments
          .filter((seg, i) => i != idx)
          .map(seg =>
            seg.points.filter(pt1 =>
              segment.divisionPoints.some(pt2 =>
                pt1.coordinates.equal(pt2.coordinates)
              )
            )
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
        .map(segment => (segment.equal(seg) ? segment : undefined))
        .filter(Boolean);
      if (segs.length == 1) newSegments.push(seg);
      else segs.forEach(seg => (seg.used = true));
    });

    return newSegments;
  }

  linkNewSegments(segmentsList) {
    let path = [];
    let segmentUsed = 0;

    let startCoordinates = segmentsList[0].vertexes[0].coordinates;
    path.push('M', startCoordinates.x, startCoordinates.y);

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
      segmentsList.splice(nextSegmentIndex, 1);
      segmentUsed++;
    }

    if (segmentsList.length > 0)
      return null;

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
        secondCoord.y
      );
    }
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    // if (this.currentStep == 'selecting-second-shape') {
    //   const shape = this.firstShape,
    //     borderColor = shape.borderColor;
    //   shape.borderColor = '#E90CC8';
    //   window.dispatchEvent(
    //     new CustomEvent('draw-shape', {
    //       detail: { shape: shape, borderSize: 3 },
    //     })
    //   );
    //   shape.borderColor = borderColor;
    // }
  }
}
