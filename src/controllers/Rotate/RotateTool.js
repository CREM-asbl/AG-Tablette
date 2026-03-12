
import { appActions } from '../../store/appState';
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { addInfoToId, findObjectById } from '../Core/Tools/general';
import {
  compareIdBetweenLayers,
  duplicateShape,
} from '../Core/Tools/shapesTools';
import { getAllLinkedShapesInGeometry } from '../GeometryTools/general';
import {
  computeAllShapeTransform,
  computeConstructionSpec,
} from '../GeometryTools/recomputeShape';
import { rotateHelpConfig } from './rotate.helpConfig';

/**
 * Tourner une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class RotateTool extends Tool {
  constructor() {
    super('rotate', 'Tourner', 'move');

    this.centerDrawColor = '#080';

    this.currentStep = null; // listen-canvas-click -> rotate

    //La figure que l'on déplace
    this.selectedShape = null;

    //L'angle initial entre le centre de la figure et la position de la souris
    this.initialAngle = null;

    /*
        L'ensemble des figures liées à la figure sélectionnée, y compris la figure
        elle-même
         */
    this.involvedShapes = [];
  }

  

  start() {
    helpConfigRegistry.register(this.name, rotateHelpConfig);

    appActions.setActiveTool(this.name);

    setTimeout(
      () => {
        appActions.setCurrentStep('listen');
      },
      50,
    );
  }

  listen() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    if (app.tool.currentStep !== 'listen') {
      appActions.setCurrentStep('listen');
    }

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist =
      app.mainCanvasLayer.shapes.filter((s) => s instanceof SinglePointShape);
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  rotate() {
    this.removeListeners();
    if (app.tool.currentStep !== 'rotate') {
      appActions.setCurrentStep('rotate');
    }
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  end() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();
  }

  /**
   * Appelée par événement du SelectManager quand une figure est sélectionnée (canvasMouseDown)
   */
  objectSelected(shape) {
    if (app.tool.currentStep !== 'listen') return;
    if (!shape) return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    if (app.environment.name === 'Geometrie') {
      this.involvedShapes = ShapeManager.getAllBindedShapesInGeometry(shape);
      for (let i = 0; i < this.involvedShapes.length; i++) {
        const currentShape = this.involvedShapes[i];
        if (currentShape.geometryObject?.geometryTransformationName !== null) {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message:
                  'Les images issues de transfomation ne peuvent pas être tournées.',
              },
            }),
          );
          return;
        }
        if (currentShape.familyName === 'multipliedVector') {
          window.dispatchEvent(
            new CustomEvent('show-notif', {
              detail: {
                message:
                  "Les vecteurs multipliés ne peuvent pas être tournés, mais peuvent l'être via leur parent.",
              },
            }),
          );
          return;
        }
      }
      const shapesToAdd = [];
      this.involvedShapes.forEach((s) => {
        s.geometryObject?.geometryMultipliedChildShapeIds.forEach((sId) => {
          shapesToAdd.push(findObjectById(sId));
        });
      });
      this.involvedShapes.push(...shapesToAdd);
    }

    this.shapesToCopy = [...this.involvedShapes];
    this.shapesToCopy.forEach((s) => {
      getAllLinkedShapesInGeometry(s, this.shapesToCopy, false);
    });

    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.center = shape.centerCoordinates;
    this.initialAngle = this.center.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.lastAngle = this.initialAngle;

    this.shapesToCopy.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
    this.drawingShapes = this.shapesToCopy.map((s) => duplicateShape(s));
    this.shapesToMove = this.drawingShapes.filter((s) =>
      this.involvedShapes.find((inShape) =>
        compareIdBetweenLayers(inShape.id, s.id),
      ),
    );

    if (app.environment.name !== 'Cubes')
      new Point({
        coordinates: this.center,
        layer: 'upper',
        color: this.centerDrawColor,
      });

    app.mainCanvasLayer.editingShapeIds = this.shapesToCopy.map((s) => s.id);

    app.upperCanvasLayer.shapes.forEach((s) => {
      s.geometryObject?.geometryDuplicateChildShapeIds.forEach(
        (duplicateChildId) => {
          const duplicateChild = findObjectById(duplicateChildId);
          computeConstructionSpec(duplicateChild);
        },
      );
    });

    appActions.setCurrentStep('rotate');
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep !== 'rotate') return;

    this.executeAction();
    appActions.setCurrentStep('listen');
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (app.tool.currentStep === 'rotate') {
      const newAngle = this.center.angleWith(
        app.workspace.lastKnownMouseCoordinates,
      ),
        diffAngle = newAngle - this.lastAngle;

      this.lastAngle = newAngle;
      this.shapesToMove.forEach((s) => {
        s.rotate(diffAngle, this.center);
        computeAllShapeTransform(s, 'upper', false);
      });
    }
    this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
  }

  _executeAction() {
    const centerCoordinates = this.selectedShape.centerCoordinates;
    const adjustment = getShapeAdjustment(
      this.shapesToMove,
      this.selectedShape,
    );
    app.mainCanvasLayer.editingShapeIds
      .filter((editingShapeId) =>
        this.shapesToMove.some(
          (shapeToMove) =>
            shapeToMove.id === addInfoToId(editingShapeId, 'upper'),
        ),
      )
      .forEach((sId, idxS) => {
        const s = findObjectById(sId);
        s.points.forEach((pt, idxPt) => {
          pt.coordinates = new Coordinates(
            this.shapesToMove[idxS].points[idxPt].coordinates,
          );
          if (this.pointOnLineRatio) pt.ratio = this.pointOnLineRatio;
        });

        s.rotate(adjustment.rotationAngle, centerCoordinates);
        s.translate(adjustment.translation);
      });
    if (app.environment.name === 'Geometrie') {
      app.mainCanvasLayer.shapes.forEach((s) => {
        s.geometryObject?.geometryDuplicateChildShapeIds.forEach(
          (duplicateChildId) => {
            const duplicateChild = findObjectById(duplicateChildId);
            computeConstructionSpec(duplicateChild);
          },
        );
      });
      app.mainCanvasLayer.editingShapeIds.forEach((sId, idxS) => {
        const s = findObjectById(sId);
        computeAllShapeTransform(s, 'main', false);
      });
    }
  }
}
