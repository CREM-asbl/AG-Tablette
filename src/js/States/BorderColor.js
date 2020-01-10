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

    this.selectedColor = null;
  }

  /**
   * (ré-)initialiser l'état
   */
  start(callColorPicker = true) {
    this.end();

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    if (callColorPicker) {
      app.appDiv.shadowRoot.querySelector('#color-picker-label').click();
      this.currentStep = 'choose-color';
    } else {
      this.currentStep = 'listen-canvas-click';
    }
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
    this.selectedColor = color;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    let group = app.workspace.getShapeGroup(shape),
      involvedShapes;
    if (group) involvedShapes = group.shapesIds.map(id => app.workspace.getShapeById(id));
    else involvedShapes = [shape];

    this.actions = [
      {
        name: 'BorderColorAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        selectedColor: this.selectedColor,
        oldColors: involvedShapes.map(s => s.borderColor),
      },
    ];

    this.executeAction();
    this.start(false);

    app.drawAPI.askRefresh();
  }
}
