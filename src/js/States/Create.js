import { app } from '../App';
import { CreateAction } from './Actions/Create';
import { RotateAction } from './Actions/Rotate';
import { MoveAction } from './Actions/Move';
import { State } from './State';
import { getShapeAdjustment } from '../Tools/automatic_adjustment';

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
    this.shapeToCreate = null;

    //Shape finale
    this.shapeToCreate = null;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family, timestamp = 0) {
    this.selectedFamily = family;
    this.selectedShape = null;
    this.currentStep = 'show-family-shapes';
    // this.lastCreationTimestamp = timestamp;
    app.appDiv.cursor = 'default';
  }

  //Todo: Solution provisoire
  abort() {
    this.currentStep = 'listen-canvas-click';
  }

  setShape(shape) {
    this.actions = [new CreateAction(this.name)];
    this.selectedShape = shape;
    this.currentStep = 'listen-canvas-click';
    window.dispatchEvent(new CustomEvent('app-state-changed', { detail: app.state }));
  }

  onMouseDown(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.shapeToCreate = this.selectedShape.copy();
    let shapeSize = app.settings.get('shapesSize');
    this.involvedShapes = [this.shapeToCreate];

    this.shapeToCreate.scale(shapeSize);
    this.shapeToCreate.coordinates = mouseCoordinates;
    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    this.actions[0].shapeToCreate = this.shapeToCreate;
    this.actions[0].coordinates = mouseCoordinates;
    this.actions[0].shapeSize = shapeSize;
    this.actions[0].shapeId = this.actions[0].shapeToCreate.id;

    this.currentStep = 'moving-shape';

    app.drawAPI.askRefresh('upper');
  }

  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    this.actions = [new CreateAction(this.name)];

    let shapeSize = app.settings.get('shapesSize');

    this.involvedShapes = [this.shapeToCreate];

    this.actions[0].shapeToCreate = this.shapeToCreate;
    this.actions[0].shapeSize = shapeSize;
    this.actions[0].shapeId = this.shapeToCreate.id;
    this.actions[0].coordinates = mouseCoordinates;

    let transformation = getShapeAdjustment(this.involvedShapes, this.shapeToCreate);
    if (transformation.rotation != 0) {
      let rotateAction = new RotateAction();

      rotateAction.shapeId = this.shapeToCreate.id;
      rotateAction.involvedShapesIds = this.involvedShapes.map(s => s.id);
      rotateAction.rotationAngle = transformation.rotation;
      this.actions.push(rotateAction);
    }
    if (transformation.move.x != 0 || transformation.move.y != 0) {
      let moveAction = new MoveAction();

      moveAction.shapeId = this.shapeToCreate.id;
      moveAction.involvedShapesIds = this.involvedShapes.map(s => s.id);
      moveAction.transformation = transformation.move;
      this.actions.push(moveAction);
    }

    this.executeAction();
    this.setShape(this.selectedShape);
    app.drawAPI.askRefresh('upper');
    app.drawAPI.askRefresh();
  }

  draw(ctx, mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    this.shapeToCreate.coordinates = mouseCoordinates;

    app.drawAPI.drawShape(ctx, this.shapeToCreate);
  }
}
