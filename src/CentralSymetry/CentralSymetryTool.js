import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 */
export class CentralSymetryTool extends Tool {
  constructor() {
    super('centralSymetry', 'Symétrie centrale', 'transformation');

    this.duration = app.settings.geometryTransformationAnimationDuration;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();

    this.reference = null;

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        app.upperDrawingEnvironment.removeObjectById(s.id);
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
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep == 'selectReference') {
      this.reference = object;
      new Point({
        coordinates: this.reference.coordinates,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: app.settings.referenceDrawColor,
        size: 2,
      });
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
    } else {
      this.involvedShapes = ShapeManager.getAllBindedShapes(object, true);
      this.drawingShapes = this.involvedShapes.map(
        (s) =>
        new Shape({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale'),
          id: undefined,
          divisionPointInfos: s.segments.map((seg, idx) => seg.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: idx };
          })).flat(),
        }),
      );
      setState({
        tool: {
          ...app.tool,
          currentStep: 'central'
        }
      });
    }
  }

  animate() {
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      app.upperDrawingEnvironment.points.forEach((point) => {
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
      app.upperDrawingEnvironment.points.forEach((point) => {
        if (point.startCoordinates)
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
      });
    }
  }

  _executeAction() {
    this.involvedShapes.forEach(s => {
      let newShape = new Shape({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
        id: undefined,
        path: s.getSVGPath('no scale'),
        geometryTransformationCharacteristicElementIds: [this.reference.id],
        geometryTransformationParentShapeId: s.id,
        geometryTransformationChildShapeIds: [],
        geometryTransformationName: 'centralSymetry',
      });
      s.geometryTransformationChildShapeIds.push(newShape.id);
      let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryTransformationCharacteristicElementIds[0], 'point');
      if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
        ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
      }
      newShape.rotate(Math.PI, this.reference.coordinates);
    });
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
