import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Tool } from '../Core/States/Tool';

/**
 */
export class OrthogonalSymetryTool extends Tool {
  constructor() {
    super('orthogonalSymetry', 'Symétrie orthogonale', 'transformation');
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
    this.mouseClickId = app.addListener('canvasClick', this.handler);
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        app.upperDrawingEnvironment.removeObjectById(s.id);
      })
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    // this.longPressId = app.addListener('canvasLongPress', this.handler);
  }

  canvasClick() {

  }

  ortho() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  // canvasLongPress() {
  //   let coordinates = app.workspace.lastKnownMouseCoordinates;
  //   this.potentialShapes = ShapeManager.shapesThatContainsCoordinates(coordinates);
  //   import('./select-menu');
  //   let elem = createElem('select-menu');
  //   elem.potentialShapes = this.potentialShapes;

  //   window.addEventListener('shapeSelected', e => {
  //     this.object = app.mainDrawingEnvironment.findObjectById(e.detail.shapeId);
  //     if (this.object)
  //       this.animate();
  //       // this.executeAction();
  //   }, { once: true });
  // }

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
          // dont select arc as symetry axe
          if (object.isArc()) {
            return;
          }
          this.referenceShape = new LineShape({
            drawingEnvironment: app.upperDrawingEnvironment,
            path: this.firstReference.getSVGPath('no scale', true),
            strokeColor: app.settings.referenceDrawColor,
            strokeWidth: 2,
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
        this.referenceShape = new LineShape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${this.firstReference.coordinates.x} ${this.firstReference.coordinates.y} L ${this.secondReference.coordinates.x} ${this.secondReference.coordinates.y}`,
          strokeColor: app.settings.referenceDrawColor,
          strokeWidth: 2,
        });
        this.referenceShape.segments[0].isInfinite = true;
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      }
    } else {
      this.involvedShapes = ShapeManager.getAllBindedShapes(object);
      this.drawingShapes = this.involvedShapes.map(
        (s) =>
          new s.constructor({
            ...s,
            drawingEnvironment: app.upperDrawingEnvironment,
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
      let progressInAnimation = Math.cos(Math.PI * (1 - this.progress)) / 2 + 0.5;
      app.upperDrawingEnvironment.points.forEach((point) => {
        if (point.startCoordinates)
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(progressInAnimation),
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

    let newShapes = [];
    this.involvedShapes.forEach(s => {
      let newShape = new s.constructor({
        ...s,
        drawingEnvironment: app.mainDrawingEnvironment,
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
          geometryTransformationCharacteristicElementIds: [this.firstReference.id],
          geometryTransformationName: 'orthogonalSymetry',
        }),
      });
      if (this.secondReference)
        newShape.geometryObject.geometryTransformationCharacteristicElementIds.push(this.secondReference.id);
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      if (newShape.geometryObject.geometryTransformationCharacteristicElementIds.length == 1) {
        let ref = app.mainDrawingEnvironment.findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0], 'segment');
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
      } else {
        newShape.geometryObject.geometryTransformationCharacteristicElementIds.forEach(refId => {
          let ref = app.mainDrawingEnvironment.findObjectById(refId, 'point');
          if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
            ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
          }
        });
      }
      this.reverseShape(newShape, selectedAxis);
      newShapes.push(newShape);
    });
    if (newShapes.length > 1) {
      let group = new ShapeGroup(...newShapes.map(s => s.id));
      GroupManager.addGroup(group);
    }
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
