import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { createElem } from '../Core/Tools/general';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { Coordinates } from '../Core/Objects/Coordinates';
import { isAngleBetweenTwoAngles } from '../Core/Tools/geometry';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';
import { ArrowLineShape } from '../Core/Objects/Shapes/ArrowLineShape';

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
      this.references.push(
        new Point({
          coordinates: object.coordinates,
          drawingEnvironment: app.upperDrawingEnvironment,
          color: app.settings.referenceDrawColor,
          size: 2,
        })
      );
      this.realReferences.push(object);
      if (this.references.length == 4) {
        this.angle = this.references[2].coordinates.angleWith(this.references[1].coordinates) - this.references[2].coordinates.angleWith(this.references[3].coordinates);

        // if (this.angle > Math.PI) this.angle -= 2 * Math.PI;
        // if (this.angle < -Math.PI) this.angle += 2 * Math.PI;
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
        });

        // this.arcShape0.segments[0].color = app.settings.referenceDrawColor;
        // this.arcShape1.segments[0].color = app.settings.referenceDrawColor2;


        // let arrowAngle = angle - Math.PI / 2;
        // if (seg.counterclockwise)
        //   arrowAngle += Math.PI;
        // let firstTriangleCoord = projectionCoord.add(new Coordinates({
        //   x: 20 * Math.cos(arrowAngle + 0.35),
        //   y: 20 * Math.sin(arrowAngle + 0.35),
        // }));
        // let secondTriangleCoord = projectionCoord.add(new Coordinates({
        //   x: 20 * Math.cos(arrowAngle - 0.35),
        //   y: 20 * Math.sin(arrowAngle - 0.35),
        // }));
        // this.arrowShape0 = new ArrowLineShape({
        //   drawingEnvironment: app.upperDrawingEnvironment,
        //   path: `M ${projectionCoord.x} ${projectionCoord.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} Z`,
        //   borderColor: app.settings.referenceDrawColor,
        //   color: app.settings.referenceDrawColor,
        //   name: 'arrow',
        //   borderSize: 2,
        //   isPointed: false,
        //   geometryObject: {},
        // });
        // arrowAngle = angle + Math.PI / 2;
        // if (seg.counterclockwise)
        //   arrowAngle += Math.PI;
        // firstTriangleCoord = projectionCoord.add(new Coordinates({
        //   x: 20 * Math.cos(arrowAngle + 0.35),
        //   y: 20 * Math.sin(arrowAngle + 0.35),
        // }));
        // secondTriangleCoord = projectionCoord.add(new Coordinates({
        //   x: 20 * Math.cos(arrowAngle - 0.35),
        //   y: 20 * Math.sin(arrowAngle - 0.35),
        // }));
        // this.arrowShape1 = new RegularShape({
        //   drawingEnvironment: app.upperDrawingEnvironment,
        //   path: `M ${projectionCoord.x} ${projectionCoord.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} Z`,
        //   borderColor: app.settings.referenceDrawColor2,
        //   color: app.settings.referenceDrawColor2,
        //   name: 'arrow',
        //   borderSize: 2,
        //   isPointed: false,
        //   geometryObject: {},
        // });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectDirection' } });
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
      newShape.geometryObject.geometryTransformationCharacteristicElementIds.map(refId => {
        let ref = app.mainDrawingEnvironment.findObjectById(refId, 'point');
        if (!ref.shape.geometryObject.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryObject.geometryTransformationChildShapeIds.push(newShape.id);
        }
      });
      newShape.rotate(this.angle, this.references[0].coordinates);
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
