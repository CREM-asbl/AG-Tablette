import { app } from '../App';
import { State } from './State';
import { getShapeAdjustment } from '../Tools/automatic_adjustment';
import { Point } from '../Objects/Point';

/**
 * Déplacer une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class MoveState extends State {
  constructor() {
    super('move_shape');

    this.currentStep = null; // listen-canvas-click -> moving-shape

    //La forme que l'on déplace
    this.selectedShape = null;

    //coordonnées de la souris lorsque le déplacement a commencé
    this.startClickCoordinates = null;

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
    window.removeEventListener('canvasclick', this.handler);
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
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);
    this.startClickCoordinates = mouseCoordinates;

    app.editingShapes = this.involvedShapes;
    this.currentStep = 'moving-shape';
    window.addEventListener('canvasmouseup', this.handler);
    app.lastKnownMouseCoordinates = mouseCoordinates;
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée lorsque l'événement mouseup est déclanché sur le canvas
   * @param  {Point} mouseCoordinates les coordonnées de la souris
   */
  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    const translation = mouseCoordinates.subCoordinates(this.startClickCoordinates);
    this.involvedShapes.forEach(shape => {
      shape.coordinates = shape.coordinates.addCoordinates(translation);
    });
    const transformation = getShapeAdjustment(this.involvedShapes, this.selectedShape);
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
    if (this.currentStep != 'moving-shape') return;

    let transformation = mouseCoordinates.subCoordinates(this.startClickCoordinates);

    this.involvedShapes.forEach(s => {
      let newCoords = new Point(s).addCoordinates(transformation),
        saveCoords = s.coordinates;

      s.coordinates = newCoords;
      window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: s } }));
      s.coordinates = saveCoords;
    });
  }
}
