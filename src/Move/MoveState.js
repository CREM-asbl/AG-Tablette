import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { getShapeAdjustment } from '../Core/Tools/automatic_adjustment';
import { ShapeManager } from '../Core/Managers/ShapeManager';

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
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(() =>
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.mousedown_all_shape)
      )
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(() =>
      setTimeout(
        () =>
          (app.workspace.selectionConstraints =
            app.fastSelectionConstraints.mousedown_all_shape)
      )
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
    this.currentStep = 'listen-canvas-click';
    app.workspace.editingShapesIds = [];
    app.removeListener('objectSelected', this.objectSelectedId);
    app.removeListener('canvasmouseup', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.startClickCoordinates = app.workspace.lastKnownMouseCoordinates;

    app.workspace.editingShapesIds = this.involvedShapes.map(s => s.id);
    this.currentStep = 'moving-shape';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();
  }

  onMouseUp() {
    if (this.currentStep != 'moving-shape') return;

    const translation = app.workspace.lastKnownMouseCoordinates.subCoordinates(
      this.startClickCoordinates
    );
    this.involvedShapes.forEach(shape => {
      shape.coordinates = shape.coordinates.addCoordinates(translation);
    });
    const transformation = getShapeAdjustment(
      this.involvedShapes,
      this.selectedShape
    );
    this.involvedShapes.forEach(shape => {
      shape.coordinates = shape.coordinates.subCoordinates(translation);
    });

    this.actions = [
      {
        name: 'MoveAction',
        shapeId: this.selectedShape.id,
        involvedShapesIds: this.involvedShapes.map(s => s.id),
        transformation: translation.addCoordinates(transformation.move),
      },
    ];

    if (transformation.rotation != 0) {
      let rotateAction = {
        name: 'RotateAction',
        shapeId: this.selectedShape.id,
        involvedShapesIds: this.involvedShapes.map(s => s.id),
        rotationAngle: transformation.rotation,
      };
      this.actions.push(rotateAction);
    }

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw() {
    if (this.currentStep != 'moving-shape') return;

    let transformation = app.workspace.lastKnownMouseCoordinates.subCoordinates(
      this.startClickCoordinates
    );

    window.dispatchEvent(
      new CustomEvent('draw-group', {
        detail: {
          involvedShapes: this.involvedShapes,
          functionCalledBeforeDraw: s => s.translate(transformation),
          functionCalledAfterDraw: s => s.translate(transformation, true),
        },
      })
    );
  }
}
