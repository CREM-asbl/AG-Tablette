import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Tool } from '../Core/States/Tool';
import { createElem } from '../Core/Tools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';
import { GridManager } from '../Grid/GridManager';

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
    this.geometryParentObjectId = null;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    this.removeListeners();
    this.stopAnimation();
    this.geometryParentObjectId = null;

    import('./lines-list');
    createElem('lines-list');
  }

  drawFirstPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    if (
      !app.tool.selectedLine.startsWith('Parallele') &&
      !app.tool.selectedLine.startsWith('Perpendicular')
    ) {
      app.upperDrawingEnvironment.removeAllObjects();
      // this.getConstraints(this.numberOfPointsDrawn);
      setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } }), 50);
    } else {
      setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
    }
  }

  selectReference() {
    app.upperDrawingEnvironment.removeAllObjects();

    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_segments;
    this.objectSelectedId = app.addListener(
      'objectSelected',
      this.handler,
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

  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'un segment a été sélectionné
   * @param  {Segment} segment            Le segment sélectionnée
   */
  objectSelected(segment) {
    if (app.tool.currentStep != 'selectReference') return;

    if (segment.isArc())
      return;

    this.geometryParentObjectId = segment.id;

    new LineShape({
      drawingEnvironment: app.upperDrawingEnvironment,
      path: segment.getSVGPath('no-scale', true),
      strokeColor: app.settings.referenceDrawColor,
      strokeWidth: 2,
    });

    window.dispatchEvent(new CustomEvent('refreshUpper'));

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } })
  }

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (this.constraints.type == 'isConstrained' && !this.constraints.projectionOnConstraints(newCoordinates, true)) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point sur la contrainte.' } }))
      return;
    }

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
          // isInfinite: app.tool.selectedLine.endsWith('Parallele')
        });
        if (app.tool.selectedLine.endsWith('SemiStraightLine')) {
          seg.isSemiInfinite = true;
        } else if (app.tool.selectedLine.endsWith('StraightLine')) {
          seg.isInfinite = true;
        }
        this.segments.push(seg);
        let familyName = 'Line';
        let name = app.tool.selectedLine;
        let shape = new LineShape({
          drawingEnvironment: app.upperDrawingEnvironment,
          segmentIds: this.segments.map((seg) => seg.id),
          pointIds: this.points.map((pt) => pt.id),
          strokeColor: app.settings.temporaryDrawColor,
          name,
          familyName,
        });
        if (app.tool.selectedLine == 'Vector') {
          shape = new ArrowLineShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            segmentIds: this.segments.map((seg) => seg.id),
            pointIds: this.points.map((pt) => pt.id),
            strokeColor: app.settings.temporaryDrawColor,
            name,
            familyName,
          });
        }
        this.segments.forEach((seg, idx) => {
          seg.idx = idx;
          seg.shapeId = shape.id;
        });
      }
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
    }
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == 2 && SelectManager.areCoordinatesInMagnetismDistance(this.points[0].coordinates, this.points[1].coordinates)) {
      let firstPointCoordinates = this.points[0].coordinates;
      this.numberOfPointsDrawn = 1;
      app.upperDrawingEnvironment.removeAllObjects();
      this.points[0] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: firstPointCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
      this.segments = [];
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point autre part.' } }));
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
      return;
    }

    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
    } else {
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
      } else {
        let gridPoint = GridManager.getClosestGridPoint(point.coordinates);
        if (gridPoint)
          point.coordinates = new Coordinates(gridPoint.coordinates);
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
    if (app.tool.selectedLine == 'Segment') numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'ParalleleSegment')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'PerpendicularSegment')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'SemiStraightLine')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'ParalleleSemiStraightLine')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'PerpendicularSemiStraightLine')
      numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'StraightLine') numberOfPointsRequired = 2;
    else if (app.tool.selectedLine == 'ParalleleStraightLine')
      numberOfPointsRequired = 1;
    else if (app.tool.selectedLine == 'PerpendicularStraightLine')
      numberOfPointsRequired = 1;
    else if (app.tool.selectedLine == 'Vector')
      numberOfPointsRequired = 2;
    return numberOfPointsRequired;
  }

  finishShape() {
    let newCoordinates;
    if (app.tool.selectedLine == 'ParalleleStraightLine') {
      let referenceSegment = app.mainDrawingEnvironment.findObjectById(
        this.geometryParentObjectId,
        'segment',
      );
      newCoordinates = this.points[0].coordinates
        .substract(referenceSegment.vertexes[0].coordinates)
        .add(referenceSegment.vertexes[1].coordinates);
    } else if (app.tool.selectedLine == 'PerpendicularStraightLine') {
      let referenceSegment = app.mainDrawingEnvironment.findObjectById(
        this.geometryParentObjectId,
        'segment',
      );
      let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      newCoordinates = this.points[0].coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));
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
      if (app.tool.selectedLine.startsWith('Parallele')) {
        let referenceSegment = app.mainDrawingEnvironment.findObjectById(
          this.geometryParentObjectId,
          'segment',
        );
        let secondCoordinates = this.points[0].coordinates
          .substract(referenceSegment.vertexes[0].coordinates)
          .add(referenceSegment.vertexes[1].coordinates);
        let lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      } else if (app.tool.selectedLine.startsWith('Perpendicular')) {
        let referenceSegment = app.mainDrawingEnvironment.findObjectById(
          this.geometryParentObjectId,
          'segment',
        );
        let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
        let secondCoordinates = this.points[0].coordinates.add(new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }));
        let lines = [[this.points[0].coordinates, secondCoordinates]];
        this.constraints = new GeometryConstraint('isConstrained', lines);
      }
    }
  }

  _executeAction() {
    let path = [
      'M',
      this.points[0].coordinates.x,
      this.points[0].coordinates.y,
      'L',
      this.points[1].coordinates.x,
      this.points[1].coordinates.y,
    ].join(' ');

    let shape;
    if (app.tool.selectedLine == 'Vector') {
      shape = new ArrowLineShape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        name: app.tool.selectedLine,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
    } else {
      shape = new LineShape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        name: app.tool.selectedLine,
        familyName: 'Line',
        geometryObject: new GeometryObject({}),
      });
      if (
        app.tool.selectedLine == 'StraightLine' ||
        app.tool.selectedLine == 'ParalleleStraightLine' ||
        app.tool.selectedLine == 'PerpendicularStraightLine'
      ) {
        shape.segments[0].isInfinite = true;
        if (app.tool.selectedLine == 'ParalleleStraightLine' ||
          app.tool.selectedLine == 'PerpendicularStraightLine') {
          shape.points[1].visible = false;
        }
      } else if (
        app.tool.selectedLine == 'SemiStraightLine' ||
        app.tool.selectedLine == 'ParalleleSemiStraightLine' ||
        app.tool.selectedLine == 'PerpendicularSemiStraightLine'
      ) {
        shape.segments[0].isSemiInfinite = true;
      } else if (
        app.tool.selectedLine == 'Segment' ||
        app.tool.selectedLine == 'ParalleleSegment' ||
        app.tool.selectedLine == 'PerpendicularSegment'
      ) {
      }
    }

    if (this.geometryParentObjectId) {
      shape.geometryObject.geometryParentObjectId1 = this.geometryParentObjectId;
      let reference = app.mainDrawingEnvironment.findObjectById(this.geometryParentObjectId, 'segment');
      reference.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    }

    let ref;
    if (ref = app.mainDrawingEnvironment.points.filter(pt => pt.id != shape.vertexes[0].id).find(pt => pt.coordinates.equal(shape.vertexes[0].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[0].reference = ref.id;
    }
    if (shape.name == 'Segment' || shape.name == 'SemiStraightLine' || shape.name == 'StraightLine' || shape.name == 'Vector')
    if (ref = app.mainDrawingEnvironment.points.filter(pt => pt.id != shape.vertexes[1].id).find(pt => pt.coordinates.equal(shape.vertexes[1].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[1].reference = ref.id;
    }

    computeConstructionSpec(shape);
  }
}
