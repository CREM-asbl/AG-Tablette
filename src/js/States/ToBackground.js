import { app } from '../App';
import { State } from './State';
import { ShapeManager } from '../ShapeManager';

/**
 * Déplacer une forme derrière toutes les autres.
 */
export class ToBackgroundState extends State {
  constructor() {
    super('backplane', 'Arrière-plan', 'tool');
  }

  /**
   * initialiser l'état
   */
  start() {
    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

    window.addEventListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape;

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
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    this.actions = [
      {
        name: 'ToBackgroundAction',
        oldIndex: ShapeManager.getShapeIndex(shape),
      },
    ];
    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }
}
