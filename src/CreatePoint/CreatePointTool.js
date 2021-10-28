import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem, uniqId } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreatePointTool extends Tool {
  constructor() {
    super('createPoint', 'Dessiner un point', 'geometryCreator');

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
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
   start() {
    this.removeListeners();
    this.stopAnimation();

    import('./points-list');
    createElem('points-list');
  }

  drawPoint() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

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

    this.point = new Point({
      drawingEnvironment: app.upperDrawingEnvironment,
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' } });
  }

  canvasMouseUp() {
    this.stopAnimation();
    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
  }

  adjustPoint(point) {
    let reference, newCoord;
    switch (app.tool.selectedPoint) {
      case 'Point':
        break;
      case 'PointOnLine':
        reference = SelectManager.selectSegment(
          point.coordinates,
          {
            canSelect: true,
          },
        );
        if (reference) {
          console.log(reference);
          newCoord = reference.projectionOnSegment(point.coordinates);
          this.referenceId = reference.id;
        } else {
          this.referenceId = null;
        }
        if (newCoord)
          point.coordinates = newCoord;
        break;
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'animatePoint') {
      this.point.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.point);
    }
  }

  _executeAction() {
    let shape;
    if (app.tool.selectedPoint == 'Point') {
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: path,
        name: app.tool.selectedPoint,
        familyName: 'Point',
      });
    } else if (app.tool.selectedPoint == 'PointOnLine') {
      if (!this.referenceId) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez choisir une ligne pour placer le point.' } }))
        return;
      }
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
      });
      shape.referenceId = this.referenceId;
      let reference = app.mainDrawingEnvironment.findObjectById(this.referenceId, 'segment');
      reference.shape.hasGeometryReferenced.push(shape.id);
    }
  }
}
