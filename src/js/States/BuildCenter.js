import { app } from '../App';
import { BuildCenterAction } from './Actions/BuildCenter';
import { State } from './State';

/**
 * Construire le centre d'une forme (l'afficher)
 */
export class BuildCenterState extends State {
  constructor() {
    super('build_shape_center');
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.end();

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

  restart() {
    this.end();
    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    window.addEventListener('objectSelected', this.handler);
    this.status = 'running';
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
        name: 'BuildCenterAction',
        shapeId: shape.id,
      },
    ];
    this.executeAction();

    this.restart();
    app.drawAPI.askRefresh();
  }
}
