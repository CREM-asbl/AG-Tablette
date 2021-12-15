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

/**
 */
export class RotationTool extends Tool {
  constructor() {
    super('rotation', 'Rotation', 'transformation');

    this.duration = app.settings.geometryTransformationAnimationDuration;
  }

  start() {
    this.removeListeners();

    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  }

  // selectFirstReference() {
  //   app.upperDrawingEnvironment.removeAllObjects();
  //   window.clearTimeout(this.timeoutRef);
  //   this.removeListeners();

  //   this.references = [];

  //   setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectReference' } }), 50);
  // }

  selectReference() {
    app.upperDrawingEnvironment.removeAllObjects();
    window.clearTimeout(this.timeoutRef);
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
    window.clearTimeout(this.timeoutRef);
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
        let seg2 = new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          idx: 0,
          vertexIds: [this.references[1].id, projection.id],
          arcCenterId: this.references[2].id,
          counterclockwise: this.angle >= 0,
        });
        this.seg2 = seg2;
        let arcPoints = [this.references[1], projection, this.references[2]];
        this.arcShape = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          segmentIds: [seg.id, seg2.id],
          pointIds: arcPoints.map(pt => pt.id),
          name: 'arrow',
          familyName: 'circle-shape',
          // borderColor: app.settings.referenceDrawColor,
          opacity: 0,
        });
        this.arcShape.segments[0].color = app.settings.referenceDrawColor;
        this.arcShape.segments[1].color = app.settings.referenceDrawColor2;

        let arrowAngle = angle - Math.PI / 2;
        if (seg.counterclockwise)
          arrowAngle += Math.PI;
        let firstTriangleCoord = projectionCoord.add(new Coordinates({
          x: 20 * Math.cos(arrowAngle + 0.35),
          y: 20 * Math.sin(arrowAngle + 0.35),
        }));
        let secondTriangleCoord = projectionCoord.add(new Coordinates({
          x: 20 * Math.cos(arrowAngle - 0.35),
          y: 20 * Math.sin(arrowAngle - 0.35),
        }));
        this.arrowShape0 = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${projectionCoord.x} ${projectionCoord.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} Z`,
          borderColor: app.settings.referenceDrawColor,
          color: app.settings.referenceDrawColor,
          name: 'arrow',
          borderSize: 2,
          isPointed: false,
        });
        arrowAngle = angle + Math.PI / 2;
        if (seg.counterclockwise)
          arrowAngle += Math.PI;
        firstTriangleCoord = projectionCoord.add(new Coordinates({
          x: 20 * Math.cos(arrowAngle + 0.35),
          y: 20 * Math.sin(arrowAngle + 0.35),
        }));
        secondTriangleCoord = projectionCoord.add(new Coordinates({
          x: 20 * Math.cos(arrowAngle - 0.35),
          y: 20 * Math.sin(arrowAngle - 0.35),
        }));
        this.arrowShape1 = new Shape({
          drawingEnvironment: app.upperDrawingEnvironment,
          path: `M ${projectionCoord.x} ${projectionCoord.y} L ${firstTriangleCoord.x} ${firstTriangleCoord.y} L ${secondTriangleCoord.x} ${secondTriangleCoord.y} Z`,
          borderColor: app.settings.referenceDrawColor2,
          color: app.settings.referenceDrawColor2,
          name: 'arrow',
          borderSize: 2,
          isPointed: false,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectDirection' } });
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
    let segIdx = this.arcShape.segments.findIndex(seg => seg.counterclockwise == this.clockwise);
    app.upperDrawingEnvironment.removeObjectById(
      this.arcShape.segmentIds[segIdx],
      'segment',
    );
    this.arcShape.segmentIds.splice(segIdx, 1);
    this.arcShape.segments.forEach((seg, idx) => (seg.idx = idx));

    if (!(this.angle < 0 ^ this.clockwise)) {
      if (this.angle > 0) this.angle -= 2 * Math.PI;
      else if (this.angle < 0) this.angle += 2 * Math.PI;
    }

    app.upperDrawingEnvironment.removeObjectById(
      this['arrowShape' + segIdx].id,
    );
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
  }


  animate() {
    this.lastProgress = this.progress || 0;
    if (this.lastProgress == 0) {
      this.drawingShapes.forEach(s => s.points.forEach((point) => {
        point.startCoordinates = new Coordinates(point.coordinates);
        let startAngle = this.references[2].coordinates.angleWith(
          point.coordinates
        );
        let length = this.references[2].coordinates.dist(point.coordinates);
        point.endCoordinates = new Coordinates({
          x: this.references[2].x + Math.cos(startAngle + this.angle) * length,
          y: this.references[2].x + Math.sin(startAngle + this.angle) * length,
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
          let startAngle = this.references[2].coordinates.angleWith(
            point.startCoordinates
          );
          let length = this.references[2].coordinates.dist(point.startCoordinates);
          point.coordinates = new Coordinates({
            x: this.references[2].x + Math.cos(startAngle + this.angle * this.progress) * length,
            y: this.references[2].y + Math.sin(startAngle + this.angle * this.progress) * length,
          });
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
        geometryTransformationCharacteristicElementIds: this.realReferences.map(ref => ref.id),
        geometryTransformationParentShapeId: s.id,
        geometryTransformationChildShapeIds: [],
        geometryTransformationName: 'rotation',
        // geometryTransformationRotationAngle: this.angle,
      });
      s.geometryTransformationChildShapeIds.push(newShape.id);
      newShape.geometryTransformationCharacteristicElementIds.map(refId => {
        let ref = app.mainDrawingEnvironment.findObjectById(refId, 'point');
        if (!ref.shape.geometryTransformationChildShapeIds.includes(newShape.id)) {
          ref.shape.geometryTransformationChildShapeIds.push(newShape.id);
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
