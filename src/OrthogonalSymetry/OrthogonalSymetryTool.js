import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { findObjectById, removeObjectById } from '../Core/Tools/general';

/**
 */
export class OrthogonalSymetryTool extends Tool {
  constructor() {
    super('orthogonalSymetry', 'Symétrie orthogonale', 'transformation');
  }

  start() {
    this.removeListeners();
    this.duration = app.settings.geometryTransformationAnimation ? app.settings.geometryTransformationAnimationDuration : 0.001;

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectFirstReference' } }), 50);
  }

  selectFirstReference() {
    app.upperCanvasLayer.removeAllObjects();
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
        removeObjectById(s.id);
      })

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  ortho() {
    this.removeListeners();

    this.startTime = Date.now();
    this.animate();
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  get referenceShape() {
    return findObjectById(app.tool.referenceShapeId);
  }

  canvasMouseDown() {
    let coord = app.workspace.lastKnownMouseCoordinates;
    if (this.firstReference == null) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      let object = SelectManager.selectObject(coord);
      if (object instanceof Segment && !object.isArc()) {
        this.firstReference = object;
        let referenceShape = new LineShape({
          path: object.getSVGPath('no scale', true),
          layer: 'upper',
          strokeColor: app.settings.referenceDrawColor,
          strokeWidth: 2,
        });
        referenceShape.segments[0].isInfinite = true;
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject', referenceShapeId: referenceShape.id } });
      } else {
        this.pointsDrawn.push(new Point({
          coordinates: coord,
          layer: 'upper',
          color: app.settings.referenceDrawColor,
          size: 2,
        }));
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateFirstRefPoint' } });
      }
    } else {
      this.pointsDrawn.push(new Point({
        coordinates: coord,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 2,
      }));
      let segment = new Segment({
        layer: 'upper',
        vertexIds: this.pointsDrawn.map((pt) => pt.id),
        isInfinite: true,
      });
      let referenceShape = new LineShape({
        layer: 'upper',
        segmentIds: [segment.id],
        pointIds: this.pointsDrawn.map((pt) => pt.id),
        strokeColor: app.settings.referenceDrawColor,
        strokeWidth: 2,
      });
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateSecondRefPoint', referenceShapeId: referenceShape.id } });
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
        currentStep: 'ortho'
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
      this.drawingShapes.forEach(s => s.points.forEach((point) => {
        let center = this.referenceShape.segments[0].projectionOnSegment(point.coordinates);
        point.startCoordinates = new Coordinates(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: point.x + 2 * (center.x - point.x),
          y: point.y + 2 * (center.y - point.y),
        });
      }));
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
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates) {
          point.coordinates = point.startCoordinates.substract(
            point.startCoordinates
              .substract(point.endCoordinates)
              .multiply(progressInAnimation),
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
    if (this.firstReference instanceof Point && this.firstReference.layer == 'upper') {
      let coord = this.firstReference.coordinates;
      this.firstReference = new SinglePointShape({
        layer: 'main',
        path: `M ${coord.x} ${coord.y}`,
        name: 'Point',
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      }).points[0];
    }
    if (this.firstReference instanceof Point && this.secondReference.layer == 'upper') {
      let coord = this.secondReference.coordinates;
      this.secondReference = new SinglePointShape({
        layer: 'main',
        path: `M ${coord.x} ${coord.y}`,
        name: 'Point',
        familyName: 'Point',
        geometryObject: new GeometryObject({}),
      }).points[0];
    }
    let selectedAxis = this.referenceShape.segments[0];

    let newShapes = this.involvedShapes.map(s => {
      let newShape = new s.constructor({
        ...s,
        layer: 'main',
        id: undefined,
        familyName: 'transformation',
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
          geometryIsVisible: s.geometryObject.geometryIsVisible,
          geometryIsConstaintDraw: s.geometryObject.geometryIsConstaintDraw,
        }),
      });
      if (this.secondReference)
        newShape.geometryObject.geometryTransformationCharacteristicElementIds.push(this.secondReference.id);
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      if (newShape.geometryObject.geometryTransformationCharacteristicElementIds.length == 1) {
        let ref = findObjectById(newShape.geometryObject.geometryTransformationCharacteristicElementIds[0]);
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
      } else {
        newShape.geometryObject.geometryTransformationCharacteristicElementIds.forEach(refId => {
          let ref = findObjectById(refId);
          if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
            ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
          }
        });
      }
      this.reverseShape(newShape, selectedAxis);
      newShape.points.forEach((pt, idx) => {
        pt.geometryIsVisible = s.points[idx].geometryIsVisible;
      });
      return newShape;
    });
    const linkReference = (idx, refName) => {
      if (this.involvedShapes[idx].geometryObject[refName]) {
        let reference = findObjectById(this.involvedShapes[idx].geometryObject[refName]);
        if (reference instanceof Shape) {
          let shapeIndex = this.involvedShapes.findIndex(s => reference.id == s.id);
          newShapes[idx].geometryObject[refName] = newShapes[shapeIndex].id;
        } else {
          let referenceType = reference instanceof Segment ? 'segments' : 'points';
          let shapeIndex = this.involvedShapes.findIndex(s => reference.shape.id == s.id);
          let objectIndex = this.involvedShapes[shapeIndex][referenceType].findIndex(obj => obj.id == reference.id);
          newShapes[idx].geometryObject[refName] = newShapes[shapeIndex][referenceType][objectIndex].id;
        }
      }
    }
    newShapes.forEach((newShape, sIdx) => {
      linkReference(sIdx, 'geometryParentObjectId1');
      linkReference(sIdx, 'geometryParentObjectId2');
      newShape.vertexes.forEach((vx, ptIdx) => {
        let reference = findObjectById(this.involvedShapes[sIdx].vertexes[ptIdx].reference);
        if (reference) {
          let shapeIndex = this.involvedShapes.findIndex(s => reference.shape.id == s.id);
          let pointIndex = this.involvedShapes[shapeIndex].points.findIndex(obj => obj.id == reference.id);
          newShapes[sIdx].vertexes[ptIdx].reference = newShapes[shapeIndex].points[pointIndex].id;
        }
      });
      newShape.divisionPoints.forEach((divPt, divPtIdx) => {
        divPt.reference = this.involvedShapes[sIdx].divisionPoints[divPtIdx].id;
        let endpointId1 = findObjectById(this.involvedShapes[sIdx].divisionPoints[divPtIdx].endpointIds[0]);
        let shapeIndex = this.involvedShapes.findIndex(s => endpointId1.shape.id == s.id);
        let pointIndex = this.involvedShapes[shapeIndex].points.findIndex(obj => obj.id == endpointId1.id);
        divPt.endpointIds = [newShapes[shapeIndex].points[pointIndex].id];
        let endpointId2 = findObjectById(this.involvedShapes[sIdx].divisionPoints[divPtIdx].endpointIds[1]);
        shapeIndex = this.involvedShapes.findIndex(s => endpointId2.shape.id == s.id);
        pointIndex = this.involvedShapes[shapeIndex].points.findIndex(obj => obj.id == endpointId2.id);
        divPt.endpointIds.push(newShapes[shapeIndex].points[pointIndex].id);
      });
    });
    // if (newShapes.length > 1) {
    //   let group = new ShapeGroup(...newShapes.map(s => s.id));
    //   GroupManager.addGroup(group);
    // }
  }

  reverseShape(shape, selectedAxis) {
    shape.reverse();

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
    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
  }
}
