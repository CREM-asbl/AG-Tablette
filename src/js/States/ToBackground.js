import { app } from '../App';
import { State } from './State';

/**
 * Déplacer une forme derrière toutes les autres.
 */
export class ToBackgroundState extends State {
  constructor() {
    super('to_background');
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
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
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    this.actions = [
      {
        name: 'ToBackgroundAction',
        oldIndex: app.workspace.getShapeIndex(shape),
      },
    ];
    this.executeAction();
    this.start();

    app.drawAPI.askRefresh();
  }
}
