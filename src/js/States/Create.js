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

    // show-family-shape -> listen-canvas-click -> moving-shape
    this.currentStep = null;

    // La famille sélectionnée dans le menu de gauche
    this.selectedFamily = null;

    // La forme que l'on va ajouter (on ajoute une copie de cette forme)
    this.selectedShape = null;

    // Shape à créer
    this.shapeToCreate = null;
  }

  /**
   * (ré-)initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family, timestamp = 0) {
    this.end();
    this.selectedFamily = family;
    app.selectedFamily = this.selectedFamily;
    this.selectedShape = null;
    this.currentStep = 'show-family-shapes';
    app.appDiv.cursor = 'default';
    window.addEventListener('shapeSelected', this.handler);
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('family-selected')), 0);
  }

  _actionHandle(event) {
    if (event.type == 'shapeSelected') {
      this.setShape(event.detail.shapeSelected);
    } else if (event.type == 'canvasmousedown') {
      this.onMouseDown(event.detail.mousePos);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp(event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  end() {
    window.removeEventListener('shapeSelected', this.handler);
    window.removeEventListener('canvasmousedown', this.handler);
    window.removeEventListener('canvasmouseup', this.handler);
  }

  //Todo: Solution provisoire
  abort() {
    this.end();
    this.currentStep = 'listen-canvas-click';
  }

  setShape(shape) {
    this.selectedShape = shape;
    this.currentStep = 'listen-canvas-click';
    window.addEventListener('canvasmousedown', this.handler);
  }

  onMouseDown(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.shapeToCreate = this.selectedShape.copy();
    let shapeSize = app.settings.get('shapesSize');

    this.shapeToCreate.scale(shapeSize);
    this.shapeToCreate.coordinates = mouseCoordinates;
    if (this.shapeToCreate.isCircle()) this.shapeToCreate.isCenterShown = true;

    this.currentStep = 'moving-shape';
    window.addEventListener('canvasmouseup', this.handler);
    app.drawAPI.askRefresh('upper');
  }

  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'moving-shape') return;

    let shapeSize = app.settings.get('shapesSize'),
      involvedShapes = [this.shapeToCreate];

    this.actions = [
      {
        name: 'CreateAction',
        shapeToCreate: this.shapeToCreate,
        shapeId: this.shapeToCreate.id,
        shapeSize: shapeSize,
      },
    ];

    let transformation = getShapeAdjustment(involvedShapes, this.shapeToCreate);
    if (transformation.rotation != 0) {
      let rotateAction = {
        name: 'RotateAction',
        shapeId: this.shapeToCreate.id,
        involvedShapesIds: involvedShapes.map(s => s.id),
        rotationAngle: transformation.rotation,
      };
      this.actions.push(rotateAction);
    }
    if (transformation.move.x != 0 || transformation.move.y != 0) {
      let moveAction = {
        name: 'MoveAction',
        shapeId: this.shapeToCreate.id,
        involvedShapesIds: involvedShapes.map(s => s.id),
        transformation: transformation.move,
      };
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
