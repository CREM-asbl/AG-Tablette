import { app, setState } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Shape } from '../Core/Objects/Shape';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';

/**
 * Déplacer une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class MoveState extends State {
  constructor() {
    super('move', 'Déplacer', 'move');

    // listen-canvas-click -> moving-shape
    this.currentStep = null;

    // La forme que l'on déplace
    this.selectedShape = null;

    // Coordonnées de la souris lorsque le déplacement a commencé
    this.startClickCoordinates = null;

    // L'ensemble des formes liées à la forme sélectionnée, y compris la forme elle-même
    this.involvedShapes = [];

    window.addEventListener('tool-changed', this.handler);
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
        Pour déplacer une forme, touchez la forme et glissez votre doigt sans le
        relacher. Relachez ensuite votre doigt une fois que la forme est
        correctement positionnée.
      </p>
    `;
  }

  /**
   * Main event handler
   */
   _actionHandle(event) {
    if (event.type == 'tool-changed') {
      if (app.tool.name == this.name) {
        if (app.tool.currentStep == 'start') {
          this.start();
        } else if (app.tool.currentStep == 'moving-shape') {
          this.startMoving();
        }
      } else if (app.tool.currentStep == 'start') {
        this.end();
      }
    } else if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
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

  startMoving() {
    this.removeListeners();

    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
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
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (app.tool.currentStep != 'start') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;
    this.lastKnownMouseCoordinates = this.startClickCoordinates;

    this.involvedShapes.sort((s1, s2) => ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2));
    this.drawingShapes = this.involvedShapes.map(
      s =>
        new Shape({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale'),
          id: undefined,
        })
    );

    app.mainDrawingEnvironment.editingShapeIds = this.involvedShapes.map(
      s => s.id
    );
    setState({ tool: { ...app.tool, currentStep: 'moving-shape' } });
    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();
  }

  onMouseUp() {
    if (app.tool.currentStep != 'moving-shape') return;

    console.log('mouseup')
    this.executeAction();
    setState({ tool: { ...app.tool, currentStep: 'start' } })
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  refreshStateUpper() {
    if (app.tool.currentStep == 'moving-shape') {
      let transformation = app.workspace.lastKnownMouseCoordinates.substract(
        this.lastKnownMouseCoordinates
      );

      this.drawingShapes.forEach(s => s.translate(transformation));

      this.lastKnownMouseCoordinates = app.workspace.lastKnownMouseCoordinates;
    }
  }

  executeAction() {
    const translation = app.workspace.lastKnownMouseCoordinates.substract(
      this.startClickCoordinates
    );

    this.involvedShapes.forEach(s => {
      s.translate(translation);
    });

    let transformation = getShapeAdjustment(this.involvedShapes, this.selectedShape);
    this.involvedShapes.forEach(s => {
      s.rotate(transformation.rotationAngle, this.selectedShape.centerCoordinates);
      s.translate(transformation.translation);
    });
  }
}
