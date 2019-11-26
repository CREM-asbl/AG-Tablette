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
    this.actions = [new MergeAction(this.name)];
    this.currentStep = 'listen-canvas-click';

    this.firstShape = null;

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    if (this.currentStep == 'listen-canvas-click') {
      this.currentStep = 'selecting-second-shape';
      this.actions[0].firstShapeId = shape.id;
      this.firstShape = shape;
      app.drawAPI.askRefresh();
      app.drawAPI.askRefresh('upper');
      return;
    }
    if (this.currentStep != 'selecting-second-shape') return;
    if (this.actions[0].firstShapeId == shape.id) {
      this.currentStep = 'listen-canvas-click';
      this.actions[0].firstShapeId = null;
      this.firstShape = null;
      app.drawAPI.askRefresh();
      app.drawAPI.askRefresh('upper');
      return;
    }
    this.actions[0].secondShapeId = shape.id;

    let shape1 = this.firstShape,
      shape2 = shape;

    if (!this.actions[0].hasCommonSegment(shape1, shape2)) {
      console.log('no common segments');
      return;
    }

    // if (shape1.overlapsWith(shape2)) {
    //   console.log('shapes overlap!');
    //   return;
    // }

    this.executeAction();
    this.start();
    app.drawAPI.askRefresh();
    app.drawAPI.askRefresh('upper');
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   * @param  {Context2D} ctx              Le canvas
   * @param  {{x: float, y: float}} mouseCoordinates Les coordonnées de la souris
   */
  draw(ctx, mouseCoordinates) {
    if (this.currentStep == 'selecting-second-shape') {
      let shape = this.firstShape,
        borderColor = shape.borderColor;
      shape.borderColor = '#E90CC8';
      app.drawAPI.drawShape(ctx, shape, 3);
      shape.borderColor = borderColor;
    }
  }

  /**
   * Appelée par la fonction de dessin, renvoie les formes qu'il ne faut pas
   * dessiner sur le canvas principal.
   * @return {[Shape]} les formes à ne pas dessiner
   */
  getEditingShapes() {
    if (this.currentStep != 'selecting-second-shape') return [];
    return [this.firstShape];
  }
}
