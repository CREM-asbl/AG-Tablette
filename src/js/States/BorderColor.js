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
    let group = app.workspace.getShapeGroup(shape);
    if (group) this.actions[0].involvedShapesIds = group.shapesIds;

    this.executeAction();
    let color = this.actions[0].selectedColor;
    this.start(false);
    this.setColor(color);

    app.drawAPI.askRefresh();
  }
}
