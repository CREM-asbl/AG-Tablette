import { app } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { Shape } from '../Core/Objects/Shape';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { uniqId, createElem } from '../Core/Tools/general';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateRegularTool extends Tool {
  constructor() {
    super(
      'createRegularPolygon',
      'Créer un polygone régulier',
      'geometryCreator',
    );

    // start -> listen -> selectSecondPoint
    this.currentStep = null;

    // numbre of points in the shape
    this.numberOfPoints = 4;
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br /></p>
    `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.removeListeners();

    createElem('regular-popup');
  }

  drawFirstPoint() {
    this.removeListeners();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateFirstPoint() {
    this.removeListeners();

    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.firstPoint = new Point({
      drawingEnvironment: app.upperDrawingEnvironment,
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
    this.animate();
  }

  drawSecondPoint() {
    this.removeListeners();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateSecondPoint() {
    this.removeListeners();

    let newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.secondPoint = new Point({
      drawingEnvironment: app.upperDrawingEnvironment,
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
    this.animate();
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
  //   } else {
  //     console.error('unsupported event type : ', event.type);
  //   }
  // }

  // setNumberOfPoints(points) {
  //   this.numberOfPoints = parseInt(points);
  //   this.currentStep = 'listen-canvas-click';
  // }

  canvasMouseDown() {
    if (app.tool.currentStep == 'drawFirstPoint') {
      setState({ tool: { ...app.tool, currentStep: 'animateFirstPoint' } });
    } else {
      setState({ tool: { ...app.tool, currentStep: 'animateSecondPoint' } });
    }

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  canvasMouseUp() {
    if (app.tool.currentStep == 'animateFirstPoint') {
      this.stopAnimation();
      this.adjustPoint(this.firstPoint);
      window.dispatchEvent(new CustomEvent('refreshUpper'));

      setState({ tool: { ...app.tool, currentStep: 'selectSecondPoint' } });
    } else {
      this.stopAnimation();
      this.adjustPoint(this.secondPoint);
      this.actions = [
        {
          name: 'CreateRegularAction',
          firstCoordinates: this.firstPoint.coordinates,
          secondCoordinates: this.secondPoint.coordinates,
          numberOfPoints: this.numberOfPoints,
          reference: null, //reference,
        },
      ];
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' },
      });
    }
  }

  adjustPoint(point) {
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
  }

  refreshStateUpper() {
    if (this.currentStep == 'animateFirstPoint') {
      this.firstPoint.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
    } else if (this.currentStep == 'select-second-point') {
      this.secondPoint.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );

      let path = this.getPath(
        this.firstPoint.coordinates,
        this.secondPoint.coordinates,
      );

      if (this.shapeDrawnId)
        app.upperDrawingEnvironment.removeObjectById(this.shapeDrawnId);

      this.shapeDrawnId = new Shape({
        path: path,
        drawingEnvironment: app.upperDrawingEnvironment,
        borderColor: app.settings.temporaryDrawColor,
      }).id;
    }
  }

  getPath(firstCoordinates, secondCoordinates) {
    this.numberOfPoints = app.settings.numberOfRegularPoints;
    let externalAngle = (Math.PI * 2) / this.numberOfPoints;

    let path = [
      'M',
      firstCoordinates.x,
      firstCoordinates.y,
      'L',
      secondCoordinates.x,
      secondCoordinates.y,
    ];

    let length = firstCoordinates.dist(secondCoordinates);

    let startAngle = Math.atan2(
      -(firstCoordinates.y - secondCoordinates.y),
      -(firstCoordinates.x - secondCoordinates.x),
    );

    let currentCoordinates = secondCoordinates;

    for (let i = 0; i < this.numberOfPoints - 2; i++) {
      let dx = length * Math.cos(startAngle - (i + 1) * externalAngle);
      let dy = length * Math.sin(startAngle - (i + 1) * externalAngle);

      currentCoordinates = currentCoordinates.add({ x: dx, y: dy });

      path.push('L', currentCoordinates.x, currentCoordinates.y);
    }

    path.push('L', firstCoordinates.x, firstCoordinates.y);

    path = path.join(' ');

    return path;
  }
}
