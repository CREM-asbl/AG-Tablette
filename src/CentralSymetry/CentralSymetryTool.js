import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';
import { SelectManager } from '../Core/Managers/SelectManager';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { findObjectById, removeObjectById } from '../Core/Tools/general';

/**
 */
export class CentralSymetryTool extends Tool {
  constructor() {
    super('centralSymetry', 'Symétrie centrale', 'transformation');
  }

  start() {
    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation ? app.settings.geometryTransformationAnimationDuration : 0.001;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.reference = null;
    this.pointDrawn = null;

    this.setSelectionConstraints();
    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  animateRefPoint() {
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.points.canSelect = true;
    this.animate();
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        removeObjectById(s.id);
      })
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  central() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  canvasMouseDown() {
    let coord = app.workspace.lastKnownMouseCoordinates;
    this.pointDrawn = new Point({
      coordinates: coord,
      layer: 'upper',
      color: app.settings.referenceDrawColor,
      size: 2,
    });
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateRefPoint' } });
  }

  canvasMouseUp() {
    this.stopAnimation();

    let coord = app.workspace.lastKnownMouseCoordinates;
    let object = SelectManager.selectObject(coord);
    if (object) {
      this.reference = object;
    } else {
      this.reference = this.pointDrawn;
    }
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
  }

  objectSelected(object) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(object);
    if (app.environment.name == 'Geometrie') {
      this.involvedShapes = ShapeManager.getAllBindedShapesInGeometry(object);
    }
    this.drawingShapes = this.involvedShapes.map(
      (s) =>
      new s.constructor({
        ...s,
        layer: 'upper',
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
        currentStep: 'central'
      }
    });
  }

  animate() {
    if (app.tool.currentStep == 'animateRefPoint') {
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      this.requestAnimFrameId = window.requestAnimationFrame(() =>
        this.animate(),
      );
      return;
    }
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      app.upperCanvasLayer.points.forEach((point) => {
        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (this.reference.x - point.x),
          y: point.y + 2 * (this.reference.y - point.y),
        });
      });
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name == 'centralSymetry') {
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
    if (app.tool.currentStep == 'central') {
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates)
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
      });
    } else if (app.tool.currentStep == 'animateRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointDrawn.coordinates = object.coordinates;
      } else {
        this.pointDrawn.coordinates = coord;
      }
    }
  }

  _executeAction() {
    if (this.reference instanceof Point && this.reference.layer == 'upper') {
      let coord = this.reference.coordinates;
      this.reference = new SinglePointShape({
        layer: 'main',
        path: `M ${coord.x} ${coord.y}`,
        name: 'Point',
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      }).points[0];
    }
    let newShapes = [];
    this.involvedShapes.forEach(s => {
      let newShape = new s.constructor({
        ...s,
        layer: 'main',
        familyName: 'transformation',
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
          geometryTransformationCharacteristicElementIds: [this.reference.id],
          geometryTransformationName: 'centralSymetry',
        }),
      });
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      let ref = findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0]);
      if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
        ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      }
      newShape.rotate(Math.PI, this.reference.coordinates);
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
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
