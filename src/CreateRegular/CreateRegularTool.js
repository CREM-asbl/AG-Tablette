import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { createElem } from '../Core/Tools/general';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreateRegularTool extends Tool {
  constructor() {
    super(
      'createRegularPolygon',
      'Dessiner un polygone régulier',
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
      <h3>${toolName}</h3>
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
      layer: 'upper',
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
      layer: 'upper',
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

      setState({ tool: { ...app.tool, currentStep: 'drawSecondPoint' } });
    } else {
      this.stopAnimation();
      if (SelectManager.areCoordinatesInMagnetismDistance(this.firstPoint.coordinates, this.secondPoint.coordinates)) {
        let firstPointCoordinates = this.firstPoint.coordinates;
        app.upperCanvasLayer.removeAllObjects();
        this.firstPoint = new Point({
          layer: 'upper',
          coordinates: firstPointCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
        });
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez placer le point autre part.' } }));
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'drawSecondPoint' } });
        return;
      }
      this.adjustPoint(this.secondPoint);
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'drawFirstPoint' },
      });
      this.executeAction();
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
      point.coordinates = new Coordinates(adjustedCoordinates.coordinates);
    } else {
      let gridPoint = app.gridCanvasLayer.getClosestGridPoint(point.coordinates);
      if (gridPoint)
        point.coordinates = new Coordinates(gridPoint.coordinates);
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'animateFirstPoint') {
      this.firstPoint.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.firstPoint);
    } else if (app.tool.currentStep == 'animateSecondPoint') {
      this.secondPoint.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.secondPoint);

      let path = this.getPath(
        this.firstPoint.coordinates,
        this.secondPoint.coordinates,
      );

      if (this.shapeDrawnId)
        app.upperCanvasLayer.removeObjectById(this.shapeDrawnId);

      let shape = new RegularShape({
        path: path,
        layer: 'upper',
        strokeColor: app.settings.temporaryDrawColor,
        fillOpacity: 0,
      });
      this.shapeDrawnId = shape.id;
      shape.vertexes.forEach(vx => {
        vx.color = app.settings.temporaryDrawColor;
        vx.size = 2;
      })
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

  _executeAction() {
    let shapeDrawn = app.upperCanvasLayer.findObjectById(this.shapeDrawnId);

    let shape = new RegularShape({
      ...shapeDrawn,
      layer: 'main',
      path: shapeDrawn.getSVGPath('no-scale'),
      familyName: 'Regular',
      strokeColor: '#000000',
      fillOpacity: 0,
      geometryObject: new GeometryObject({}),
    });

    let transformation = getShapeAdjustment([shape], shape);
    shape.rotate(transformation.rotationAngle, shape.centerCoordinates);
    shape.translate(transformation.translation);
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
    app.upperCanvasLayer.removeAllObjects();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }
}
