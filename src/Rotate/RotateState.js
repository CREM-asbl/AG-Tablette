import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class RotateState extends State {
  constructor() {
    super('rotate', 'Tourner', 'move');

    this.drawColor = '#080';

    this.currentStep = null; // listen-canvas-click -> rotating-shape

    //La forme que l'on déplace
    this.selectedShape = null;

    //L'angle initial entre le centre de la forme et la position de la souris
    this.initialAngle = null;

    /*
        L'ensemble des formes liées à la forme sélectionnée, y compris la forme
        elle-même
         */
    this.involvedShapes = [];

    this.handler = event => this._actionHandle(event);
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
    this.currentStep = 'listen-canvas-click';
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.mousedown_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.mousedown_all_shape)
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    window.cancelAnimationFrame(this.requestAnimFrameId);
    this.currentStep = 'listen-canvas-click';
    app.workspace.editingShapes = [];
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
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.initialAngle = shape.center.getAngle(
      app.workspace.lastKnownMouseCoordinates
    );

    app.workspace.editingShapes = this.involvedShapes;
    this.currentStep = 'rotating-shape';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();
  }

  onMouseUp() {
    if (this.currentStep != 'rotating-shape') return;

    let newAngle = this.selectedShape.center.getAngle(
      app.workspace.lastKnownMouseCoordinates
    );
    let rotationAngle = newAngle - this.initialAngle;
    let adjustedRotationAngle = rotationAngle;

    if (app.environment.name == 'Tangram') {
      const rotationAngleInDegree = (rotationAngle / Math.PI) * 180;
      let adjustedRotationAngleInDegree = rotationAngleInDegree;
      adjustedRotationAngleInDegree = Math.round(rotationAngleInDegree);
      let sign = rotationAngleInDegree > 0 ? 1 : -1;
      let absoluteValueRotationAngleInDegree = Math.abs(
        adjustedRotationAngleInDegree
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
      adjustedRotationAngle = (adjustedRotationAngleInDegree * Math.PI) / 180;
    }

    this.actions = [
      {
        name: 'RotateAction',
        shapeId: this.selectedShape.id,
        involvedShapesIds: this.involvedShapes.map(s => s.id),
        rotationAngle: adjustedRotationAngle,
      },
    ];

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw() {
    if (this.currentStep != 'rotating-shape') return;

    let center = this.selectedShape.center;
    let newAngle = center.getAngle(app.workspace.lastKnownMouseCoordinates),
      diffAngle = newAngle - this.initialAngle;

    window.dispatchEvent(
      new CustomEvent('draw-group', {
        detail: {
          involvedShapes: this.involvedShapes,
          functionCalledBeforeDraw: s => {
            s.rotate(diffAngle, center);
          },
          functionCalledAfterDraw: s => {
            s.rotate(-diffAngle, center);
          },
        },
      })
    );

    //Dessiner le centre de symétrie
    window.dispatchEvent(
      new CustomEvent('draw-point', {
        detail: { point: center, color: this.drawColor },
      })
    );
  }
}
