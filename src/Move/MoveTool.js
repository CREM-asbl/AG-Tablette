import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { computeAllShapeTransform } from '../GeometryTools/recomputeShape';
import { getAllInvolvedShapes } from '../GeometryTools/general';
import { Coordinates } from '../Core/Objects/Coordinates';

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

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    this.lastAdjusment = null;
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  move() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure a été sélectionnée (canvasMouseDown)
   * @param  {Shape} shape            La figure sélectionnée
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'listen') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.shapesToCopy = [...this.involvedShapes];
    this.shapesToCopy.forEach(s => getAllInvolvedShapes(s, this.shapesToCopy));

    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.shapesToCopy.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
    this.drawingShapes = this.shapesToCopy.map(
      (s) => {
        let newShape = new Shape({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale'),
          divisionPointInfos: s.segments.map((seg, idx) => seg.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: idx, id: dp.id };
          })).flat(),
        });
        let segIds = newShape.segments.map((seg, idx) => seg.id = s.segments[idx].id);
        let ptIds = newShape.points.map((seg, idx) => seg.id = s.points[idx].id);
        newShape.segmentIds = [...segIds];
        newShape.pointIds = [...ptIds];
        newShape.segments.forEach((seg, idx) => {
          seg.vertexIds = [...s.segments[idx].vertexIds];
          seg.divisionPointIds = [...s.segments[idx].divisionPointIds];
          seg.arcCenterId = s.segments[idx].arcCenterId;
        });
        newShape.points.forEach((pt, idx) => {
          pt.segmentIds = [...s.points[idx].segmentIds];
          pt.reference = s.points[idx].reference;
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

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    app.mainDrawingEnvironment.editingShapeIds.forEach((sId, idxS) => {
      let s = app.mainDrawingEnvironment.findObjectById(sId);
      s.points.forEach((pt, idxPt) => {
        pt.coordinates = new Coordinates(this.drawingShapes[idxS].points[idxPt].coordinates);
      });
    });
  }
}
