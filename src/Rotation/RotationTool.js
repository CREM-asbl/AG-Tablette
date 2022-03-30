import { app, setState } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { ShapeGroup } from '../Core/Objects/ShapeGroup';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Tool } from '../Core/States/Tool';
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

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  selectReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    this.references = [];
    this.realReferences = [];

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
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
        app.upperDrawingEnvironment.removeObjectById(s.id);
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
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  objectSelected(object) {
    if (app.tool.currentStep == 'selectReference') {
      if (object instanceof ArrowLineShape && object.segments[0].arcCenter) {
        this.references.push(new ArrowLineShape({
          path: object.getSVGPath('no scale', true),
          drawingEnvironment: app.upperDrawingEnvironment,
          strokeColor: app.settings.referenceDrawColor,
          strokeWidth: 2,
        }));
        this.realReferences.push(object);
        this.angle = this.references[1].segments[0].arcCenter.coordinates.angleWith(this.references[1].segments[0].vertexes[0].coordinates) - this.references[1].segments[0].arcCenter.coordinates.angleWith(this.references[1].segments[0].vertexes[1].coordinates);
        this.angle *= -1;
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
      } else if (object instanceof Point) {
        this.references.push(
          new Point({
            coordinates: object.coordinates,
            drawingEnvironment: app.upperDrawingEnvironment,
            color: app.settings.referenceDrawColor,
            size: 2,
          })
        );
        this.realReferences.push(object);
        this.setSelectionConstraints();
      } else {
        window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Veuillez sélectionner un arc ou un point.' } }))
        return;
      }
      if (this.references.length == 4) {
        this.angle = this.references[2].coordinates.angleWith(this.references[1].coordinates) - this.references[2].coordinates.angleWith(this.references[3].coordinates);
        this.angle *= -1;

        let radius = this.references[1].coordinates.dist(this.references[2].coordinates);
        let angle = this.references[2].coordinates.angleWith(this.references[3].coordinates);
        const projectionCoord = this.references[2].coordinates.add({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
        const projection = new Point({
          coordinates: projectionCoord,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let seg = new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          idx: 0,
          vertexIds: [this.references[1].id, projection.id],
          arcCenterId: this.references[2].id,
          counterclockwise: this.angle < 0,
        });
        this.seg = seg;
        let ref1Copy = new Point({
          coordinates: this.references[1].coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let projectionCopy = new Point({
          coordinates: projectionCoord,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let ref2Copy = new Point({
          coordinates: this.references[2].coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 0.1,
        });
        let seg2 = new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          idx: 0,
          vertexIds: [ref1Copy.id, projectionCopy.id],
          arcCenterId: ref2Copy.id,
          counterclockwise: this.angle >= 0,
        });
        this.seg2 = seg2;
        let arcPoints0 = [this.references[1], projection, this.references[2]];
        let arcPoints1 = [ref1Copy, projectionCopy, ref2Copy];
        this.arcShape0 = new ArrowLineShape({
          drawingEnvironment: app.upperDrawingEnvironment,
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
          drawingEnvironment: app.upperDrawingEnvironment,
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
              return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx };
            }),
          }),
      );
      setState({
        tool: {
          ...app.tool,
          currentStep: 'rot'
        }
      });
    }
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  canvasClick() {
    let angle = this.references[2].coordinates.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    let startAngle = this.references[2].coordinates.angleWith(
      this.references[1].coordinates,
    );
    let endAngle = this.references[2].coordinates.angleWith(
      this.references[3].coordinates,
    );
    let isAngleInside = isAngleBetweenTwoAngles(
      startAngle,
      endAngle,
      false,
      angle,
    );
    this.clockwise = isAngleInside;
    if (this.arcShape0.segments[0].counterclockwise == this.clockwise) {
      app.upperDrawingEnvironment.removeObjectById(
        this.arcShape0.id,
        'shape',
      );
    } else {
      app.upperDrawingEnvironment.removeObjectById(
        this.arcShape1.id,
        'shape',
      );
    }

    if (!(this.angle < 0 ^ this.clockwise)) {
      if (this.angle > 0) this.angle -= 2 * Math.PI;
      else if (this.angle < 0) this.angle += 2 * Math.PI;
    }

    // app.upperDrawingEnvironment.removeObjectById(
    //   this['arrowShape' + segIdx].id,
    // );
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
  }


  animate() {
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
      app.upperDrawingEnvironment.points.forEach((point) => {
        if (point.startCoordinates) {
          let startAngle = this.references[0].coordinates.angleWith(
            point.startCoordinates
          );
          let length = this.references[0].coordinates.dist(point.startCoordinates);
          point.coordinates = new Coordinates({
            x: this.references[0].x + Math.cos(startAngle + this.angle * this.progress) * length,
            y: this.references[0].y + Math.sin(startAngle + this.angle * this.progress) * length,
          });
        }
      });
    }
  }

  _executeAction() {
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
          geometryTransformationCharacteristicElementIds: this.realReferences.map(ref => ref.id),
          geometryTransformationName: 'rotation',
        }),
      });
      s.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
      newShape.geometryObject.geometryTransformationCharacteristicElementIds.map((refId, idx) => {
        let objectType = 'point';
        if (idx == 1 && this.references[1] instanceof ArrowLineShape) {
          objectType = 'shape';
        }
        let ref = app.mainDrawingEnvironment.findObjectById(refId, objectType);
        if (objectType == 'shape') {
          if (!ref.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
            ref.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
          }
        } else {
          if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
            ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
          }
        }
      });
      newShape.rotate(this.angle, this.references[0].coordinates);
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
      if (this.references.length == 1) {
        app.workspace.selectionConstraints.shapes.canSelect = true;
      }
    } else {
      app.workspace.selectionConstraints =
        app.fastSelectionConstraints.mousedown_all_shape;
    }
  }
}
