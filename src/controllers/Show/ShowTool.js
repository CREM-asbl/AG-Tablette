import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Shape } from '../Core/Objects/Shapes/Shape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { addInfoToId, findObjectById } from '../Core/Tools/general';

/**
 * Monter des objets.
 */
export class ShowTool extends Tool {
  constructor() {
    super('show', 'Montrer', 'tool');
  }

  getHelpText() {
    const toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>Vous avez sélectionné l'outil <b>"${toolName}"</b>.</p>
    `;
  }

  start() {
    setTimeout(
      () =>
        setState({
          tool: { ...app.tool, name: this.name, currentStep: 'listen' },
        }),
      50,
    );
  }

  listen() {
    this.showHidden();
    this.removeListeners();

    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    app.workspace.selectionConstraints.shapes.blacklist =
      app.mainCanvasLayer.shapes.map((s) => {
        return { shapeId: s.id };
      });
    app.workspace.selectionConstraints.points.canSelect = true;
    app.workspace.selectionConstraints.points.types = ['divisionPoint'];
    app.workspace.selectionConstraints.shapes.canSelectFromUpper = true;
    app.workspace.selectionConstraints.points.canSelectFromUpper = true;

    // il faudrait ne pouvoir sélectionner que les points cachés

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  end() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
  }

  objectSelected(object) {
    if (object instanceof Shape) {
      this.mode = 'shape';
      this.shapeToShow = object;
    } else {
      this.point = object;
      this.mode = 'divisionPoint';
    }

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'listen' },
    });
  }

  showHidden() {
    app.upperCanvasLayer.removeAllObjects();

    app.mainCanvasLayer.shapes
      // .filter(s => s.geometryObject.geometryIsHidden === true)
      .forEach((s) => {
        if (s.geometryObject.geometryIsPermanentHidden) return;
        const newShape = new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false, false),
          strokeColor: s.strokeColor,
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return {
              coordinates: dp.coordinates,
              ratio: dp.ratio,
              segmentIdx: dp.segments[0].idx,
              id: dp.id,
              color: dp.color,
            };
          }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.map((pt) => {
            return s.geometryObject.geometryIsHidden === true
              ? '#f00'
              : pt.color;
          }),
          geometryObject: new GeometryObject({
            ...s.geometryObject,
            geometryIsHidden: false,
          }),
        });
        if (s.geometryObject.geometryIsHidden === true) {
          newShape.drawHidden = true;
        }
        const segIds = newShape.segments.map(
          (seg, idx) => (seg.id = s.segments[idx].id),
        );
        const ptIds = newShape.points.map(
          (pt, idx) => (pt.id = s.points[idx].id),
        );
        newShape.segmentIds = [...segIds];
        newShape.pointIds = [...ptIds];
        newShape.points.forEach((pt, idx) => {
          pt.segmentIds = [...s.points[idx].segmentIds];
          pt.reference = s.points[idx].reference;
          pt.type = s.points[idx].type;
          pt.ratio = s.points[idx].ratio;
          pt.visible = s.points[idx].visible;
          if (s.points[idx].geometryIsHidden) pt.color = '#f00';
        });
        newShape.segments.forEach((seg, idx) => {
          seg.isInfinite = s.segments[idx].isInfinite;
          seg.isSemiInfinite = s.segments[idx].isSemiInfinite;
          seg.vertexIds = [...s.segments[idx].vertexIds];
          seg.divisionPointIds = [...s.segments[idx].divisionPointIds];
          seg.arcCenterId = s.segments[idx].arcCenterId;
        });
        return newShape;
      });
    app.mainCanvasLayer.editingShapeIds = app.mainCanvasLayer.shapes
      // .filter(s => s.geometryObject.geometryIsHidden === true)
      .map((s) => s.id);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  _executeAction() {
    if (this.mode == 'shape') {
      const workingShapes = ShapeManager.getAllBindedShapes(
        findObjectById(addInfoToId(this.shapeToShow.id, 'main')),
      );
      workingShapes.forEach((s) => {
        s.geometryObject.geometryIsHidden = false;
      });
      app.mainCanvasLayer.shapes.forEach((s) => {
        if (s instanceof SinglePointShape) {
          const child = findObjectById(
            s.geometryObject.geometryPointOnTheFlyChildId,
          );
          if (child)
            s.geometryObject.geometryIsHidden =
              child.geometryObject.geometryIsHidden;
        }
      });
      app.mainCanvasLayer.shapes.forEach((s) => {
        if (s.geometryObject.geometryIsConstaintDraw) {
          const child = findObjectById(
            s.geometryObject.geometryChildShapeIds[0],
          );
          if (child)
            s.geometryObject.geometryIsHidden =
              child.geometryObject.geometryIsHidden;
        }
      });
    } else if (this.mode == 'divisionPoint') {
      findObjectById(addInfoToId(this.point.id, 'main')).geometryIsHidden =
        false;
    }
  }
}
