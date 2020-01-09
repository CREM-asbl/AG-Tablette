import { app } from '../App';
import { CopyAction } from './Actions/Copy';
import { RotateAction } from './Actions/Rotate';
import { State } from './State';
import { getShapeAdjustment } from '../Tools/automatic_adjustment';
import { Point } from '../Objects/Point';
import { uniqId } from '../Tools/general';

/**
 * Dupliquer une forme
 */
export class CopyState extends State {
  constructor() {
    super('copy_shape');

    this.currentStep = null; // listen-canvas-click -> moving-shape

    //La forme que l'on duplique
    this.selectedShape = null;

    //coordonnées de la souris lorsque la duplication a commencé
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
    this.currentStep = 'listen-canvas-click';

    this.selectedShape = null;
    this.startClickCoordinates = null;
    this.involvedShapes = [];

    app.interactionAPI.setFastSelectionConstraints('mousedown_all_shape');
    app.appDiv.cursor = 'default';
    window.addEventListener('objectSelected', this.handler);
  }

  abort() {
    this.start();
  }

  end() {
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
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;

    let group = app.workspace.getShapeGroup(shape);
    if (group) {
      this.involvedShapesIds = [...group.shapesIds];
      this.involvedShapes = group.shapesIds.map(id => app.workspace.getShapeById(id));
    } else {
      this.involvedShapesIds = [shape.id];
      this.involvedShapes = [shape];
    }

    this.startClickCoordinates = clickCoordinates;

    window.removeEventListener('objectSelected', this.handler);
    window.addEventListener('canvasmouseup', this.handler);
    this.currentStep = 'moving-shape';
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  /**
   * Appelée lorsque l'événement mouseup est déclanché sur le canvas
   * @param  {{x: float, y: float}} mouseCoordinates les coordonnées de la souris
   * @param  {Event} event            l'événement javascript
   */
  onMouseUp(mouseCoordinates, event) {
    if (this.currentStep != 'moving-shape') return;

    let translation = new Point(mouseCoordinates).subCoordinates(this.startClickCoordinates),
      involvedShapesCopies = this.involvedShapes.map(shape => shape.copy()),
      selectedShapeCopy = this.selectedShape.copy();
    involvedShapesCopies.forEach(shape => shape.translate(translation));
    selectedShapeCopy.translate(translation);
    let transformation = getShapeAdjustment(involvedShapesCopies, selectedShapeCopy);
    this.actions = [
      {
        name: 'CopyAction',
        involvedShapesIds: this.involvedShapesIds,
        newShapesIds: this.involvedShapesIds.map(() => uniqId()),
        transformation: translation.addCoordinates(transformation.move),
        createdUsergroupId: uniqId(),
      },
    ];
    if (transformation.rotation != 0) {
      let rotateAction = {
        name: 'RotateAction',
        shapeId: this.actions[0].newShapesIds[
          this.involvedShapesIds.findIndex(idx => idx == this.selectedShape.id)
        ],
        involvedShapesIds: this.actions[0].newShapesIds,
        rotationAngle: transformation.rotation,
      };
      this.actions.push(rotateAction);
    }

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

    let transformation = mouseCoordinates.subCoordinates(this.startClickCoordinates);

    this.involvedShapes.forEach(s => {
      let newCoords = s.coordinates.addCoordinates(transformation),
        saveCoords = s.coordinates;

      s.coordinates = newCoords;

      app.drawAPI.drawShape(ctx, s);

      s.coordinates = saveCoords;
    });
  }
}
