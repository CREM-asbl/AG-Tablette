import { app } from '../App';
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
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    app.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    app.appDiv.shadowRoot.querySelector('#color-picker-label').click();

    window.addEventListener('objectSelected', this.handler);
    window.addEventListener('colorChange', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    window.addEventListener('objectSelected', this.handler);
    window.addEventListener('colorChange', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
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
    app.selectedColor = color;
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
        selectedColor: app.selectedColor,
        oldColors: involvedShapes.map(s => s.borderColor),
      },
    ];

    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
