import { app } from '../App';
import { BorderColorAction } from './Actions/BorderColor';
import { State } from './State';

/**
 * Modifier la couleur des bords d'une forme
 */
export class BorderColorState extends State {
  constructor() {
    super('border_color');

    this.currentStep = null; // choose-color -> listen-canvas-click
  }

  /**
   * (ré-)initialiser l'état
   */
  start(callColorPicker = true) {
    this.actions = [new BorderColorAction(this.name)];

    this.currentStep = 'choose-color';

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    if (callColorPicker) app.appDiv.shadowRoot.querySelector('#color-picker-label').click();
    app.appDiv.cursor = 'default';
    window.addEventListener('objectSelected', this.handler);
    window.addEventListener('colorChange', this.handler);
  }

  end() {
    app.editingShapes = [];
    window.removeEventListener('objectSelected', this.handler);
    window.removeEventListener('colorChange', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object, event.detail.mousePos);
    } else if (event.type == 'colorChange') {
      this.setColor(event.detail.color);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  setColor(color) {
    this.actions[0].selectedColor = color;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.actions[0].shapeId = shape.id;
    let group = app.workspace.getShapeGroup(shape),
      involvedShapes = [shape];
    if (group) involvedShapes = [...group.shapes];
    this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

    this.executeAction();
    let color = this.actions[0].selectedColor;
    this.start(false);
    this.setColor(color);

    app.drawAPI.askRefresh();
  }
}
