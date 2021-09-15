import { app } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem, uniqId } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateLineTool extends Tool {
  constructor() {
    super('createLine', 'Dessiner une ligne', 'geometryCreator');

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
    this.removeListeners();
    this.stopAnimation();

    import('./lines-list');
    createElem('lines-list');
  }

  drawFirstPoint() {
    // let lineDef = await import(`./linesDef.js`);
    // this.lineDef = lineDef[app.tool.selectedLine];

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    if (
      this.lineSelected == 'StraightLine' ||
      this.lineSelected == 'SemiStraightLine' ||
      this.lineSelected == 'Segment'
    ) {
      this.getConstraints(this.numberOfPointsDrawn);
      setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } }), 50);
    } else if (
      this.lineSelected == 'ParalleleStraightLine' ||
      this.lineSelected == 'PerpendicularStraightLine' ||
      this.lineSelected == 'ParalleleSemiStraightLine' ||
      this.lineSelected == 'PerpendicularSemiStraightLine' ||
      this.lineSelected == 'ParalleleSegment' ||
      this.lineSelected == 'PerpendicularSegment'
    ) {
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.click_all_segments),
      );
      setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
    }
  }

  selectReference() {
    setTimeout(
      () =>
        (this.objectSelectedId = app.addListener(
          'objectSelected',
          this.handler,
        )),
    );
  }

  drawPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.getConstraints(this.numberOfPointsDrawn);

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animatePoint() {
    this.removeListeners();
    this.animate();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
   end() {
    this.removeListeners();
    this.stopAnimation();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un segment a été sélectionné
   * @param  {Segment} segment            Le segment sélectionnée
   */
  objectSelected(segment) {
    if (app.tool.currentStep != 'selectReference') return;

    this.referenceId = segment.id;

    new Shape({
      drawingEnvironment: app.upperDrawingEnvironment,
      path: segment.getSVGPath('scale', undefined, true),
      borderColor: app.settings.constraintsDrawColor,
      borderSize: 2,
    });

    window.dispatchEvent(new CustomEvent('refreshUpper'));

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } })
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (app.tool.currentStep == 'drawPoint') {
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
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      this.stopAnimation();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
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
        point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
      }
    } else {
      let adjustedCoordinates = this.constraints.projectionOnConstraints(
        point.coordinates,
      );
      point.coordinates = new Coordinates(adjustedCoordinates);
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'animatePoint') {
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
