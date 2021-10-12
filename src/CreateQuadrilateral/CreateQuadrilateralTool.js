import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem, uniqId } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Coordinates } from '../Core/Objects/Coordinates';
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
      <h2>${toolName}</h2>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    this.removeListeners();
    this.stopAnimation();

    import('./quadrilaterals-list');
    createElem('quadrilaterals-list');
  }

  async drawFirstPoint() {
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
    this.removeListeners();
    this.stopAnimation();
  }


  canvasMouseDown() {
    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    this.points[this.numberOfPointsDrawn] = new Point({
      drawingEnvironment: app.upperDrawingEnvironment,
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });
    this.numberOfPointsDrawn++;
    if (this.numberOfPointsDrawn > 1) {
      let seg = new Segment({
        drawingEnvironment: app.upperDrawingEnvironment,
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
        drawingEnvironment: app.upperDrawingEnvironment,
        vertexIds: [this.points[3].id, this.points[0].id],
      });
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
    } else if (this.numberOfPointsDrawn > 1) {
      new Shape({
        drawingEnvironment: app.upperDrawingEnvironment,
        segmentIds: [this.segments[this.numberOfPointsDrawn - 2].id],
        pointIds: this.segments[this.numberOfPointsDrawn - 2].vertexIds,
        borderColor: app.settings.temporaryDrawColor,
      });
    }
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
  }

  canvasMouseUp() {
    if (this.numberOfPointsDrawn == this.numberOfPointsRequired()) {
      this.stopAnimation();
      this.executeAction();
      app.upperDrawingEnvironment.removeAllObjects();
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

    let shape = new Shape({
      drawingEnvironment: app.mainDrawingEnvironment,
      path: path,
      name: app.tool.selectedQuadrilateral,
      familyName: familyName,
    });

    let ref;
    if (ref = app.mainDrawingEnvironment.points.filter(pt => pt.id != shape.vertexes[0].id).find(pt => pt.coordinates.equal(shape.vertexes[0].coordinates))) {
      if (ref.shape.hasGeometryReferenced.indexOf(shape.id) === -1)
        ref.shape.hasGeometryReferenced.push(shape.id);
      shape.vertexes[0].reference = ref.id;
    }
    if (ref = app.mainDrawingEnvironment.points.filter(pt => pt.id != shape.vertexes[1].id).find(pt => pt.coordinates.equal(shape.vertexes[1].coordinates))) {
      if (ref.shape.hasGeometryReferenced.indexOf(shape.id) === -1)
        ref.shape.hasGeometryReferenced.push(shape.id);
      shape.vertexes[1].reference = ref.id;
    }
    computeConstructionSpec(shape);
    // window.dispatchEvent(new CustomEvent('refresh'));
  }
}
