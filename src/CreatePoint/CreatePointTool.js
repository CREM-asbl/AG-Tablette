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

    if (app.tool.selectedPoint == 'PointOnIntersection') {
      app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_segments;
      this.objectSelectedId = app.addListener('objectSelected', this.handler);
    } else {
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    }
  }

  selectSecondSegment() {
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

  objectSelected(segment) {
    new Shape({
      drawingEnvironment: app.upperDrawingEnvironment,
      borderColor: app.settings.temporaryDrawColor,
      borderSize: 3,
      path: segment.getSVGPath('no scale', true),
      id: undefined,
      color: '#000',
      opacity: 0,
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    if (app.tool.currentStep == 'drawPoint') {
      this.referenceId1 = segment.id;
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectSecondSegment' } });
    } else {
      this.referenceId2 = segment.id;
      this.executeAnimation();
    }
  }

  executeAnimation() {
    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.executeAction();
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' } });
    }, 500);
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
          newCoord = reference.projectionOnSegment(point.coordinates);
          this.referenceId = reference.id;
        } else {
          this.referenceId = null;
        }
        if (newCoord)
          point.coordinates = newCoord;
        break;
      case 'PointOnShape':
        reference = SelectManager.selectShape(
          point.coordinates,
          {
            canSelect: true,
          },
        );
        if (reference) {
          this.referenceId = reference.id;
        } else {
          this.referenceId = null;
        }
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
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
      });
    } else if (app.tool.selectedPoint == 'PointOnLine') {
      if (!this.referenceId) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez choisir une ligne pour placer le point.' } }));
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

      let ratioX = (shape.points[0].coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
      let ratioY = (shape.points[0].coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
      let ratio = ratioX;
      if (isNaN(ratio))
        ratio = ratioY;
      // let ratio = reference.vertexes[0].coordinates.dist(shape.points[0].coordinates) / reference.length;

      shape.points[0].ratio = ratio;

      reference.shape.hasGeometryReferenced.push(shape.id);
    } else if (app.tool.selectedPoint == 'PointOnShape') {
      if (!this.referenceId) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez choisir une figure pour placer le point.' } }));
        return;
      }
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
      });
      shape.referenceId = this.referenceId;
      let reference = app.mainDrawingEnvironment.findObjectById(this.referenceId, 'shape');
      reference.hasGeometryReferenced.push(shape.id);
    } else if (app.tool.selectedPoint == 'PointOnIntersection') {
      let firstSeg = app.mainDrawingEnvironment.findObjectById(this.referenceId1, 'segment');
      let secondSeg = app.mainDrawingEnvironment.findObjectById(this.referenceId2, 'segment');
      let coord =  firstSeg.intersectionWith(secondSeg);
      if (!coord) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez choisir deux lignes non parallèles' } }));
        return;
      }
      shape = new Shape({
        drawingEnvironment: app.mainDrawingEnvironment,
        path: `M ${coord.x} ${coord.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
      });
      shape.referenceId = this.referenceId1;
      shape.referenceId2 = this.referenceId2;
      firstSeg.shape.hasGeometryReferenced.push(shape.id);
      secondSeg.shape.hasGeometryReferenced.push(shape.id);
    }
  }
}
