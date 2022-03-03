import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';

/**
 */
export class TranslationTool extends Tool {
  constructor() {
    super('translation', 'Translation', 'transformation');
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation ? app.settings.geometryTransformationAnimationDuration : 0.001;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } }), 50);
  }

  selectFirstReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.firstReference = null;
    this.secondReference = null;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        app.upperDrawingEnvironment.removeObjectById(s.id);
      })

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  trans() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep == 'selectReference') {
      if (this.firstReference == null) {
        if (object instanceof ArrowLineShape && !object.segments[0].arcCenter) {
          this.firstReference = object;
          new ArrowLineShape({
            path: object.getSVGPath('no scale', true),
            drawingEnvironment: app.upperDrawingEnvironment,
            strokeColor: app.settings.referenceDrawColor,
          });
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
        } else if (object instanceof Point) {
          this.firstReference = object;
          new Point({
            coordinates: this.firstReference.coordinates,
            drawingEnvironment: app.upperDrawingEnvironment,
            color: app.settings.referenceDrawColor,
            size: 2,
          });
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
        } else {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez sélectionner un vecteur ou un point.' } }))
          return;
        }
      } else {
        this.secondReference = object;
        if (this.secondReference.id == this.firstReference.id) {
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } });
          return;
        }
        new Point({
          coordinates: this.secondReference.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 2,
        });
        this.referenceShape = new ArrowLineShape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${this.firstReference.coordinates.x} ${this.firstReference.coordinates.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y}`,
          strokeColor: app.settings.referenceDrawColor,
          fillColor: app.settings.referenceDrawColor,
          strokeWidth: 2,
          isPointed: false,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      }
    } else {
      this.involvedShapes = ShapeManager.getAllBindedShapes(object, true);
      this.drawingShapes = this.involvedShapes.map(
        (s) =>
          new s.constructor({
            ...s,
            drawingEnvironment: app.upperDrawingEnvironment,
            path: s.getSVGPath('no scale', false),
            id: undefined,
            divisionPointInfos: s.divisionPoints.map((dp) => {
              return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx };
            }),
          }),
      );
      // this.animate();
      setState({
        tool: {
          ...app.tool,
          currentStep: 'trans'
        }
      });
      // this.executeAction();
    }
  }

  animate() {
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      let vector;
      if (this.firstReference instanceof Point)
        vector = this.secondReference.coordinates.substract(this.firstReference.coordinates);
      else
        vector = this.firstReference.points[1].coordinates.substract(this.firstReference.points[0].coordinates);
      this.drawingShapes.forEach(s => s.points.forEach((point) => {
        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + vector.x,
          y: point.y + vector.y,
        });
      }));
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name == 'translation') {
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'selectObject' },
      });
    } else {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
    }
  }

  refreshStateUpper() {
    if (app.tool.currentStep == 'trans') {
      app.upperDrawingEnvironment.points.forEach((point) => {
        if (point.startCoordinates) {
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
        }
      });
    }
  }

  _executeAction() {
    let geometryTransformationCharacteristicElementIds = this.firstReference instanceof Point ? [this.firstReference.id, this.secondReference.id] : [this.firstReference.id];

    let newShapes = [];
    this.involvedShapes.forEach(s => {
      let newShape = new s.constructor({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
        id: undefined,
        path: s.getSVGPath('no scale', false),
        divisionPointInfos: s.divisionPoints.map((dp) => {
          return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx };
        }),
        geometryObject: new GeometryObject({
          geometryTransformationChildShapeIds: [],
          geometryTransformationParentShapeId: s.id,
          geometryTransformationCharacteristicElementIds,
          geometryTransformationName: 'translation',
        }),
      });
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      if (this.firstReference instanceof Point) {
        let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0], 'point');
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
        ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[1], 'point');
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
        newShape.translate(this.secondReference.coordinates.substract(this.firstReference.coordinates));
      } else {
        let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0], 'shape');
        if (!ref.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
        newShape.translate(this.firstReference.points[1].coordinates.substract(this.firstReference.points[0].coordinates))
      }
      newShapes.push(newShape);
    });
    if (newShapes.length > 1) {
      let group = new ShapeGroup(...newShapes.map(s => s.id));
      GroupManager.addGroup(group);
    }
  }

  setSelectionConstraints() {
    if (app.tool.currentStep == 'selectReference') {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.points.canSelect = true;
      app.workspace.selectionConstraints.shapes.canSelect = true;
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
