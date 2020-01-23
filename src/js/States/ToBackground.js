import { app } from '../App';
import { ToBackgroundAction } from './Actions/ToBackground';
import { State } from './State';

/**
 * Déplacer une forme derrière toutes les autres.
 */
export class ToBackgroundState extends State {
  constructor() {
    super('to_background');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Arrière-plan";
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
    this.actions = [new ToBackgroundAction(this.name)];

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
  }

  /**
   * Appelée par l'interactionAPI lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    this.actions[0].oldIndex = app.workspace.getShapeIndex(shape);
    this.executeAction();
    this.start();

    app.drawAPI.askRefresh();
  }
}
