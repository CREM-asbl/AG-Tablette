import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

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
      <h2>${toolName}</h2>
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
    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.involvedShapes.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
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

    app.mainDrawingEnvironment.editingShapeIds = this.involvedShapes.map(
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
      let transformation = app.workspace.lastKnownMouseCoordinates.substract(
        this.lastKnownMouseCoordinates,
      );

      this.drawingShapes.forEach((s) => s.translate(transformation));

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  _executeAction() {
    const translation = app.workspace.lastKnownMouseCoordinates.substract(
      this.startClickCoordinates,
    );

    this.involvedShapes.forEach((s) => {
      s.translate(translation);
    });

    let transformation = getShapeAdjustment(
      this.involvedShapes,
      this.selectedShape,
    );
    this.involvedShapes.forEach((s) => {
      s.rotate(
        transformation.rotationAngle,
        this.selectedShape.centerCoordinates,
      );
      s.translate(transformation.translation);
    });
  }
}
