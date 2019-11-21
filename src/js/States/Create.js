import { app } from '../App';
import { CreateAction } from './Actions/Create';
import { RotateAction } from './Actions/Rotate';
import { MoveAction } from './Actions/Move';
import { State } from './State';
import { Points } from '../Tools/points';
import { getShapeAdjustment, getNewShapeAdjustment } from '../Tools/automatic_adjustment';

/**
 * Ajout de formes sur l'espace de travail
 */
export class CreateState extends State {
  constructor() {
    super('create_shape');

    this.currentStep = null; // show-family-shape -> listen-canvas-click

    //La famille sélectionnée dans le menu de gauche
    this.selectedFamily = null;

    //La forme que l'on va ajouter (on ajoute une copie de cette forme)
    this.selectedShape = null;

    //Shape temporaire (pour le deplacement)
    this.tempShape = null;

    //Shape finale
    this.finalShape = null;

    this.lastCreationTimestamp = null;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family, timestamp = 0) {
    this.selectedFamily = family;
    this.selectedShape = null;
    this.currentStep = 'show-family-shapes';
    this.lastCreationTimestamp = timestamp;
    app.appDiv.cursor = 'default';
  }

  setShape(shape) {
    this.actions = [new CreateAction(this.name)];
    this.selectedShape = shape;
    this.currentStep = 'listen-canvas-click';
    window.dispatchEvent(new CustomEvent('app-state-changed', { detail: app.state }));
  }

  onMouseDown(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;
    if (Date.now() - this.lastCreationTimestamp < 300) {
      console.log('clics trop rapprochés');
      return;
    }
    this.tempShape = this.selectedShape.copy();
    let shapeSize = app.settings.get('shapesSize');
    this.involvedShapes = [this.tempShape];

    this.tempShape.setScale(shapeSize);
    this.tempShape.setCoordinates(mouseCoordinates);

    this.actions[0].shapeToAdd = this.tempShape;
    this.actions[0].coordinates = mouseCoordinates;
    this.actions[0].shapeSize = shapeSize;
    this.actions[0].isTemporary = true;
    this.actions[0].shapeId = this.actions[0].shapeToAdd.id;

    this.currentStep = 'moving-shape';

    this.executeAction();

    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  onMouseMove(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    this.tempShape.setCoordinates(mouseCoordinates);

    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    this.actions = [new CreateAction(this.name)];

    let shapeSize = app.settings.get('shapesSize');
    let coordinates = mouseCoordinates;

    this.finalShape = this.tempShape.copy();
    app.workspace.deleteShape(this.tempShape);
    this.involvedShapes = [this.finalShape];

    this.finalShape.setCoordinates(coordinates);
    this.actions[0].shapeToAdd = this.finalShape;
    this.actions[0].shapeSize = shapeSize;
    this.actions[0].isTemporary = false;
    this.actions[0].shapeId = this.finalShape.id;
    this.actions[0].coordinates = coordinates;

    let transformation = getShapeAdjustment(this.involvedShapes, this.finalShape, coordinates);

    if (transformation.move.x != 0 || transformation.move.y != 0) {
      let moveAction = new MoveAction();

      moveAction.shapeId = this.finalShape.id;
      moveAction.involvedShapesIds = this.involvedShapes.map(s => s.id);
      moveAction.transformation = transformation.move;
      this.actions.push(moveAction);
    }
    if (transformation.rotation != 0) {
      let rotateAction = new RotateAction();

      rotateAction.shapeId = this.finalShape.id;
      rotateAction.involvedShapesIds = this.involvedShapes.map(s => s.id);
      rotateAction.rotationAngle = transformation.rotation;
      this.actions.push(rotateAction);
    }

    this.executeAction();
    this.setShape(this.selectedShape);
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }
}
