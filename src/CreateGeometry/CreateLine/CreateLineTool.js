import { app } from '../../Core/App';
import { Tool } from '../../Core/States/Tool';
import { html } from 'lit-element';
import { createElem, uniqId } from '../../Core/Tools/general';
import { SelectManager } from '../../Core/Managers/SelectManager';
import { Shape } from '../../Core/Objects/Shape';
import { Segment } from '../../Core/Objects/Segment';
import { Point } from '../../Core/Objects/Point';
import { Coordinates } from '../../Core/Objects/Coordinates';
import { GeometryConstraint } from '../../Core/Objects/GeometryConstraint';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateLineTool extends Tool {
  constructor() {
    super('createLine', 'Créer une ligne', 'geometryCreator');

    // show-lines -> select-reference -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // la référence pour la contruction de parallèles ou perpendiculaires
    this.referenceId = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.currentStep = 'show-lines';

    if (!this.linesList) {
      import('./lines-list');
      this.linesList = createElem('lines-list');
    }
    this.linesList.style.display = 'flex';

    window.addEventListener('line-selected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart(manualRestart = false) {
    this.end();

    if (manualRestart || !this.lineSelected) {
      this.linesList.lineSelected = null;
      this.currentStep = 'show-lines';
    } else {
      if (
        this.lineSelected == 'StraightLine' ||
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'Segment'
      ) {
        this.points = [];
        this.segments = [];
        this.numberOfPointsDrawn = 0;
        this.getConstraints(this.numberOfPointsDrawn);
        this.currentStep = 'select-points';
        this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
      } else if (
        this.lineSelected == 'ParalleleStraightLine' ||
        this.lineSelected == 'PerpendicularStraightLine' ||
        this.lineSelected == 'ParalleleSemiStraightLine' ||
        this.lineSelected == 'PerpendicularSemiStraightLine' ||
        this.lineSelected == 'ParalleleSegment' ||
        this.lineSelected == 'PerpendicularSegment'
      ) {
        this.currentStep = 'select-reference';
        setTimeout(
          () =>
            (app.workspace.selectionConstraints =
              app.fastSelectionConstraints.click_all_segments),
        );

        setTimeout(
          () =>
            (this.objectSelectedId = app.addListener(
              'objectSelected',
              this.handler,
            )),
        );
      }
    }

    window.addEventListener('line-selected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (app.state !== this.name) {
      if (this.linesList) this.linesList.remove();
      this.linesList = null;
    }
    this.stopAnimation();
    window.removeEventListener('line-selected', this.handler);
    app.removeListener('canvasMouseDown', this.mouseDownId);
    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasMouseDown') {
      this.canvasMouseDown();
    } else if (event.type == 'canvasMouseUp') {
      this.canvasMouseUp();
    } else if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'line-selected') {
      this.setLine(event.detail.lineSelected);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  setLine(lineSelected) {
    if (lineSelected) {
      this.points = [];
      this.segments = [];
      this.numberOfPointsDrawn = 0;
      this.getConstraints(this.numberOfPointsDrawn);
      app.removeListener('canvasMouseDown', this.mouseDownId);
      app.removeListener('objectSelected', this.objectSelectedId);
      this.lineSelected = lineSelected;
      if (this.linesList) this.linesList.lineSelected = lineSelected;
      if (
        this.lineSelected == 'StraightLine' ||
        this.lineSelected == 'SemiStraightLine' ||
        this.lineSelected == 'Segment'
      ) {
        this.currentStep = 'select-points';
        this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
      } else if (
        this.lineSelected == 'ParalleleStraightLine' ||
        this.lineSelected == 'PerpendicularStraightLine' ||
        this.lineSelected == 'ParalleleSemiStraightLine' ||
        this.lineSelected == 'PerpendicularSemiStraightLine' ||
        this.lineSelected == 'ParalleleSegment' ||
        this.lineSelected == 'PerpendicularSegment'
      ) {
        this.currentStep = 'select-reference';
        setTimeout(
          () =>
            (app.workspace.selectionConstraints =
              app.fastSelectionConstraints.click_all_segments),
        );
        this.objectSelectedId = app.addListener('objectSelected', this.handler);
      }
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un segment a été sélectionné
   * @param  {Segment} segment            Le segment sélectionnée
   */
  objectSelected(segment) {
    if (this.currentStep != 'select-reference') return;

    this.referenceId = segment.id;

    new Shape({
      drawingEnvironment: app.upperDrawingEnvironment,
      path: segment.getSVGPath('scale', undefined, true),
      borderColor: app.settings.constraintsDrawColor,
      borderSize: 2,
    });

    window.dispatchEvent(new CustomEvent('refreshUpper'));

    this.currentStep = 'select-points';
    window.setTimeout(() => {
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    });
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (this.currentStep == 'select-points') {
      this.points[this.numberOfPointsDrawn] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.numberOfPointsDrawn++;
      if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
        if (this.numberOfPointsDrawn < 2) this.finishShape();
        let seg = new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          vertexIds: [this.points[0].id, this.points[1].id],
          // isInfinite: this.lineSelected.endsWith('Parallele')
        });
        if (this.lineSelected.endsWith('SemiStraightLine')) {
          seg.isSemiInfinite = true;
        } else if (this.lineSelected.endsWith('StraightLine')) {
          seg.isInfinite = true;
        }
        this.segments.push(seg);
        let shape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          borderColor: app.settings.temporaryDrawColor,
        });
        this.segments.forEach((seg, idx) => {
          seg.idx = idx;
          seg.shapeId = shape.id;
        });
      }
      app.removeListener('canvasMouseDown', this.mouseDownId);
      this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
      this.animate();
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.actions = [
        {
          name: 'CreateLineAction',
          coordinates: this.points.map((pt) => pt.coordinates),
          lineName: this.lineSelected,
          referenceId: this.referenceId,
        },
      ];
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      this.restart();
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      this.currentStep = '';
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.currentStep = 'select-points';
      this.stopAnimation();
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
      app.removeListener('canvasMouseUp', this.mouseUpId);
    }
  }

  adjustPoint(point) {
    if (this.constraints.isFree) {
      let constraints = SelectManager.getEmptySelectionConstraints().points;
      constraints.canSelect = true;
      let adjustedCoordinates = SelectManager.selectPoint(
        point.coordinates,
        constraints,
        false,
      );
      if (adjustedCoordinates) {
        point.coordinates = new Coordinates(adjustedCoordinates);
      }
    } else {
      let adjustedCoordinates = this.constraints.projectionOnConstraints(
        point.coordinates,
      );
      point.coordinates = new Coordinates(adjustedCoordinates);
    }
  }

  refreshStateUpper() {
    if (this.currentStep == 'select-points') {
      this.points[this.numberOfPointsDrawn - 1].coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.points[this.numberOfPointsDrawn - 1]);
      if (
        this.numberOfPointsDrawn == this.numberOfPointsRequired() &&
        this.numberOfPointsDrawn < 2
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    let numberOfPointsRequired = 0;
    if (this.lineSelected == 'Segment') numberOfPointsRequired = 2;
    else if (this.lineSelected == 'ParalleleSegment')
      numberOfPointsRequired = 2;
    else if (this.lineSelected == 'PerpendicularSegment')
      numberOfPointsRequired = 2;
    else if (this.lineSelected == 'SemiStraightLine')
      numberOfPointsRequired = 2;
    else if (this.lineSelected == 'ParalleleSemiStraightLine')
      numberOfPointsRequired = 2;
    else if (this.lineSelected == 'PerpendicularSemiStraightLine')
      numberOfPointsRequired = 2;
    else if (this.lineSelected == 'StraightLine') numberOfPointsRequired = 2;
    else if (this.lineSelected == 'ParalleleStraightLine')
      numberOfPointsRequired = 1;
    else if (this.lineSelected == 'PerpendicularStraightLine')
      numberOfPointsRequired = 1;
    return numberOfPointsRequired;
  }

  finishShape() {
    let newCoordinates;
    if (this.lineSelected == 'ParalleleStraightLine') {
      let referenceSegment = app.mainDrawingEnvironment.findObjectById(
        this.referenceId,
        'segment',
      );
      newCoordinates = this.points[0].coordinates
        .substract(referenceSegment.vertexes[0].coordinates)
        .add(referenceSegment.vertexes[1].coordinates);
    } else if (this.lineSelected == 'PerpendicularStraightLine') {
      let referenceSegment = app.mainDrawingEnvironment.findObjectById(
        this.referenceId,
        'segment',
      );
      newCoordinates = referenceSegment.projectionOnSegment(
        this.points[0].coordinates,
      );
    }

    if (this.points.length == 1) {
      this.points[1] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
        visible: false,
      });
    } else {
      this.points[1].coordinates = newCoordinates;
    }
  }

  getConstraints(pointNb) {
    if (pointNb == 0) {
      this.constraints = new GeometryConstraint('isFree');
    } else if (pointNb == 1) {
      if (this.lineSelected.startsWith('Parallele')) {
        let referenceSegment = app.mainDrawingEnvironment.findObjectById(
          this.referenceId,
          'segment',
        );
        let secondCoordinates = this.points[0].coordinates
          .substract(referenceSegment.vertexes[0].coordinates)
          .add(referenceSegment.vertexes[1].coordinates);
        let lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isContrained', lines);
      } else if (this.lineSelected.startsWith('Perpendicular')) {
        let referenceSegment = app.mainDrawingEnvironment.findObjectById(
          this.referenceId,
          'segment',
        );
        let secondCoordinates = referenceSegment.projectionOnSegment(
          this.points[0].coordinates,
        );
        let lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isContrained', lines);
      }
    }
  }
}
