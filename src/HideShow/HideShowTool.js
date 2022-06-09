import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { findObjectById, addInfoToId } from '../Core/Tools/general';

/**
 * Cacher & monter des objets.
 */
export class HideShowTool extends Tool {
  constructor() {
    super('hideShow', 'Cacher/montrer', 'tool');
  }

  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.showHidden();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    app.workspace.selectionConstraints.shapes.canSelectFromUpper = true;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  end() {
    app.mainCanvasLayer.editingShapeIds = [];
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
  }

  objectSelected(shape) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'listen' },
    });
  }

  showHidden() {
    app.upperCanvasLayer.removeAllObjects();

    app.mainCanvasLayer.shapes
      // .filter(s => s.geometryObject.geometryIsHidden === true)
    .forEach(s => {
      let newShape = new s.constructor({
        ...s,
        layer: 'upper',
        path: s.getSVGPath('no scale', false, false),
        strokeColor: s.strokeColor,
        divisionPointInfos: s.divisionPoints.map((dp) => {
          return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: dp.id, color: dp.color };
        }),
        segmentsColor: s.segments.map((seg) => {
          return seg.color;
        }),
        pointsColor: s.points.map((pt) => {
          return s.geometryObject.geometryIsHidden === true ? '#f00' : pt.color;
        }),
        geometryObject: new GeometryObject({...s.geometryObject, geometryIsHidden: false}),
      });
      if (s.geometryObject.geometryIsHidden === true) {
        newShape.drawHidden = true;
      }
      let segIds = newShape.segments.map((seg, idx) => seg.id = s.segments[idx].id);
      let ptIds = newShape.points.map((pt, idx) => pt.id = s.points[idx].id);
      newShape.segmentIds = [...segIds];
      newShape.pointIds = [...ptIds];
      newShape.points.forEach((pt, idx) => {
        pt.segmentIds = [...s.points[idx].segmentIds];
        pt.reference = s.points[idx].reference;
        pt.type = s.points[idx].type;
        pt.ratio = s.points[idx].ratio;
        pt.visible = s.points[idx].visible;
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
      .map(s => s.id);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  _executeAction() {
    this.involvedShapes.map(s => s.id).forEach(id => {
      let s = findObjectById(addInfoToId(id, 'main'));
      if (s.geometryObject.geometryIsHidden === true)
        s.geometryObject.geometryIsHidden = false;
      else
        s.geometryObject.geometryIsHidden = true;
    });
  }
}
