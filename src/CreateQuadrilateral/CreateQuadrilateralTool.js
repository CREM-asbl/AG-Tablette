import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { createElem, findObjectsByName, removeObjectById } from '../Core/Tools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateQuadrilateralTool extends Tool {
  constructor() {
    super('createQuadrilateral', 'Dessiner un quadrilatère', 'geometryCreator');

    // show-quadrilaterals -> select-points
    this.currentStep = null;

    // points of the shape to create
    this.points = [];

    // points drawn by the user
    this.numberOfPointsDrawn = 0;

    // Le tyle de figure que l'on va créer (rectangle, IsoscelesTriangle, RightAngleIsoscelesTriangle, trapèze)
    this.quadrilateralSelected = null;
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
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    import('./quadrilaterals-list');
    createElem('quadrilaterals-list');
  }

  async drawFirstPoint() {
    app.upperCanvasLayer.removeAllObjects();
    let quadrilateralsDef = await import(`./quadrilateralsDef.js`);
    this.quadrilateralDef = quadrilateralsDef[app.tool.selectedQuadrilateral];

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
    app.upperCanvasLayer.removeAllObjects();
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
      layer: 'upper',
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });
    this.numberOfPointsDrawn++;
    if (this.numberOfPointsDrawn > 1) {
      let seg = new Segment({
        layer: 'upper',
        vertexIds: [
          this.points[this.numberOfPointsDrawn - 2].id,
          this.points[this.numberOfPointsDrawn - 1].id,
        ],
      });
      this.segments.push(seg);
    }
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      if (this.numberOfPointsDrawn < 4) this.finishShape();
      let seg = new Segment({
        layer: 'upper',
        vertexIds: [this.points[3].id, this.points[0].id],
      });
      this.segments.push(seg);
      let shape = new RegularShape({
        layer: 'upper',
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
        layer: 'upper',
        segmentIds: [this.segments[this.numberOfPointsDrawn - 2].id],
        pointIds: this.segments[this.numberOfPointsDrawn - 2].vertexIds,
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
          app.upperCanvasLayer.removeAllObjects();
          this.numberOfPointsDrawn = 1;
          this.points = [new Point({
            layer: 'upper',
            coordinates: firstPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          })];
          this.segments = [];
        } else if (this.numberOfPointsDrawn == 3) {
          let secondPointCoordinates = this.points[1].coordinates;
          app.upperCanvasLayer.removeAllObjects();
          this.numberOfPointsDrawn = 2;
          this.points = [new Point({
            layer: 'upper',
            coordinates: firstPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          }), new Point({
            layer: 'upper',
            coordinates: secondPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          })];
          this.segments = [new Segment({
            layer: 'upper',
            vertexIds: [
              this.points[0].id,
              this.points[1].id,
            ],
          })];
          new RegularShape({
            layer: 'upper',
            segmentIds: [this.segments[0].id],
            pointIds: this.segments[0].vertexIds,
            strokeColor: app.settings.temporaryDrawColor,
            fillOpacity: 0,
          });
        } else if (this.numberOfPointsDrawn == 4) {
          let secondPointCoordinates = this.points[1].coordinates;
          let thirdPointCoordinates = this.points[2].coordinates;
          app.upperCanvasLayer.removeAllObjects();
          this.numberOfPointsDrawn = 3;
          this.points = [new Point({
            layer: 'upper',
            coordinates: firstPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          }), new Point({
            layer: 'upper',
            coordinates: secondPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          }), new Point({
            layer: 'upper',
            coordinates: thirdPointCoordinates,
            color: app.settings.temporaryDrawColor,
            size: 2,
          })];
          this.segments = [new Segment({
            layer: 'upper',
            vertexIds: [
              this.points[0].id,
              this.points[1].id,
            ],
          }), new Segment({
            layer: 'upper',
            vertexIds: [
              this.points[1].id,
              this.points[2].id,
            ],
          })];
          new RegularShape({
            layer: 'upper',
            segmentIds: this.segments.map(seg => seg.id),
            pointIds: this.points.map(pt => pt.id),
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
      app.upperCanvasLayer.removeAllObjects();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' } });
    } else {
      this.getConstraints(this.numberOfPointsDrawn);
      // window.dispatchEvent(new CustomEvent('refreshUpper'));
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
        let gridPoint = app.gridCanvasLayer.getClosestGridPoint(point.coordinates);
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
        this.numberOfPointsDrawn < 4
      ) {
        this.finishShape();
      }
    }
  }

  numberOfPointsRequired() {
    return this.quadrilateralDef.numberOfPointsRequired;
  }

  finishShape() {
    this.quadrilateralDef.finishShape(this.points, this.segments);
  }

  getConstraints(pointNb) {
    findObjectsByName('constraints', 'upper').forEach(obj => removeObjectById(obj.id));
    this.constraints = this.quadrilateralDef.constraints[pointNb](this.points, this.segments);
  }

  _executeAction() {
    let familyName = '4-corner-shape';
    if (app.tool.selectedQuadrilateral == 'Square') {
      familyName = 'Regular';
    } else if (app.tool.selectedQuadrilateral == 'IrregularQuadrilateral') {
      familyName = 'Irregular';
    }

    let path = ['M', this.points[0].coordinates.x, this.points[0].coordinates.y];
    path.push('L', this.points[1].coordinates.x, this.points[1].coordinates.y);
    path.push('L', this.points[2].coordinates.x, this.points[2].coordinates.y);
    path.push('L', this.points[3].coordinates.x, this.points[3].coordinates.y);
    path.push('L', this.points[0].coordinates.x, this.points[0].coordinates.y);
    path = path.join(' ');

    let shape = new RegularShape({
      layer: 'main',
      path: path,
      name: app.tool.selectedQuadrilateral,
      familyName: familyName,
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    let ref;
    if (ref = app.mainCanvasLayer.points.filter(pt => pt.id != shape.vertexes[0].id).find(pt => pt.coordinates.equal(shape.vertexes[0].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[0].reference = ref.id;
    }
    if (ref = app.mainCanvasLayer.points.filter(pt => pt.id != shape.vertexes[1].id).find(pt => pt.coordinates.equal(shape.vertexes[1].coordinates))) {
      if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
        ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      shape.vertexes[1].reference = ref.id;
    }
    if (shape.name == 'Parallelogram' || shape.name == 'IsoscelesTrapeze' || shape.name == 'IrregularQuadrilateral') {
      if (ref = app.mainCanvasLayer.points.filter(pt => pt.id != shape.vertexes[2].id).find(pt => pt.coordinates.equal(shape.vertexes[2].coordinates))) {
        if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
          ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
        shape.vertexes[2].reference = ref.id;
      }
    }
    if (shape.name == 'IrregularQuadrilateral') {
      if (ref = app.mainCanvasLayer.points.filter(pt => pt.id != shape.vertexes[3].id).find(pt => pt.coordinates.equal(shape.vertexes[3].coordinates))) {
        if (ref.shape.geometryObject.geometryChildShapeIds.indexOf(shape.id) === -1)
          ref.shape.geometryObject.geometryChildShapeIds.push(shape.id);
        shape.vertexes[3].reference = ref.id;
      }
    }
    computeConstructionSpec(shape);
    // window.dispatchEvent(new CustomEvent('refresh'));
  }
}
