import { app } from '../App';
import { BifaceAction } from './Actions/Biface.js';
import { State } from './State';

/**
 * Rendre une shape biface
 */
export class BifaceState extends State {
  constructor() {
    super('biface');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Biface";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
            	Une fois sélectionné, un texte "biface" apparaît sur les formes
                étant bifaces.<br />
                Touchez une forme pour qu'elle devienne biface, et touchez
                une seconde fois pour annuler.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new BifaceAction(this.name)];

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
    let involvedShapes = app.workspace.getAllBindedShapes(shape, true);

    this.actions[0].shapeId = shape.id;
    this.actions[0].involvedShapesIds = involvedShapes.map(s => s.id);

    this.executeAction();

    this.start();

    app.drawAPI.askRefresh();
  }

  /**
   * Appelée par la fonction de dessin après avoir dessiné une forme sur le
   * canvas principal
   * @param  {Context2D} ctx   le canvas
   * @param  {Shape} shape La forme dessinée
   */
  shapeDrawn(ctx, shape) {
    const biface = shape.isBiface,
      center = shape.center,
      pos = { x: center.x - 17, y: center.y };
    if (biface) {
      app.drawAPI.drawText(ctx, 'Biface', pos);
    }
  }
}
