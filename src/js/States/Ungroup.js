import { app } from '../App';
import { UngroupAction } from './Actions/Ungroup';
import { State } from './State';

/**
 * Supprimer un groupe (ne supprime pas les formes).
 */
export class UngroupState extends State {
  constructor() {
    super('ungroup_shapes');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
      let toolName = "Dégrouper";
      return `
            <h2>${toolName}</h2>
            <p>
            	Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
                Une fois cet outil sélectionné, le numéro du groupe apparaît sur
                chaque forme appartenant à un groupe.<br /><br />

                Pour supprimer entièrement un groupe, cliquez sur une des formes
                appartenant à ce groupe.
            </p>
      `;
  }

  /**
   * (ré-)initialiser l'état
   */
  start() {
    this.actions = [new UngroupAction(this.name)];

    app.interactionAPI.setFastSelectionConstraints('click_all_shape');
    app.appDiv.cursor = 'default';
  }

  /**
   * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {{x: float, y: float}} clickCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, clickCoordinates, event) {
    let userGroup = app.workspace.getShapeGroup(shape);
    if (userGroup) {
      this.actions[0].groupId = userGroup.id;
      this.executeAction();
      this.actions = [new UngroupAction(this.name)];

      app.drawAPI.askRefresh('upper');
      app.drawAPI.askRefresh();
    }
  }

  /**
   * Appelée par la fonction de dessin après avoir dessiné une forme sur le
   * canvas principal
   * @param  {Context2D} ctx   le canvas
   * @param  {Shape} shape La forme dessinée
   */
  shapeDrawn(ctx, shape) {
    let group = app.workspace.getShapeGroup(shape),
      center = shape.center,
      pos = { x: center.x - 25, y: center.y };
    if (group) {
      let groupIndex = app.workspace.getGroupIndex(group);
      app.drawAPI.drawText(ctx, 'Groupe ' + (groupIndex + 1), pos);
    }
  }
}
