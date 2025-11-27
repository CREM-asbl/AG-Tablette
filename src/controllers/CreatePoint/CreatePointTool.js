import points from '@controllers/Core/ShapesKits/points.json';
import { html } from 'lit';
import { app, setState } from '../Core/App';
import { appActions } from '../../store/appState';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { findObjectById } from '../Core/Tools/general';
import { computeConstructionSpec } from '../GeometryTools/recomputeShape';

/**
 * Ajout de figures sur l'espace de travail
 */
export class CreatePointTool extends Tool {
  constructor() {
    super('createPoint', 'Construire un point', 'geometryCreator');

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
    const toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    import('@components/shape-selector');
    appActions.setToolUiState({
      name: 'shape-selector',
      family: 'Points',
      templatesNames: points,
      selectedTemplate: app.tool.selectedTemplate,
      type: 'Geometry',
      nextStep: 'drawPoint',
    });
  }

  drawPoint() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();

    if (app.tool.selectedTemplate.name === 'PointOnIntersection') {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.click_all_segments;
      this.objectSelectedId = app.addListener('objectSelected', this.handler);
    } else {
      this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
    }
  }

  selectSecondSegment() { }

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
      layer: 'upper',
      strokeColor: app.settings.temporaryDrawColor,
      strokeWidth: 2,
      path: segment.getSVGPath('no scale', true),
      id: undefined,
      fillColor: '#000',
      fillOpacity: 0,
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    if (app.tool.currentStep === 'drawPoint') {
      this.geometryParentObjectId1 = segment.id;
      setState({
        tool: {
          ...app.tool,
          name: this.name,
          currentStep: 'selectSecondSegment',
        },
      });
    } else {
      if (this.geometryParentObjectId1 === segment.id) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: {
              message: 'Veuillez sélectionner deux objets différents.',
            },
          }),
        );
        return;
      }
      this.geometryParentObjectId2 = segment.id;
      this.executeAnimation();
    }
  }

  executeAnimation() {
    window.clearTimeout(this.timeoutRef);
    this.timeoutRef = window.setTimeout(() => {
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' },
      });
    }, 200);
  }

  canvasMouseDown() {
    // Validation des coordonnées
    if (!app.workspace.lastKnownMouseCoordinates) {
      console.error('Coordonnées de souris non disponibles');
      return;
    }

    const newCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );

    this.point = new Point({
      layer: 'upper',
      coordinates: newCoordinates,
      color: app.settings.temporaryDrawColor,
      size: 2,
    });

    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'animatePoint' },
    });
  }

  canvasMouseUp() {
    this.stopAnimation();
    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'drawPoint' },
    });
  }

  adjustPoint(point) {
    // Validation des paramètres d'entrée
    if (!point || !point.coordinates) {
      console.error('Point invalide fourni à adjustPoint');
      return;
    }

    point.adjustedOn = undefined;
    let reference, newCoord;
    if (
      app.tool.selectedTemplate.name === 'Point' ||
      app.environment.name === 'Geometrie'
    ) {
      // Convertir les coordonnées du point en espace canvas pour getClosestGridPoint
      const pointInCanvasSpace = point.coordinates.toCanvasCoordinates();
      const gridPointInCanvasSpace =
        app.gridCanvasLayer.getClosestGridPoint(pointInCanvasSpace);
      if (gridPointInCanvasSpace) {
        // Reconvertir le point de grille trouvé en espace monde
        const gridPointInWorldSpace =
          gridPointInCanvasSpace.fromCanvasCoordinates();
        point.coordinates = new Coordinates(gridPointInWorldSpace);
        point.adjustedOn = gridPointInWorldSpace;
      }
    }
    switch (app.tool.selectedTemplate.name) {
      case 'PointOnLine':
        reference = SelectManager.selectSegment(point.coordinates, {
          canSelect: true,
        });
        if (reference) {
          newCoord = reference.projectionOnSegment(point.coordinates);
          this.geometryParentObjectId1 = reference.id;
        } else {
          this.geometryParentObjectId1 = null;
        }
        if (newCoord) point.coordinates = newCoord;
        break;
      case 'PointOnShape':
        reference = SelectManager.selectShape(point.coordinates, {
          canSelect: true,
        });
        if (reference) {
          this.geometryParentObjectId1 = reference.id;
        } else {
          this.geometryParentObjectId1 = null;
        }
        break;
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep === 'animatePoint') {
      this.point.coordinates = new Coordinates(
        app.workspace.lastKnownMouseCoordinates,
      );
      this.adjustPoint(this.point);
    }
  }

  _executeAction() {
    let shape;
    if (app.tool.selectedTemplate.name === 'Point') {
      shape = new SinglePointShape({
        layer: 'main',
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedTemplate.name,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
    } else if (app.tool.selectedTemplate.name === 'PointOnLine') {
      if (!this.geometryParentObjectId1) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: {
              message: 'Veuillez choisir une ligne pour placer le point.',
            },
          }),
        );
        return;
      }
      shape = new SinglePointShape({
        layer: 'main',
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedTemplate.name,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
      shape.geometryObject.geometryParentObjectId1 =
        this.geometryParentObjectId1;

      computeConstructionSpec(shape);

      const reference = findObjectById(this.geometryParentObjectId1);
      reference.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    } else if (app.tool.selectedTemplate.name === 'PointOnShape') {
      if (!this.geometryParentObjectId1) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: {
              message: 'Veuillez choisir une figure pour placer le point.',
            },
          }),
        );
        return;
      }
      shape = new RegularShape({
        layer: 'main',
        path: `M ${this.point.coordinates.x} ${this.point.coordinates.y}`,
        name: app.tool.selectedTemplate.name,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
      shape.geometryObject.geometryParentObjectId1 =
        this.geometryParentObjectId1;
      const reference = findObjectById(this.geometryParentObjectId1);
      reference.geometryObject.geometryChildShapeIds.push(shape.id);
    } else if (app.tool.selectedTemplate.name === 'PointOnIntersection') {
      const firstSeg = findObjectById(this.geometryParentObjectId1);
      const secondSeg = findObjectById(this.geometryParentObjectId2);
      const coords = firstSeg.intersectionWith(secondSeg);
      if (!coords) {
        window.dispatchEvent(
          new CustomEvent('show-notif', {
            detail: {
              message:
                "Il n' a pas de point d'intersection entre les deux objets sélectionnés.",
            },
          }),
        );
        return;
      }
      if (coords.length === 1)
        coords[1] = new Coordinates({ x: coords[0].x, y: coords[0].y });
      shape = new SinglePointShape({
        layer: 'main',
        path: coords.map((coord) => `M ${coord.x} ${coord.y}`).join(' '),
        name: app.tool.selectedTemplate.name,
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      });
      shape.geometryObject.geometryParentObjectId1 =
        this.geometryParentObjectId1;
      shape.geometryObject.geometryParentObjectId2 =
        this.geometryParentObjectId2;
      firstSeg.shape.geometryObject.geometryChildShapeIds.push(shape.id);
      secondSeg.shape.geometryObject.geometryChildShapeIds.push(shape.id);
    }
  }
}
