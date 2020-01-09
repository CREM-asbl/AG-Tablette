import { app } from '../App';
import { MoveAction } from './Actions/Move';
import { RotateAction } from './Actions/Rotate';
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
   * (ré-)initialiser l'état
   */
  start() {
    this.end();
    this.actions = [new MoveAction(this.name)];
    this.currentStep = 'listen-canvas-click';

    this.selectedShape = null;
    this.startClickCoordinates = null;
    this.involvedShapes = [];

    app.interactionAPI.setFastSelectionConstraints('mousedown_all_shape');
    app.appDiv.cursor = 'move';
    window.addEventListener('objectSelected', this.handler);
  }

  abort() {
    this.start();
  }

  end() {
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
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   */
  objectSelected(shape, clickCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;
    this.involvedShapes = app.workspace.getAllBindedShapes(shape, true);
    this.startClickCoordinates = clickCoordinates;

    this.actions[0].shapeId = shape.id;
    this.actions[0].involvedShapesIds = this.involvedShapes.map(s => s.id);

    app.editingShapes = this.involvedShapes;
    this.currentStep = 'moving-shape';
    window.addEventListener('canvasmouseup', this.handler);
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  /**
   * Appelée lorsque l'événement mouseup est déclanché sur le canvas
   * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
   * @param  {Event} event            l'événement javascript
   */
  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    const translation = new Point(mouseCoordinates).subCoordinates(this.startClickCoordinates);
    this.involvedShapes.forEach(shape => {
      shape.coordinates = shape.coordinates.addCoordinates(translation);
    });
    const transformation = getShapeAdjustment(this.involvedShapes, this.selectedShape);
    this.involvedShapes.forEach(shape => {
      shape.coordinates = shape.coordinates.subCoordinates(translation);
    });

    if (transformation.rotation != 0) {
      let rotateAction = new RotateAction();

      rotateAction.shapeId = this.selectedShape.id;
      rotateAction.involvedShapesIds = this.involvedShapes.map(s => s.id);
      rotateAction.rotationAngle = transformation.rotation;
      this.actions.push(rotateAction);
    }
    this.actions[0].transformation = translation.addCoordinates(transformation.move);

    this.executeAction();
    this.start();
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    let transformation = {
      x: mouseCoordinates.x - this.startClickCoordinates.x,
      y: mouseCoordinates.y - this.startClickCoordinates.y,
    };

    this.involvedShapes.forEach(s => {
      let newCoords = {
          x: s.x + transformation.x,
          y: s.y + transformation.y,
        },
        saveCoords = s.coordinates;

      s.coordinates = newCoords;

      app.drawAPI.drawShape(ctx, s);

      s.coordinates = saveCoords;
    });
  }
}
