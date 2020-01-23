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
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Construire le centre";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
            	Touchez une forme pour construire son centre. Si le centre
                était déjà construit, cela va supprimer le centre.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new BuildCenterAction(this.name)];

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
    this.actions[0].shapeId = shape.id;
    this.executeAction();

    this.start();

    app.drawAPI.askRefresh();
  }
}
