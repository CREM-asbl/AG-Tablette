import { app } from '../App';
import { State } from './State';
import { GroupManager } from '../GroupManager';
import { ShapeManager } from '../ShapeManager';

/**
 * Modifier la couleur des bords d'une forme
 */
export class BorderColorState extends State {
  constructor() {
    super('border_color', 'Colorier les bords', 'tool');

    this.currentStep = null; // choose-color -> listen-canvas-click
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    app.appDiv.shadowRoot.querySelector('#color-picker-label').click();

    window.addEventListener('objectSelected', this.handler);
    window.addEventListener('colorChange', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

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
    app.workspace.selectedColor = color;
    this.currentStep = 'listen-canvas-click';
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    if (this.currentStep != 'listen-canvas-click') return;

    let group = GroupManager.getShapeGroup(shape),
      involvedShapes;
    if (group) involvedShapes = group.shapesIds.map(id => ShapeManager.getShapeById(id));
    else involvedShapes = [shape];

    this.actions = [
      {
        name: 'BorderColorAction',
        involvedShapesIds: involvedShapes.map(s => s.id),
        selectedColor: app.workspace.selectedColor,
        oldColors: involvedShapes.map(s => s.borderColor),
      },
    ];

    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
