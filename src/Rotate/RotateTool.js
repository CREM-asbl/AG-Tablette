import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Point } from '../Core/Objects/Point';
import { Shape } from '../Core/Objects/Shape';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class RotateTool extends Tool {
  constructor() {
    super('rotate', 'Tourner', 'move');

    this.drawColor = '#080';

    this.currentStep = null; // listen-canvas-click -> rotate

    //La forme que l'on déplace
    this.selectedShape = null;

    //L'angle initial entre le centre de la forme et la position de la souris
    this.initialAngle = null;

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
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
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez une forme, puis glissez votre doigt sans relacher la forme pour
        la faire tourner. La forme tourne autour de son centre, qui est affiché
        lors de la rotation. Faites tournez votre doigt autour de ce centre pour
        faire tourner la forme.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    app.mainDrawingEnvironment.editingShapeIds = [];
    app.upperDrawingEnvironment.removeAllObjects();
    this.stopAnimation();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;
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
   * Appelée par événement du SelectManager quand une forme est sélectionnée (canvasMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'start') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.center = shape.centerCoordinates;
    this.initialAngle = this.center.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.lastAngle = this.initialAngle;

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

    new Point({
      coordinates: this.center,
      drawingEnvironment: app.upperDrawingEnvironment,
      color: this.drawColor,
    });

    app.mainDrawingEnvironment.editingShapeIds = this.involvedShapes.map(
      (s) => s.id,
    );
    setState({ tool: { ...app.tool, currentStep: 'rotate' } });
    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'rotate') return;

    let newAngle = this.center.angleWith(
      app.workspace.lastKnownMouseCoordinates,
    );
    let rotationAngle = newAngle - this.initialAngle;
    this.adjustedRotationAngle = rotationAngle;

    if (app.environment.name == 'Tangram') {
      const rotationAngleInDegree = (rotationAngle / Math.PI) * 180;
      let adjustedRotationAngleInDegree = rotationAngleInDegree;
      adjustedRotationAngleInDegree = Math.round(rotationAngleInDegree);
      let sign = rotationAngleInDegree > 0 ? 1 : -1;
      let absoluteValueRotationAngleInDegree = Math.abs(
        adjustedRotationAngleInDegree,
      );
      if (absoluteValueRotationAngleInDegree % 5 <= 2) {
        adjustedRotationAngleInDegree =
          sign *
          (absoluteValueRotationAngleInDegree -
            (absoluteValueRotationAngleInDegree % 5));
      } else {
        adjustedRotationAngleInDegree =
          sign *
          (absoluteValueRotationAngleInDegree +
            5 -
            (absoluteValueRotationAngleInDegree % 5));
      }
      this.adjustedRotationAngle =
        (adjustedRotationAngleInDegree * Math.PI) / 180;
    }

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'start' } });
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

      this.drawingShapes.forEach((s) => s.rotate(diffAngle, this.center));

      this.lastAngle = newAngle;
    }
  }

  _executeAction() {
    let center = this.selectedShape.centerCoordinates;

    this.involvedShapes.forEach((s) => {
      s.rotate(this.adjustedRotationAngle, center);
    });

    let transformation = getShapeAdjustment(
      this.involvedShapes,
      this.selectedShape,
    );
    this.involvedShapes.forEach((s) => {
      s.rotate(transformation.rotationAngle, center);
      s.translate(transformation.translation);
    });
  }
}
