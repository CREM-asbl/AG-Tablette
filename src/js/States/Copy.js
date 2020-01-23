import { app } from '../App';
import { State } from './State';
import { getShapeAdjustment } from '../Tools/automatic_adjustment';
import { Point } from '../Objects/Point';
import { uniqId } from '../Tools/general';
import { GroupManager } from '../GroupManager';
import { ShapeManager } from '../ShapeManager';

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
   * initialiser l'état
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
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.selectedShape = shape;

    let group = GroupManager.getShapeGroup(shape);
    if (group) {
      this.involvedShapesIds = [...group.shapesIds];
      this.involvedShapes = group.shapesIds.map(id => ShapeManager.getShapeById(id));
    } else {
      this.involvedShapesIds = [shape.id];
      this.involvedShapes = [shape];
    }

    this.startClickCoordinates = mouseCoordinates;

    app.removeListener('objectSelected', this.objectSelectedId);
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
    this.currentStep = 'moving-shape';
    this.animate();
  }

  /**
   * Appelée lorsque l'événement mouseup est déclanché sur le canvas
   * @param  {Point} mouseCoordinates les coordonnées de la souris
   */
  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    let translation = mouseCoordinates.subCoordinates(this.startClickCoordinates),
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
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Point} mouseCoordinates Les coordonnées de la souris
   */
  draw(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    let transformation = mouseCoordinates.subCoordinates(this.startClickCoordinates);

    this.involvedShapes.forEach(s => {
      let newCoords = s.coordinates.addCoordinates(transformation),
        saveCoords = s.coordinates;

      s.coordinates = newCoords;

      window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: s } }));

      s.coordinates = saveCoords;
    });
  }
}
