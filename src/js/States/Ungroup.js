import { app } from '../App';
import { State } from './State';

/**
 * Supprimer un groupe (ne supprime pas les formes).
 */
export class UngroupState extends State {
  constructor() {
    super('ungroup_shapes');
  }

  /**
   * initialiser l'état
   */
  start() {
    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

  restart() {
    this.end();
    app.interactionAPI.setFastSelectionConstraints('click_all_shape');

    window.addEventListener('objectSelected', this.handler);
  }

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
   * Appelée par interactionAPI quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   * @param  {Event} event            l'événement javascript
   */
  objectSelected(shape, mouseCoordinates, event) {
    let userGroup = app.workspace.getShapeGroup(shape);
    if (userGroup) {
      this.actions = [
        {
          name: 'UngroupAction',
          group: userGroup,
          groupIdx: app.workspace.getGroupIndex(userGroup),
        },
      ];
      this.executeAction();

      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refresh'));
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
