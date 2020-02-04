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
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Arrière-plan';
    return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil
                permet de placer une forme derrière toutes les autres.<br />
            	Touchez une forme pour la placer en arrière-plan.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    setTimeout(
      () => (app.workspace.selectionConstraints = app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('objectSelected', this.objectSelectedId);
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
