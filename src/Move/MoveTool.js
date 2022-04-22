import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { Tool } from '../Core/States/Tool';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { getAllLinkedShapesInGeometry } from '../GeometryTools/general';
import { computeAllShapeTransform } from '../GeometryTools/recomputeShape';

/**
 * Déplacer une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class MoveTool extends Tool {
  constructor() {
    super('move', 'Déplacer', 'move');

    // listen-canvas-click -> move
    this.currentStep = null;

    // La figure que l'on déplace
    this.selectedShape = null;

    // Coordonnées de la souris lorsque le déplacement a commencé
    this.startClickCoordinates = null;

    // L'ensemble des figures liées à la figure sélectionnée, y compris la figure elle-même
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
        Pour déplacer une figure, touchez la figure et glissez votre doigt sans le
        relacher. Relachez ensuite votre doigt une fois que la figure est
        correctement positionnée.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.pointOnLineRatio = null;
    this.lastAdjusment = null;
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    app.workspace.selectionConstraints.shapes.blacklist = app.mainDrawingEnvironment.shapes.filter(s => s instanceof SinglePointShape);
    // app.workspace.selectionConstraints.shapes.blacklist = app.mainDrawingEnvironment.shapes.filter(s => s.name == 'PointOnIntersection');
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  move() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  end() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure a été sélectionnée (canvasMouseDown)
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'listen') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    if (app.environment.name == 'Geometrie')
      // this.involvedShapes = ShapeManager.getAllBindedShapesInGeometry(shape);
      for (let i = 0; i < this.involvedShapes.length; i++) {
        let currentShape = this.involvedShapes[i];
        if (currentShape.geometryObject.geometryTransformationName != null) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les images issues de transfomation ne peuvent pas être déplacées.' } }));
          return;
        }
        if ((currentShape.points.some(vx => (vx.reference != null && app.mainDrawingEnvironment.findObjectById(vx.reference, 'point').shape.name != 'Point')) && currentShape.name != 'PointOnLine') ||
          (currentShape.geometryObject.geometryChildShapeIds.length > 0)) {
          window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les figures liées ne peuvent pas être déplacées, mais peuvent être copiées.' } }));
          return;
        }
        // if (currentShape.points.some(vx => (vx.reference != null && app.mainDrawingEnvironment.findObjectById(vx.reference, 'point').shape.name != 'Point')) && currentShape.name != 'PointOnLine') {
        //   window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Les figures construites sur des points existants ne peuvent pas être déplacées, mais peuvent être copiées.' } }));
        //   return;
        // }
      }
    this.involvedShapes.forEach(s => s.points.forEach(vx => {
      if (vx.reference != null) {
        let refPoint = app.mainDrawingEnvironment.findObjectById(vx.reference, 'point')
        if (refPoint.shape.name == 'Point')
        this.involvedShapes.push(refPoint.shape)
      }
    }));
    this.shapesToCopy = [...this.involvedShapes];
    this.shapesToCopy.forEach(s => {
      getAllLinkedShapesInGeometry(s, this.shapesToCopy)
    });

    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

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

    app.mainDrawingEnvironment.editingShapeIds = this.shapesToCopy.map(
      (s) => s.id,
    );
    setState({ tool: { ...app.tool, currentStep: 'move' } });
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'move') return;

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (app.tool.currentStep == 'move') {

      if (this.shapesToMove.length == 1 && this.shapesToMove[0].name == 'PointOnLine') {
        let s = this.shapesToMove[0];

        let point = s.points[0];
        let reference = app.mainDrawingEnvironment.findObjectById(s.geometryObject.geometryParentObjectId1, 'segment');
        point.coordinates = reference.projectionOnSegment(app.workspace.lastKnownMouseCoordinates);
        // let ratio = reference.vertexes[0].coordinates.dist(point.coordinates) / reference.length;
        let ratioX = (point.coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
        let ratioY = (point.coordinates.x - reference.vertexes[0].coordinates.x) / (reference.vertexes[1].coordinates.x - reference.vertexes[0].coordinates.x);
        let ratio = ratioX;
        if (isNaN(ratio))
          ratio = ratioY;

        if (ratio < 0 && !(reference.shape.name.endsWith('StraightLine') && !reference.shape.name.endsWith('SeminStraightLine')))
          ratio = 0;
        if (ratio > 1 && !reference.shape.name.endsWith('StraightLine'))
          ratio = 1;
        point.ratio = ratio;
        this.pointOnLineRatio = ratio;

        let firstPoint = reference.vertexes[0];
        let secondPoint = reference.vertexes[1];

        const segLength = secondPoint.coordinates.substract(
          firstPoint.coordinates,
        );
        const part = segLength.multiply(point.ratio);

        let coord = firstPoint.coordinates.add(part);
        point.coordinates = coord;
      } else {
        let mainShape = app.upperDrawingEnvironment.findObjectById(this.selectedShape.id);
        let translation = app.workspace.lastKnownMouseCoordinates.substract(
          this.lastKnownMouseCoordinates,
        );

        this.shapesToMove.forEach((s) => {
          if (this.lastAdjusment) {
            s.translate(Coordinates.nullCoordinates.substract(this.lastAdjusment.translation));
            s.rotate(this.lastAdjusment.rotationAngle * -1, this.lastAdjusment.centerCoord);
          }
          s.translate(translation);
        });

        let adjustment = getShapeAdjustment(
          this.shapesToMove,
          mainShape,
        );
        this.lastAdjusment = {
          ...adjustment,
          centerCoord: new Coordinates(mainShape.centerCoordinates),
        };
        this.shapesToMove.forEach((s) => {
          s.rotate(
            adjustment.rotationAngle,
            mainShape.centerCoordinates,
          );
          s.translate(adjustment.translation);
        });
        this.shapesToMove.forEach(s => {
          computeAllShapeTransform(s);
        });
      }

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    app.mainDrawingEnvironment.editingShapeIds.forEach((sId, idxS) => {
      let s = app.mainDrawingEnvironment.findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(this.drawingShapes[idxS].points[idxPt].coordinates);
        if (this.pointOnLineRatio)
          pt.ratio = this.pointOnLineRatio;
      });
    });
  }
}
