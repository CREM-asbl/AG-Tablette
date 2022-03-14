import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { uniqId } from '../Core/Tools/general';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';

/**
 * Monter des figures  cachées.
 */
export class ShowTool extends Tool {
  constructor() {
    super('show', 'Montrer', 'tool');
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
    // app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    app.workspace.selectionConstraints.shapes.canSelectFromUpper = true;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  end() {
    console.log('end');
    app.upperDrawingEnvironment.removeAllObjects();
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
    app.upperDrawingEnvironment.removeAllObjects();

    app.mainDrawingEnvironment.shapes.filter(s => s.geometryObject.geometryIsHidden === true).forEach(s => {
      let newShape = new s.constructor({
        ...s,
        drawingEnvironment: app.upperDrawingEnvironment,
        path: s.getSVGPath('no scale', false, false),
        strokeColor: '#f00',
        divisionPointInfos: s.divisionPoints.map((dp) => {
          return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: dp.id };
        }),
        geometryObject: new GeometryObject({...s.geometryObject, geometryIsHidden: false}),
      });
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
    app.mainDrawingEnvironment.editingShapeIds = app.mainDrawingEnvironment.shapes
      .filter(s => s.geometryObject.geometryIsHidden === true)
      .map(s => s.id);
    console.log(app.mainDrawingEnvironment.editingShapeIds);
    console.log(app.upperDrawingEnvironment.shapes);
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  _executeAction() {
    this.involvedShapes.map(s => s.id).forEach(id => {
      let s = app.mainDrawingEnvironment.findObjectById(id, 'shape');
      s.geometryObject.geometryIsHidden = false;
    });
  }
}
