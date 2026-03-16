
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import {
  createElem,
  findObjectById,
  removeObjectById,
} from '../Core/Tools/general';
import { linkNewlyCreatedPoint } from '../GeometryTools/general';
import { createRegularHelpConfig } from './createRegular.helpConfig';
import './regular-popup';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateRegularTool extends Tool {
  constructor() {
    super(
      'createRegularPolygon',
      'Construire un polygone régulier',
      'geometryCreator',
    );

    // start -> listen -> selectSecondPoint
    this.currentStep = null;

    // numbre of points in the shape
    this.numberOfPoints = 4;
  }

  updateToolStep(step, extraState = {}) {
    appActions.setToolState(extraState);
    appActions.setCurrentStep(step);
    setState({
      tool: {
        ...app.tool,
        ...extraState,
        name: this.name,
        currentStep: step,
      },
    });
  }



  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.removeListeners();
    this.stopAnimation();

    helpConfigRegistry.register(this.name, createRegularHelpConfig);

    appActions.setActiveTool(this.name);

    // Le start peut être appelé deux fois par les mécanismes de state sync.
    // On force une seule instance visible du popup.
    const existingPopups = document.querySelectorAll('regular-popup');
    existingPopups.forEach((popup) => popup.remove());

    createElem('regular-popup');

    this.updateToolStep('drawFirstPoint');
  }

  drawFirstPoint() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateFirstPoint() {
    this.removeListeners();

    const newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.firstPoint = new Point({
      layer: 'upper',
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

    this.animate();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  drawSecondPoint() {
    this.removeListeners();
    this.stopAnimation();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateSecondPoint() {
    this.removeListeners();

    const newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.secondPoint = new Point({
      layer: 'upper',
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

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
   * Main event handler
   */
  // _actionHandle(event) {
  //   if (event.type == 'canvasMouseDown') {
  //     this.canvasMouseDown();
  //   } else if (event.type == 'canvasMouseUp') {
  //     this.canvasMouseUp();
  //   }
  // }

  // setNumberOfPoints(points) {
  //   this.numberOfPoints = parseInt(points);
  //   this.currentStep = 'listen-canvas-click';
  // }

  canvasMouseDown() {
    if (app.tool.currentStep === 'drawFirstPoint') {
      this.updateToolStep('animateFirstPoint');
    } else {
      this.updateToolStep('animateSecondPoint');
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  canvasMouseUp() {
    if (app.tool.currentStep === 'animateFirstPoint') {
      this.stopAnimation();
      this.adjustPoint(this.firstPoint);
      window.dispatchEvent(new CustomEvent('refreshUpper'));

      this.updateToolStep('drawSecondPoint');
    } else {
      this.stopAnimation();
      if (
        SelectManager.areCoordinatesInMagnetismDistance(
          this.firstPoint.coordinates,
          this.secondPoint.coordinates,
        )
      ) {
        const firstPointCoordinates = this.firstPoint.coordinates;
        app.upperCanvasLayer.removeAllObjects();
        this.firstPoint = new Point({
          layer: 'upper',
          coordinates: firstPointCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
        });
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: { message: 'Veuillez placer le point autre part.' },
          }),
        );
        appActions.setCurrentStep('drawSecondPoint');
        setState({
          tool: {
            ...app.tool,
            name: this.name,
            currentStep: 'drawSecondPoint',
          },
        });
        return;
      }
      this.adjustPoint(this.secondPoint);
      this.executeAction();
      this.updateToolStep('drawFirstPoint');
    }
  }

  adjustPoint(point) {
    point.adjustedOn = undefined;
    let constraints = SelectManager.getEmptySelectionConstraints().points;
    constraints.canSelect = true;
    let adjustedPoint;
    if (
      (adjustedPoint = SelectManager.selectPoint(
        point.coordinates,
        constraints,
        false,
      ))
    ) {
      point.coordinates = new Coordinates(adjustedPoint.coordinates);
      point.adjustedOn = adjustedPoint;
    } else if (
      (adjustedPoint = app.gridCanvasLayer.getClosestGridPoint(
        point.coordinates.toCanvasCoordinates(),
      ))
    ) {
      const adjustedPointInWorldSpace = adjustedPoint.fromCanvasCoordinates();
      point.coordinates = new Coordinates(adjustedPointInWorldSpace);
      point.adjustedOn = adjustedPointInWorldSpace;
    } else {
      constraints = SelectManager.getEmptySelectionConstraints().segments;
      constraints.canSelect = true;
      const adjustedSegment = SelectManager.selectSegment(
        point.coordinates,
        constraints,
      );
      if (adjustedSegment) {
        point.coordinates = adjustedSegment.projectionOnSegment(
          point.coordinates,
        );
        point.adjustedOn = adjustedSegment;
      }
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'animateFirstPoint') {
      if (!this.firstPoint) return;
      this.firstPoint.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.firstPoint);
    } else if (app.tool.currentStep === 'animateSecondPoint') {
      if (!this.firstPoint || !this.secondPoint) return;
      this.secondPoint.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.secondPoint);

      const path = this.getPath(
        this.firstPoint.coordinates,
        this.secondPoint.coordinates,
      );

      if (this.shapeDrawnId) removeObjectById(this.shapeDrawnId);

      const shape = new RegularShape({
        path: path,
        layer: 'upper',
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
      });
      this.shapeDrawnId = shape.id;
      shape.vertexes.forEach((vx) => {
        vx.color = app.settings.temporaryDrawColor;
        vx.size = 2;
      });
    }
  }

  getPath(firstCoordinates, secondCoordinates) {
    this.numberOfPoints = app.settings.numberOfRegularPoints;
    const externalAngle = (Math.PI * 2) / this.numberOfPoints;

    let path = [
      'M',
      firstCoordinates.x,
      firstCoordinates.y,
      'L',
      secondCoordinates.x,
      secondCoordinates.y,
    ];

    const length = firstCoordinates.dist(secondCoordinates);

    const startAngle = Math.atan2(
      -(firstCoordinates.y - secondCoordinates.y),
      -(firstCoordinates.x - secondCoordinates.x),
    );

    let currentCoordinates = secondCoordinates;

    for (let i = 0; i < this.numberOfPoints - 2; i++) {
      const dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      const dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      currentCoordinates = currentCoordinates.add({ x: dx, y: dy });

      path.push('L', currentCoordinates.x, currentCoordinates.y);
    }

    path.push('L', firstCoordinates.x, firstCoordinates.y);

    path = path.join(' ');

    return path;
  }

  executeAction() {
    const shapeDrawn = findObjectById(this.shapeDrawnId);

    const shape = new RegularShape({
      ...shapeDrawn,
      layer: 'main',
      path: shapeDrawn.getSVGPath('no-scale'),
      familyName: 'Regular',
      strokeColor: '#000000',
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    const transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
    shape.vertexes[0].adjustedOn = this.firstPoint.adjustedOn;
    shape.vertexes[1].adjustedOn = this.secondPoint.adjustedOn;
    linkNewlyCreatedPoint(shape, shape.vertexes[0]);
    linkNewlyCreatedPoint(shape, shape.vertexes[1]);
  }
}
