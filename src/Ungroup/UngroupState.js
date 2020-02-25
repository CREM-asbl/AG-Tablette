import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';

/**
 * Supprimer un groupe (ne supprime pas les formes).
 */
export class UngroupState extends State {
  constructor() {
    super('ungroup', 'Dégrouper', 'tool');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = 'Dégrouper';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Une fois cet outil sélectionné, le numéro du groupe apparaît sur chaque forme appartenant à
        un groupe.<br /><br />

        Pour supprimer entièrement un groupe, cliquez sur une des formes appartenant à ce groupe.
      </p>
    `;
  }

  /**
   * initialiser l'état
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
      this.objectSelected(event.detail.object);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
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
   * @param  {Shape}  shape    La forme dessinée
   */
  shapeDrawn(shape) {
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
