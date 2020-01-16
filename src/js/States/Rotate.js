import { app } from '../App';
import { State } from './State';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class RotateState extends State {
  constructor() {
    super('rotate_shape');

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
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    app.interactionAPI.setFastSelectionConstraints('mousedown_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.interactionAPI.setFastSelectionConstraints('mousedown_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.currentStep = 'listen-canvas-click';
    app.editingShapes = [];
    window.removeEventListener('objectSelected', this.handler);
    window.removeEventListener('canvasmouseup', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp(event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par interactionAPI quand une forme est sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);
    this.initialAngle = shape.center.getAngle(mouseCoordinates);

    app.editingShapes = this.involvedShapes;
    this.currentStep = 'rotating-shape';
    window.addEventListener('canvasmouseup', this.handler);
    app.lastKnownMouseCoordinates = mouseCoordinates;
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée lorsque l'événement mouseup est déclanché sur le canvas
   * @param  {Point} mouseCoordinates les coordonnées de la souris
   * @param  {Event} event            l'événement javascript
   */
  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'rotating-shape') return;

    let newAngle = this.selectedShape.center.getAngle(mouseCoordinates);

    this.actions = [
      {
        name: 'RotateAction',
        shapeId: this.selectedShape.id,
        involvedShapesIds: this.involvedShapes.map(s => s.id),
        rotationAngle: newAngle - this.initialAngle,
      },
    ];

    this.executeAction();
    this.restart();
    app.lastKnownMouseCoordinates = mouseCoordinates;
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {
    if (this.currentStep != 'rotating-shape') return;

    let newAngle = this.selectedShape.center.getAngle(mouseCoordinates),
      diffAngle = newAngle - this.initialAngle;
    let center = this.selectedShape.center;

    this.involvedShapes.forEach(s => {
      s.rotate(diffAngle, center);

      window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: s } }));

      s.rotate(-diffAngle, center);
    });

    //Dessiner le centre de symétrie
    window.dispatchEvent(
      new CustomEvent('draw-point', { detail: { point: center, color: this.drawColor } }),
    );
  }
}
