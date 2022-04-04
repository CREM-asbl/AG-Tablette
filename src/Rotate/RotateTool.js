import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { getAllLinkedShapesInGeometry } from '../GeometryTools/general';
import { computeAllShapeTransform } from '../GeometryTools/recomputeShape';

/**
 * Tourner une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class RotateTool extends Tool {
  constructor() {
    super('rotate', 'Tourner', 'move');

    this.drawColor = '#080';

    this.currentStep = null; // listen-canvas-click -> rotate

    //La figure que l'on déplace
    this.selectedShape = null;

    //L'angle initial entre le centre de la figure et la position de la souris
    this.initialAngle = null;

    /*
        L'ensemble des figures liées à la figure sélectionnée, y compris la figure
        elle-même
         */
    this.involvedShapes = [];
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez une figure, puis glissez votre doigt sans relacher la figure pour
        la faire tourner. La figure tourne autour de son centre, qui est affiché
        lors de la rotation. Faites tournez votre doigt autour de ce centre pour
        faire tourner la figure.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist = app.mainDrawingEnvironment.shapes.filter(s => s instanceof SinglePointShape);
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  rotate() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();
  }

  /**
   * Appelée par événement du SelectManager quand une figure est sélectionnée (canvasMouseDown)
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'listen') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    if (app.environment.name == 'Geometrie')
      for (let i = 0; i < this.involvedShapes.length; i++) {
        let currentShape = this.involvedShapes[i];
        if (currentShape.geometryObject?.geometryTransformationName != null) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les images issues de transfomation ne peuvent pas être tournées.' } }));
          return;
        }
        if (currentShape.name.startsWith('Parallele') || currentShape.name.startsWith('Perpendicular')) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les lignes parallèles ne peuvent pas être tournées.' } }));
          return;
        }
        if ((currentShape.points.some(vx => (vx.reference != null && app.mainDrawingEnvironment.findObjectById(vx.reference, 'point').shape.name != 'Point')) && currentShape.name != 'PointOnLine') ||
          (currentShape.geometryObject.geometryChildShapeIds.length > 0)) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les figures liées ne peuvent pas être tournées, mais peuvent être copiées.' } }));
          return;
        }
        // if (currentShape.points.some(vx => (vx.reference != null && app.mainDrawingEnvironment.findObjectById(vx.reference, 'point').shape.name != 'Point')) && currentShape.name != 'PointOnLine') {
        //   window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les figures construites sur des points existants ne peuvent pas être tournées, mais peuvent être copiées.' } }));
        //   return;
        // }
      }

    this.shapesToCopy = [...this.involvedShapes];
    this.shapesToCopy.forEach(s => {
      getAllLinkedShapesInGeometry(s, this.shapesToCopy)
    });

    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.center = shape.centerCoordinates;
    this.initialAngle = this.center.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.lastAngle = this.initialAngle;

    this.shapesToCopy.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
    this.drawingShapes = this.shapesToCopy.map(
      (s) => {
        let newShape = new s.constructor({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale', false, false),
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: dp.id, color: dp.color };
          }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
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
      }
    );
    this.shapesToMove = this.drawingShapes.filter(s => this.involvedShapes.find(inShape => inShape.id == s.id));

    if (app.environment.name != 'Cubes')
      new Point({
        coordinates: this.center,
        drawingEnvironment: app.upperDrawingEnvironment,
        color: this.drawColor,
      });

    app.mainDrawingEnvironment.editingShapeIds = this.shapesToCopy.map(
      (s) => s.id,
    );
    setState({ tool: { ...app.tool, currentStep: 'rotate' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'rotate') return;

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (app.tool.currentStep == 'rotate') {
      let newAngle = this.center.angleWith(
          app.workspace.lastKnownMouseCoordinates,
        ),
        diffAngle = newAngle - this.lastAngle;

      this.lastAngle = newAngle;
      this.shapesToMove.forEach((s) => {
        s.rotate(diffAngle, this.center);
        computeAllShapeTransform(s);
      });
    }
    this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
  }

  _executeAction() {
    let centerCoordinates = this.selectedShape.centerCoordinates;
    let adjustment = getShapeAdjustment(
      this.shapesToMove,
      this.selectedShape,
    );
    app.mainDrawingEnvironment.editingShapeIds.filter(editingShapeId => this.shapesToMove.some(shapeToMove => shapeToMove.id == editingShapeId)).forEach((sId, idxS) => {
      let s = app.mainDrawingEnvironment.findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(this.shapesToMove[idxS].points[idxPt].coordinates);
        if (this.pointOnLineRatio)
          pt.ratio = this.pointOnLineRatio;
      });

      s.rotate(
        adjustment.rotationAngle,
        centerCoordinates,
      );
      s.translate(adjustment.translation);

      computeAllShapeTransform(s, 'main');
    });
  }
}
