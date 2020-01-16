import { app } from '../App';
import { State } from './State';

/**
 * Construire le centre d'une forme (l'afficher)
 */
export class BuildCenterState extends State {
  constructor() {
    super('build_shape_center');
  }

  /**
   * initialiser l'état
   */
  start() {
    app.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
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
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    this.actions = [
      {
        name: 'BuildCenterAction',
        shapeId: shape.id,
      },
    ];
    this.executeAction();
    this.restart();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
