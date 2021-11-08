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
    this.removeListeners();

    this.setSelectionConstraints();
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
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
      }));
      if (this.references.length == 4) {
        this.angle = this.references[2].coordinates.angleWith(this.references[1].coordinates) - this.references[2].coordinates.angleWith(this.references[3].coordinates);

        if (this.angle > Math.PI) this.angle -= 2 * Math.PI;
        if (this.angle < -Math.PI) this.angle += 2 * Math.PI;
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
          borderColor: app.settings.referenceDrawColor,
          opacity: 0,
        });

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
          borderColor: app.settings.referenceDrawColor,
          color: app.settings.referenceDrawColor,
          name: 'arrow',
          borderSize: 2,
          isPointed: false,
        });
        setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectDirection' } });
      }
    } else {
      this.object = object;
      // this.animate();
      this.executeAction();
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
    const clockwise = isAngleInside;
    let segIdx = this.arcShape.segments.findIndex(seg => seg.counterclockwise == clockwise);
    app.upperDrawingEnvironment.removeObjectById(
      this.arcShape.segmentIds[segIdx],
      'segment',
    );
    this.arcShape.segmentIds.splice(segIdx, 1);
    this.arcShape.segments.forEach((seg, idx) => (seg.idx = idx));
    app.upperDrawingEnvironment.removeObjectById(
      this['arrowShape' + segIdx].id,
    );
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
  }

  _executeAction() {
    // let selectedShape = ShapeManager.getShapeById(app.tool.selectedShapeId);
    // let involvedShapes = ShapeManager.getAllBindedShapes(selectedShape, true);
    // involvedShapes.forEach((s) => {
    let newShape = new Shape({
      ...this.object,
      drawingEnvironment: app.mainDrawingEnvironment,
      id: undefined,
      path: this.object.getSVGPath('no scale'),
    });
    newShape.rotate(this.angle, this.references[0].coordinates);
    // });
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
