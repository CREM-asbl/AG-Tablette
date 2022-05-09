import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { createElem } from '../Core/Tools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';
import { GridManager } from '../Grid/GridManager';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateTriangleTool extends Tool {
  constructor() {
    super('createTriangle', 'Dessiner un triangle', 'geometryCreator');

    // show-triangles -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // Le tyle de figure que l'on va créer (rectangle, IsoscelesTriangle, RightAngleIsoscelesTriangle, trapèze)
    this.triangleSelected = null;
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

    import('./triangles-list');
    createElem('triangles-list');
  }

  async drawFirstPoint() {
    app.upperCanvasElem.removeAllObjects();
    let triangleDef = await import(`./trianglesDef.js`);
    this.triangleDef = triangleDef[app.tool.selectedTriangle];

    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } }), 50);
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

  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    if (this.constraints.type == 'isConstrained' && !this.constraints.projectionOnConstraints(newCoordinates, true)) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point sur la contrainte.' } }))
      return;
    }

    this.points[this.numberOfPointsDrawn] = new Point({
      drawingEnvironment: app.upperCanvasElem,
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });
    this.numberOfPointsDrawn++;
    if (this.numberOfPointsDrawn > 1) {
      let seg = new Segment({
        drawingEnvironment: app.upperCanvasElem,
        vertexIds: [
          this.points[this.numberOfPointsDrawn - 2].id,
          this.points[this.numberOfPointsDrawn - 1].id,
        ],
      });
      this.segments.push(seg);
    }
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      if (this.numberOfPointsDrawn < 3) this.finishShape();
      let seg = new Segment({
        drawingEnvironment: app.upperCanvasElem,
        vertexIds: [this.points[2].id, this.points[0].id],
      });
      this.segments.push(seg);
      let shape = new RegularShape({
        drawingEnvironment: app.upperCanvasElem,
        segmentIds: this.segments.map((seg) => seg.id),
        pointIds: this.points.map((pt) => pt.id),
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
      });
      this.segments.forEach((seg, idx) => {
        seg.idx = idx;
        seg.shapeId = shape.id;
      });
    } else if (this.numberOfPointsDrawn > 1) {
      new RegularShape({
        drawingEnvironment: app.upperCanvasElem,
        segmentIds: [this.segments[0].id],
        pointIds: this.segments[0].vertexIds,
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
      });
    }
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
  }

  canvasMouseUp() {
    for (let i = 0; i < this.numberOfPointsDrawn - 1; i++) {
      if (SelectManager.areCoordinatesInMagnetismDistance(this.points[i].coordinates, this.points[this.numberOfPointsDrawn - 1].coordinates)) {
        let firstPointCoordinates = this.points[0].coordinates;
        if (this.numberOfPointsDrawn == 2) {
          app.upperCanvasElem.removeAllObjects();
          this.numberOfPointsDrawn = 1;
          this.points = [new Point({
            drawingEnvironment: app.upperCanvasElem,
            coordinates: firstPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          })];
          this.segments = [];
        } else if (this.numberOfPointsDrawn == 3) {
          let secondPointCoordinates = this.points[1].coordinates;
          app.upperCanvasElem.removeAllObjects();
          this.numberOfPointsDrawn = 2;
          this.points = [new Point({
            drawingEnvironment: app.upperCanvasElem,
            coordinates: firstPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          }), new Point({
            drawingEnvironment: app.upperCanvasElem,
            coordinates: secondPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          })];
          this.segments = [new Segment({
            drawingEnvironment: app.upperCanvasElem,
            vertexIds: [
              this.points[0].id,
              this.points[1].id,
            ],
          })];
          new RegularShape({
            drawingEnvironment: app.upperCanvasElem,
            segmentIds: [this.segments[0].id],
            pointIds: this.segments[0].vertexIds,
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        }
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point autre part.' } }));
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
        return;
      }
    }

    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperCanvasElem.removeAllObjects();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
    } else {
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
        point.coordinates = new Coordinates(adjustedCoordinates);
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
        this.numberOfPointsDrawn < 3
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    return this.triangleDef.numberOfPointsToRequired;
  }

  finishShape() {
    this.triangleDef.finishShape(this.points, this.segments);
  }

  getConstraints(pointNb) {
    this.constraints = this.triangleDef.constraints[pointNb](this.points, this.segments);
  }

  _executeAction() {
    let familyName = '3-corner-shape';
    if (app.tool.selectedTriangle == 'EquilateralTriangle') {
      familyName = 'Regular';
    } else if (app.tool.selectedTriangle == 'IrregularTriangle') {
      familyName = 'Irregular';
    }

    let path = ['M', this.points[0].coordinates.x, this.points[0].coordinates.y];
    path.push('L', this.points[1].coordinates.x, this.points[1].coordinates.y);
    path.push('L', this.points[2].coordinates.x, this.points[2].coordinates.y);
    path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    let shape = new RegularShape({
      drawingEnvironment: app.mainCanvasElem,
      path: path,
      name: app.tool.selectedTriangle,
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    let ref;
    if (ref = app.mainCanvasElem.points.filter(pt => pt.id != shape.vertexes[0].id).find(pt => pt.coordinates.equal(shape.vertexes[0].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[0].reference = ref.id;
    }
    if (ref = app.mainCanvasElem.points.filter(pt => pt.id != shape.vertexes[1].id).find(pt => pt.coordinates.equal(shape.vertexes[1].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[1].reference = ref.id;
    }
    if (shape.name == 'IrregularTriangle') {
      if (ref = app.mainCanvasElem.points.filter(pt => pt.id != shape.vertexes[2].id).find(pt => pt.coordinates.equal(shape.vertexes[2].coordinates))) {
        if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
          ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
        shape.vertexes[2].reference = ref.id;
      }
    }
    computeConstructionSpec(shape);
  }
}
