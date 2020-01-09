import { app } from '../App';
import { MergeAction } from './Actions/Merge';
import { State } from './State';

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeState extends State {
  constructor() {
    super('merge_shapes');

    // listen-canvas-click -> selecting-second-shape
    this.currentStep = null;

    this.firstShape = null;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.end();
    this.actions = [new MergeAction(this.name)];
    this.currentStep = 'listen-canvas-click';

    this.firstShape = null;

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
    window.addEventListener('objectSelected', this.handler);
  }

  end() {
    app.editingShapes = [];
    window.removeEventListener('objectSelected', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape) {
    if (this.currentStep == 'listen-canvas-click') {
      this.currentStep = 'selecting-second-shape';
      this.actions[0].firstShapeId = shape.id;
      this.firstShape = shape;
      app.editingShapes = [this.firstShape];
      app.drawAPI.askRefresh();
      app.drawAPI.askRefresh('upper');
      return;
    }
    if (this.currentStep != 'selecting-second-shape') return;
    if (this.actions[0].firstShapeId == shape.id) {
      this.currentStep = 'listen-canvas-click';
      this.actions[0].firstShapeId = null;
      this.firstShape = null;
      app.editingShapes = [];
      app.drawAPI.askRefresh();
      app.drawAPI.askRefresh('upper');
      return;
    }
    this.actions[0].secondShapeId = shape.id;

    let shape1 = this.firstShape,
      shape2 = shape;

    if (shape1.getCommonsPoints(shape2).length < 2) {
      console.log('no common segments');
      return;
    }

    if (shape1.overlapsWith(shape2)) {
      console.log('shapes overlap!');
      return;
    }

    this.executeAction();
    this.start();
    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   */
  draw(ctx) {
    if (this.currentStep == 'selecting-second-shape') {
      let shape = this.firstShape,
        borderColor = shape.borderColor;
      shape.borderColor = '#E90CC8';
      app.drawAPI.drawShape(ctx, shape, 3);
      shape.borderColor = borderColor;
    }
  }
}
