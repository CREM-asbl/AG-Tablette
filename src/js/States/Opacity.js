import { app } from '../App';
import { OpacityAction } from './Actions/Opacity';
import { State } from './State';

/**
 * Modifier l'opacité d'une forme
 */
export class OpacityState extends State {
  constructor() {
    super('opacity');

    this.currentStep = null; // choose-opacity -> listen-canvas-click

    this.handler = event => this._actionHandle(event);
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.end();
    this.actions = [new OpacityAction(this.name)];

    this.currentStep = 'choose-opacity';

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    app.appDiv.shadowRoot.querySelector('opacity-popup').style.display = 'block';
    app.appDiv.cursor = 'default';
    window.addEventListener('objectSelected', this.handler);
    window.addEventListener('setOpacity', this.handler);
  }

  end() {
    app.editingShapes = [];
    window.removeEventListener('objectSelected', this.handler);
    window.removeEventListener('setNumberOfParts', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else if (event.type == 'setOpacity') {
      console.log(event);
      this.setOpacity(event.detail.opacity);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setOpacity(opacity) {
    this.actions[0].opacity = opacity;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.actions[0].shapeId = shape.id;
    let group = app.workspace.getShapeGroup(shape),
      involvedShapes = [shape];
    if (group) involvedShapes = [...group.shapes];
    this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

    this.executeAction();
    let opacity = this.actions[0].opacity;
    this.setOpacity(opacity);

    app.drawAPI.askRefresh();
  }
}
