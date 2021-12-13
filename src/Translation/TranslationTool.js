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
export class TranslationTool extends Tool {
  constructor() {
    super('translation', 'Translation', 'transformation');

    this.duration = app.settings.geometryTransformationAnimationDuration;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } }), 50);
  }

  selectFirstReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
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
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep == 'selectReference') {
      if (this.firstReference == null) {
        this.firstReference = object;
        new Point({
          coordinates: this.firstReference.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 2,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
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
        let angle = this.secondReference.coordinates.angleWith(this.firstReference.coordinates);
        let firstTriangleCoord = this.secondReference.coordinates.add(new Coordinates({
          x: 20 * Math.cos(angle + 0.35),
          y: 20 * Math.sin(angle + 0.35),
        }));
        let secondTriangleCoord = this.secondReference.coordinates.add(new Coordinates({
          x: 20 * Math.cos(angle - 0.35),
          y: 20 * Math.sin(angle - 0.35),
        }));
        this.referenceShape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${this.firstReference.coordinates.x} ${this.firstReference.coordinates.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y}`,
          borderColor: app.settings.referenceDrawColor,
          color: app.settings.referenceDrawColor,
          borderSize: 2,
          isPointed: false,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      }
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
      let vector = this.secondReference.coordinates.substract(this.firstReference.coordinates);
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
    this.involvedShapes.forEach(s => {
      let newShape = new Shape({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
        id: undefined,
        path: s.getSVGPath('no scale'),
        geometryTransformationCharacteristicElementIds: [this.firstReference.id, this.secondReference.id],
        geometryTransformationParentShapeId: s.id,
        geometryTransformationChildShapeIds: [],
        geometryTransformationName: 'translation',
      });
      s.geometryTransformationChildShapeIds.push(newShape.id);
      let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryTransformationCharacteristicElementIds[0], 'point');
      if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
        ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
      }
      ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryTransformationCharacteristicElementIds[1], 'point');
      if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
        ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
      }
      newShape.translate(this.secondReference.coordinates.substract(this.firstReference.coordinates));
    });

    // // let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    // // let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape, true);
    // // involvedShapes.forEach((s) => {
    // let newShape = new Shape({
    //   ...this.object,
    //   drawingEnvironment: app.mainDrawingEnvironment,
    //   id: undefined,
    //   path: this.object.getSVGPath('no scale'),
    // });
    // newShape.translate(this.secondReference.coordinates.substract(this.firstReference.coordinates));
    // // });
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
