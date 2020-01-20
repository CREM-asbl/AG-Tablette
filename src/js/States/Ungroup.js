import { app } from '../App';
import { State } from './State';
import { GroupManager } from '../GroupManager';

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
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   * @param  {Point} mouseCoordinates Les coordonnées du click
   */
  objectSelected(shape, mouseCoordinates) {
    let userGroup = GroupManager.getShapeGroup(shape);
    if (userGroup) {
      this.actions = [
        {
          name: 'UngroupAction',
          group: userGroup,
          groupIdx: GroupManager.getGroupIndex(userGroup),
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
    let group = GroupManager.getShapeGroup(shape),
      center = shape.center,
      pos = { x: center.x - 25, y: center.y };
    if (group) {
      let groupIndex = GroupManager.getGroupIndex(group);
      window.dispatchEvent(
        new CustomEvent('draw-text', {
          detail: { ctx: app.mainCtx, text: 'Groupe ' + (groupIndex + 1), position: pos },
        }),
      );
    }
  }
}
