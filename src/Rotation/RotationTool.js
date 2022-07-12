import { app, setState } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { findObjectById, removeObjectById } from '../Core/Tools/general';
import { isAngleBetweenTwoAngles } from '../Core/Tools/geometry';

/**
 */
export class RotationTool extends Tool {
  constructor() {
    super('rotation', 'Rotation', 'transformation');
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
    this.references = [];

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    this.removeListeners();

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

  selectDirection() {
    this.removeListeners();

    window.setTimeout(
      () =>
        (this.mouseClickId = app.addListener('canvasClick', this.handler)),
    );
  }

  selectObject() {
    if (this.drawingShapes)
      this.drawingShapes.forEach(s => {
        removeObjectById(s.id)
      })

    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  rot() {
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
    if (this.pointsDrawn.length == 1) {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.segments.canSelect = true;
      app.workspace.selectionConstraints.segments.numberOfObjects = 'allInDistance';
      let objects = SelectManager.selectObject(coord);
      if (objects)
        for (let i = 0; i < objects.length; i++) {
          let object = objects[i];
          if (object.isArc() && object.vertexIds[0] != object.vertexIds[1]) {
            this.references.push(object);
            new ArrowLineShape({
              path: object.getSVGPath('no scale', true),
              layer: 'upper',
              strokeColor: app.settings.referenceDrawColor,
              strokeWidth: 2,
              fillOpacity: 0,
            });
            this.angle = this.references[1].arcCenter.coordinates.angleWith(this.references[1].vertexes[0].coordinates) - this.references[1].arcCenter.coordinates.angleWith(this.references[1].vertexes[1].coordinates);
            this.angle *= -1;
            setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
            return;
          }
        }
    }
    this.pointsDrawn.push(new Point({
      coordinates: coord,
      layer: 'upper',
      color: app.settings.referenceDrawColor,
      size: 2,
    }));
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'animateRefPoint' } });
  }

  canvasMouseUp() {
    this.stopAnimation();

    let coord = app.workspace.lastKnownMouseCoordinates;
    let object = SelectManager.selectObject(coord);
    if (object) {
      this.references.push(object);
    } else {
      this.references.push(this.pointsDrawn[this.pointsDrawn.length - 1]);
    }
    if (this.pointsDrawn.length < 4)
      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } });
    else {
      this.angle = this.pointsDrawn[2].coordinates.angleWith(this.pointsDrawn[1].coordinates) - this.pointsDrawn[2].coordinates.angleWith(this.pointsDrawn[3].coordinates);
      this.angle *= -1;

      let radius = this.pointsDrawn[1].coordinates.dist(this.pointsDrawn[2].coordinates);
      let angle = this.pointsDrawn[2].coordinates.angleWith(this.pointsDrawn[3].coordinates);
      const projectionCoord = this.pointsDrawn[2].coordinates.add({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
      const projection = new Point({
        coordinates: projectionCoord,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 0.1,
      });
      let seg = new Segment({
        layer: 'upper',
        idx: 0,
        vertexIds: [this.pointsDrawn[1].id, projection.id],
        arcCenterId: this.pointsDrawn[2].id,
        counterclockwise: this.angle < 0,
      });
      this.seg = seg;
      let ref1Copy = new Point({
        coordinates: this.pointsDrawn[1].coordinates,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 0.1,
      });
      let projectionCopy = new Point({
        coordinates: projectionCoord,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 0.1,
      });
      let ref2Copy = new Point({
        coordinates: this.pointsDrawn[2].coordinates,
        layer: 'upper',
        color: app.settings.referenceDrawColor,
        size: 0.1,
      });
      let seg2 = new Segment({
        layer: 'upper',
        idx: 0,
        vertexIds: [ref1Copy.id, projectionCopy.id],
        arcCenterId: ref2Copy.id,
        counterclockwise: this.angle >= 0,
      });
      this.seg2 = seg2;
      let arcPoints0 = [this.pointsDrawn[1], projection, this.pointsDrawn[2]];
      let arcPoints1 = [ref1Copy, projectionCopy, ref2Copy];
      this.arcShape0 = new ArrowLineShape({
        layer: 'upper',
        segmentIds: [seg.id],
        pointIds: arcPoints0.map(pt => pt.id),
        name: 'arrow',
        familyName: 'circle-shape',
        strokeColor: app.settings.referenceDrawColor,
        fillOpacity: 0,
        geometryObject: {},
        strokeWidth: 2,
      });
      this.arcShape1 = new ArrowLineShape({
        layer: 'upper',
        segmentIds: [seg2.id],
        pointIds: arcPoints1.map(pt => pt.id),
        name: 'arrow',
        familyName: 'circle-shape',
        strokeColor: app.settings.referenceDrawColor2,
        fillOpacity: 0,
        geometryObject: {},
        strokeWidth: 2,
      });

      setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectDirection' } });
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
        currentStep: 'rot'
      }
    });
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  canvasClick() {
    let angle = this.pointsDrawn[2].coordinates.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    let startAngle = this.pointsDrawn[2].coordinates.angleWith(
      this.pointsDrawn[1].coordinates,
    );
    let endAngle = this.pointsDrawn[2].coordinates.angleWith(
      this.pointsDrawn[3].coordinates,
    );
    let isAngleInside = isAngleBetweenTwoAngles(
      startAngle,
      endAngle,
      false,
      angle,
    );
    this.clockwise = isAngleInside;
    if (this.arcShape0.segments[0].counterclockwise == this.clockwise) {
      removeObjectById(
        this.arcShape0.id
      );
    } else {
      removeObjectById(
        this.arcShape1.id
      );
    }

    if (!(this.angle < 0 ^ this.clockwise)) {
      if (this.angle > 0) this.angle -= 2 * Math.PI;
      else if (this.angle < 0) this.angle += 2 * Math.PI;
    }

    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
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
      this.drawingShapes.forEach(s => s.points.forEach((point) => {
        point.startCoordinates = new Coordinates(point.coordinates);
        let startAngle = this.references[0].coordinates.angleWith(
          point.coordinates
        );
        let length = this.references[0].coordinates.dist(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: this.references[0].x + Math.cos(startAngle + this.angle) * length,
          y: this.references[0].x + Math.sin(startAngle + this.angle) * length,
        });
      }));
    }
    this.progress = (Date.now() - this.startTime) / (this.duration * 1000);
    if (this.progress > 1 && app.tool.name == 'rotation') {
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
    if (app.tool.currentStep == 'rot') {
      app.upperCanvasLayer.points.forEach((point) => {
        if (point.startCoordinates) {
          let startAngle = this.pointsDrawn[0].coordinates.angleWith(
            point.startCoordinates
          );
          let length = this.pointsDrawn[0].coordinates.dist(point.startCoordinates);
          point.coordinates = new Coordinates({
            x: this.pointsDrawn[0].x + Math.cos(startAngle + this.angle * this.progress) * length,
            y: this.pointsDrawn[0].y + Math.sin(startAngle + this.angle * this.progress) * length,
          });
        }
      });
    } else if (app.tool.currentStep == 'animateRefPoint') {
      let coord = app.workspace.lastKnownMouseCoordinates;
      let object = SelectManager.selectObject(coord);
      if (object) {
        this.pointsDrawn[this.pointsDrawn.length - 1].coordinates = object.coordinates;
      } else {
        this.pointsDrawn[this.pointsDrawn.length - 1].coordinates = coord;
      }
    }
  }

  _executeAction() {
    this.references = this.references.map(ref => {
      if (ref instanceof Point && ref.layer == 'upper') {
        let coord = ref.coordinates;
        return new SinglePointShape({
          layer: 'main',
          path: `M ${coord.x} ${coord.y}`,
          name: 'Point',
          familyName: 'Point',
          geometryObject: new GeometryObject({}),
        }).points[0];
      }
      return ref;
    })
    let newShapes = this.involvedShapes.map(s => {
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
          geometryTransformationCharacteristicElementIds: this.references.map(ref => ref.id),
          geometryTransformationName: 'rotation',
          geometryIsVisible: s.geometryObject.geometryIsVisible,
          geometryIsConstaintDraw: s.geometryObject.geometryIsConstaintDraw,
        }),
      });
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      newShape.geometryObject.geometryTransformationCharacteristicElementIds.map((refId) => {
        let ref = findObjectById(refId);
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
      });
      newShape.rotate(this.angle, this.references[0].coordinates);
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

  setSelectionConstraints() {
    if (app.tool.currentStep == 'selectReference') {
      window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
      app.workspace.selectionConstraints.eventType = 'click';
      app.workspace.selectionConstraints.points.canSelect = true;
      if (this.references.length == 1) {
        app.workspace.selectionConstraints.shapes.canSelect = true;
      }
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
