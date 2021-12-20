import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 */
export class OrthogonalSymetryTool extends Tool {
  constructor() {
    super('orthogonalSymetry', 'Symétrie orthogonale', 'transformation');

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
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    this.longPressId = app.addListener('canvasLongPress', this.handler);
  }

  ortho() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
    this.removeListeners();
  }

  canvasLongPress() {
    let coordinates = app.workspace.lastKnownMouseCoordinates;
    this.potentialShapes = ShapeManager.shapesThatContainsCoordinates(coordinates);
    import('./select-menu');
    let elem = createElem('select-menu');
    elem.potentialShapes = this.potentialShapes;

    window.addEventListener('shapeSelected', e => {
      this.object = app.mainDrawingEnvironment.findObjectById(e.detail.shapeId);
      if (this.object)
        this.animate();
        // this.executeAction();
    }, { once: true });
  }

  objectSelected(object) {
    if (app.tool.currentStep == 'selectReference') {
      if (this.firstReference == null) {
        this.firstReference = object;
        if (object instanceof Point) {
          new Point({
            coordinates: this.firstReference.coordinates,
            drawingEnvironment: app.upperDrawingEnvironment,
            color: app.settings.referenceDrawColor,
            size: 2,
          });
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
        } else {
          this.referenceShape = new Shape({
            drawingEnvironment: app.upperDrawingEnvironment,
            path: this.firstReference.getSVGPath('scale', true),
            borderColor: app.settings.referenceDrawColor,
            borderSize: 2,
          });
          this.referenceShape.segments[0].isInfinite = true;
          setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
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
        this.referenceShape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${this.firstReference.coordinates.x} ${this.firstReference.coordinates.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y}`,
          borderColor: app.settings.referenceDrawColor,
          borderSize: 2,
        });
        this.referenceShape.segments[0].isInfinite = true;
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
      // app.mainDrawingEnvironment.editingShapeIds = this.involvedShapes.map(
      //   (s) => s.id,
      // );
      setState({
        tool: {
          ...app.tool,
          currentStep: 'ortho'
        }
      });
      // this.executeAction();
    }
  }

  animate() {
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      app.upperDrawingEnvironment.points.forEach((point) => {
        let center = this.referenceShape.segments[0].projectionOnSegment(point);

        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (center.x - point.x),
          y: point.y + 2 * (center.y - point.y),
        });
      });
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name == 'orthogonalSymetry') {
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
    if (app.tool.currentStep == 'ortho') {
      app.upperDrawingEnvironment.points.forEach((point) => {
        if (point.startCoordinates)
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(this.progress),
          );
      });

      if (this.progress >= 0.5 && this.lastProgress < 0.5) {
        // milieu animation
        app.upperDrawingEnvironment.shapes.forEach((s) => {
          s.reverse();
        });
      }
    }
  }

  _executeAction() {
    let selectedAxis = this.referenceShape.segments[0];

    this.involvedShapes.forEach(s => {
      let newShape = new Shape({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
        id: undefined,
        path: s.getSVGPath('no scale'),
        geometryTransformationCharacteristicElementIds: [this.firstReference.id],
        geometryTransformationParentShapeId: s.id,
        geometryTransformationChildShapeIds: [],
        geometryTransformationName: 'orthogonalSymetry',
      });
      if (this.secondReference)
        newShape.geometryTransformationCharacteristicElementIds.push(this.secondReference.id);
      s.geometryTransformationChildShapeIds.push(newShape.id);
      if (newShape.geometryTransformationCharacteristicElementIds.length == 1) {
        let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryTransformationCharacteristicElementIds[0], 'segment');
        if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
        }
      } else {
        newShape.geometryTransformationCharacteristicElementIds.forEach(refId => {
          let ref = app.mainDrawingEnvironment.findObjectById(refId, 'point');
          if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
            ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
          }
        });
      }
      this.reverseShape(newShape, selectedAxis);
    });
  }

  reverseShape(shape, selectedAxis) {
    shape.points.forEach((pt) => {
      this.computePointPosition(pt, selectedAxis);
    });
  }

  /**
   * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale
   * @param  {Point} point    le point
   * @param  {Object} axe      L'axe de symétrie
   * @return {Point}          Nouvelles coordonnées
   */
  computePointPosition(point, selectedAxis) {
    let center = selectedAxis.projectionOnSegment(point);

    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    point.coordinates = point.coordinates.add(
      center.substract(point.coordinates).multiply(2),
    );
  }

  setSelectionConstraints() {
    if (app.tool.currentStep == 'selectReference') {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      if (this.firstReference == null) {
        app.workspace.selectionConstraints.segments.canSelect = true;
        app.workspace.selectionConstraints.points.canSelect = true;
      } else {
        app.workspace.selectionConstraints.points.canSelect = true;
      }
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.click_all_shape;
    }
  }
}
