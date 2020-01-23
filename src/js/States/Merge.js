import { app } from '../App';
import { State } from './State';
import { uniqId } from '../Tools/general';

/**
 * Fusionner 2 formes en une nouvelle forme
 */
export class MergeState extends State {
  constructor() {
    super('merge_shapes');

    // listen-canvas-click -> selecting-second-shape
    this.currentStep = null;

    this.firstShape = null;

    this.secondShape = null;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    if (this.currentStep == 'selecting-second-shape')
      app.workspace.editingShapes = [this.firstShape];
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    if (this.status != 'paused') {
      app.workspace.editingShapes = [];
      this.currentStep = 'listen-canvas-click';
    }
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape) {
    if (this.currentStep == 'listen-canvas-click') {
      this.currentStep = 'selecting-second-shape';
      this.firstShape = shape;
      app.workspace.editingShapes = [shape];
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      return;
    }
    if (this.currentStep != 'selecting-second-shape') return;
    if (this.firstShape.id == shape.id) {
      this.currentStep = 'listen-canvas-click';
      this.firstShape = null;
      app.workspace.editingShapes = [];
      window.dispatchEvent(new CustomEvent('refresh'));
      window.dispatchEvent(new CustomEvent('refreshUpper'));
      return;
    }
    this.secondShape = shape;

    if (this.firstShape.getCommonsPoints(this.secondShape).length < 2) {
      window.dispatchEvent(
        new CustomEvent('show-notif', { detail: { message: 'Pas de segment commun' } }),
      );
      return;
    }

    if (this.firstShape.overlapsWith(this.secondShape)) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Superposition' } }));
      return;
    }

    this.actions = [
      {
        name: 'MergeAction',
        firstShapeId: this.firstShape.id,
        secondShapeId: this.secondShape.id,
        createdShapeId: uniqId(),
      },
    ];

    this.executeAction();
    this.restart();
    window.dispatchEvent(new CustomEvent('refresh'));
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * Appelée par la fonction de dessin, lorsqu'il faut dessiner l'action en cours
   */
  draw(ctx) {
    if (this.currentStep == 'selecting-second-shape') {
      let shape = this.firstShape,
        borderColor = shape.borderColor;
      shape.borderColor = '#E90CC8';

      window.dispatchEvent(
        new CustomEvent('draw-shape', { detail: { shape: shape, borderSize: 3 } }),
      );
      shape.borderColor = borderColor;
    }
  }
}
