import { app } from '../App';
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
   * initialiser l'état
   * @param  {String} family Nom de la famille sélectionnée
   */
  start(family) {
    this.currentStep = 'show-family-shapes';

    this.selectedFamily = family;
    app.selectedFamily = this.selectedFamily;

    window.addEventListener('shapeSelected', this.handler);
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('family-selected')), 0);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.selectedShape) {
      this.currentStep = 'listen-canvas-click';
      app.selectedShape = this.selectedShape;
    } else {
      this.currentStep = 'show-family-shapes';
    }

    window.dispatchEvent(new CustomEvent('family-selected'));
    window.addEventListener('shapeSelected', this.handler);
    window.addEventListener('canvasmousedown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.selectedShape = null;
    window.removeEventListener('shapeSelected', this.handler);
    window.removeEventListener('canvasmousedown', this.handler);
    window.removeEventListener('canvasmouseup', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'shapeSelected') {
      this.setShape(app.selectedShape);
    } else if (event.type == 'canvasmousedown') {
      this.onMouseDown(event.detail.mousePos);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp(event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
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
    app.workspace.lastKnownMouseCoordinates = mouseCoordinates;
    window.dispatchEvent(new CustomEvent('refreshUpper'));
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
    this.restart();
    window.dispatchEvent(new CustomEvent('refreshUpper'));
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  draw(ctx, mouseCoordinates) {
    if (this.currentStep != 'moving-shape' || this.status != 'running') return;

    this.shapeToCreate.coordinates = mouseCoordinates;

    window.dispatchEvent(new CustomEvent('draw-shape', { detail: { shape: this.shapeToCreate } }));
  }
}
