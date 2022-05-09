import { html } from 'lit';
import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { createElem } from '../Core/Tools/general';
import { GridManager } from '../Grid/GridManager';

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
    this.geometryParentObjectId1 = null;
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
    app.upperCanvasElem.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    import('./points-list');
    createElem('points-list');
  }

  drawPoint() {
    app.upperCanvasElem.removeAllObjects();
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

  end() {
    this.removeListeners();
    this.stopAnimation();
  }

  objectSelected(segment) {
    new LineShape({
      drawingEnvironment: app.upperCanvasElem,
      strokeColor: app.settings.temporaryDrawColor,
      strokeWidth: 2,
      path: segment.getSVGPath('no scale', true),
      id: undefined,
      fillColor: '#000',
      fillOpacity: 0,
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    if (app.tool.currentStep == 'drawPoint') {
      this.geometryParentObjectId1 = segment.id;
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectSecondSegment' } });
    } else {
      if (this.geometryParentObjectId1 == segment.id) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez sélectionner deux objets différents.' } }));
        return
      }
      this.geometryParentObjectId2 = segment.id;
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
      drawingEnvironment: app.upperCanvasElem,
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
        let gridPoint = GridManager.getClosestGridPoint(point.coordinates);
        if (gridPoint)
          point.coordinates = new Coordinates(gridPoint.coordinates);
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
          this.geometryParentObjectId1 = reference.id;
        } else {
          this.geometryParentObjectId1 = null;
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
          this.geometryParentObjectId1 = reference.id;
        } else {
          this.geometryParentObjectId1 = null;
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
      shape = new SinglePointShape({
        drawingEnvironment: app.mainCanvasElem,
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
    } else if (app.tool.selectedPoint == 'PointOnLine') {
      if (!this.geometryParentObjectId1) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez choisir une ligne pour placer le point.' } }));
        return;
      }
      shape = new SinglePointShape({
        drawingEnvironment: app.mainCanvasElem,
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
      shape.geometryObject.geometryParentObjectId1 = this.geometryParentObjectId1;
      let reference = app.mainCanvasElem.findObjectById(this.geometryParentObjectId1, 'segment');

      let ratioX = (shape.points[0].coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
      let ratioY = (shape.points[0].coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
      let ratio = ratioX;
      if (isNaN(ratio))
        ratio = ratioY;
      if (reference.shape.name == 'Circle') {
        let refShape = reference.shape;
        const angle = refShape.segments[0].arcCenter.coordinates.angleWith(shape.points[0].coordinates);
        const refAngle = refShape.segments[0].arcCenter.coordinates.angleWith(refShape.vertexes[0].coordinates);
        ratio = (angle - refAngle) / Math.PI / 2;
        if (ratio < 0)
          ratio += 1;
      }

      shape.points[0].ratio = ratio;

      reference.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    } else if (app.tool.selectedPoint == 'PointOnShape') {
      if (!this.geometryParentObjectId1) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez choisir une figure pour placer le point.' } }));
        return;
      }
      shape = new RegularShape({
        drawingEnvironment: app.mainCanvasElem,
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedPoint,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
      shape.geometryObject.geometryParentObjectId1 = this.geometryParentObjectId1;
      let reference = app.mainCanvasElem.findObjectById(this.geometryParentObjectId1, 'shape');
      reference.geometryObject.geometryChildShapeIds.push(shape.id);
    } else if (app.tool.selectedPoint == 'PointOnIntersection') {
      let firstSeg = app.mainCanvasElem.findObjectById(this.geometryParentObjectId1, 'segment');
      let secondSeg = app.mainCanvasElem.findObjectById(this.geometryParentObjectId2, 'segment');
      let coords =  firstSeg.intersectionWith(secondSeg);
      if (!coords) {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Il n\' a pas de point d\'intersection entre les deux objets sélectionnés.' } }));
        return;
      }
      if (coords.length == 1)
        coords[1] = new Coordinates({ x: coords[0].x, y: coords[0].y});
      shape = new SinglePointShape({
        drawingEnvironment: app.mainCanvasElem,
        path: coords.map(coord => `M ${coord.x} ${coord.y}`).join(' '),
        name: app.tool.selectedPoint,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
      shape.geometryObject.geometryParentObjectId1 = this.geometryParentObjectId1;
      shape.geometryObject.geometryParentObjectId2 = this.geometryParentObjectId2;
      firstSeg.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      secondSeg.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    }
  }
}
