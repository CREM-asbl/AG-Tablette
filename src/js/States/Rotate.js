import { app } from '../App';
import { State } from './State';
import { ShapeManager } from '../ShapeManager';

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
    let toolName = 'Tourner';
    return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
            	Touchez une forme, puis glissez votre doigt sans relacher la
                forme pour la faire tourner. La forme tourne autour de son
                centre, qui est affiché lors de la rotation. Faites tournez
                votre doigt autour de ce centre pour faire tourner la forme.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.mousedown_all_shape),
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
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.initialAngle = shape.center.getAngle(mouseCoordinates);

    app.workspace.editingShapes = this.involvedShapes;
    this.currentStep = 'rotating-shape';
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    window.dispatchEvent(new CustomEvent('refresh'));
    this.animate();
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
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(mouseCoordinates) {
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
