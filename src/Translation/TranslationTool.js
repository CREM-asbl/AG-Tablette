import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';
import { SelectManager } from '../Core/Managers/SelectManager';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Segment } from '../Core/Objects/Segment';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';

/**
 */
export class TranslationTool extends Tool {
  constructor() {
    super('translation', 'Translation', 'transformation');
  }

  start() {
    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation ? app.settings.geometryTransformationAnimationDuration : 0.001;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } }), 50);
  }

  selectFirstReference() {
    app.upperCanvasElem.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.pointsDrawn = [];
    this.firstReference = null;
    this.secondReference = null;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    this.removeListeners();

    this.setSelectionConstraints();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateFirstRefPoint() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  animateSecondRefPoint() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  selectObject() {
    this.removeListeners();

    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        app.upperCanvasElem.removeObjectById(s.id);
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
    app.upperCanvasElem.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  canvasMouseDown() {
    let coord = app.workspace.lastKnownMouseCoordinates;
    if (this.firstReference == null) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.shapes.canSelect = true;
      let object = SelectManager.selectObject(coord);
      if (object instanceof ArrowLineShape && !object.segments[0].isArc()) {
        this.firstReference = object;
        new ArrowLineShape({
          path: object.getSVGPath('no scale', true),
          drawingEnvironment: app.upperCanvasElem,
          strokeColor: app.settings.referenceDrawColor,
          strokeWidth: 2,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      } else {
        this.pointsDrawn.push(new Point({
          coordinates: coord,
          drawingEnvironment: app.upperCanvasElem,
          color: app.settings.referenceDrawColor,
          size: 2,
        }));
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateFirstRefPoint' } });
      }
    } else {
      this.pointsDrawn.push(new Point({
        coordinates: coord,
        drawingEnvironment: app.upperCanvasElem,
        color: app.settings.referenceDrawColor,
        size: 2,
      }));
      let segment = new Segment({
        drawingEnvironment: app.upperCanvasElem,
        vertexIds: this.pointsDrawn.map((pt) => pt.id),
      });
      new ArrowLineShape({
        drawingEnvironment: app.upperCanvasElem,
        segmentIds: [segment.id],
        pointIds: this.pointsDrawn.map((pt) => pt.id),
        strokeColor: app.settings.referenceDrawColor,
        strokeWidth: 2,
      });
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateSecondRefPoint' } });
    }
  }

  canvasMouseUp() {
    this.stopAnimation();

    if (app.tool.currentStep == 'animateFirstRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.firstReference = object;
      } else {
        this.firstReference = this.pointsDrawn[0];
      }
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
    } else {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.secondReference = object;
      } else {
        this.secondReference = this.pointsDrawn[1];
      }
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
    }
  }

  objectSelected(object) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(object);
    this.drawingShapes = this.involvedShapes.map(
      (s) =>
        new s.constructor({
          ...s,
          drawingEnvironment: app.upperCanvasElem,
          path: s.getSVGPath('no scale', false),
          id: undefined,
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
          }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
        }),
    );
    setState({
      tool: {
        ...app.tool,
        currentStep: 'trans'
      }
    });
  }

  animate() {
    if (app.tool.currentStep == 'animateFirstRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    } else if (app.tool.currentStep == 'animateSecondRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    }
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
      app.upperCanvasElem.points.forEach((point) => {
        if (point.startCoordinates) {
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
        }
      });
    } else if (app.tool.currentStep == 'animateFirstRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[0].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[0].coordinates = coord;
      }
    } else if (app.tool.currentStep == 'animateSecondRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[1].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[1].coordinates = coord;
      }
    }
  }

  _executeAction() {
    if (this.firstReference instanceof Point && this.firstReference.drawingEnvironment.name == 'upper') {
      let coord = this.firstReference.coordinates;
      this.firstReference = new SinglePointShape({
        drawingEnvironment: app.mainCanvasElem,
        path: `M ${coord.x} ${coord.y}`,
        name: 'Point',
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      }).points[0];
    }
    if (this.firstReference instanceof Point && this.secondReference.drawingEnvironment.name == 'upper') {
      let coord = this.secondReference.coordinates;
      this.secondReference = new SinglePointShape({
        drawingEnvironment: app.mainCanvasElem,
        path: `M ${coord.x} ${coord.y}`,
        name: 'Point',
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      }).points[0];
    }
    let geometryTransformationCharacteristicElementIds = this.firstReference instanceof Point ? [this.firstReference.id, this.secondReference.id] : [this.firstReference.id];

    let newShapes = [];
    this.involvedShapes.forEach(s => {
      let newShape = new s.constructor({
        ...s,
        drawingEnvironment: app.mainCanvasElem,
        id: undefined,
        path: s.getSVGPath('no scale', false),
        divisionPointInfos: s.divisionPoints.map((dp) => {
          return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, color: dp.color };
        }),
        segmentsColor: s.segments.map((seg) => {
          return seg.color;
        }),
        pointsColor: s.points.map((pt) => {
          return pt.color;
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
        let ref = app.mainCanvasElem.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0], 'point');
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
        ref = app.mainCanvasElem.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[1], 'point');
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
        newShape.translate(this.secondReference.coordinates.substract(this.firstReference.coordinates));
      } else {
        let ref = app.mainCanvasElem.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0], 'shape');
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
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
