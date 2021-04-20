import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Text } from '../Core/Objects/Text';

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
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Une fois cet outil sélectionné, le numéro du groupe apparaît sur chaque
        forme appartenant à un groupe.<br /><br />

        Pour supprimer entièrement un groupe, cliquez sur une des formes
        appartenant à ce groupe.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    app.mainDrawingEnvironment.shapes.map((s) => {
      if (GroupManager.getShapeGroup(s) != null) {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: s.centerCoordinates,
          referenceId: s.id,
          type: 'group',
        });
      }
    });
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    app.mainDrawingEnvironment.shapes.map((s) => {
      if (GroupManager.getShapeGroup(s) != null) {
        new Text({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: s.centerCoordinates,
          referenceId: s.id,
          type: 'group',
        });
      }
    });
    setTimeout(
      () =>
        (app.workspace.selectionConstraints =
          app.fastSelectionConstraints.click_all_shape),
    );

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    app.removeListener('objectSelected', this.objectSelectedId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'objectSelected') {
      this.objectSelected(event.detail.object);
    } else {
      console.error('unsupported event type : ', event.type);
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
      this.restart();

      window.dispatchEvent(new CustomEvent('refreshUpper'));
      window.dispatchEvent(new CustomEvent('refresh'));
    }
  }
}
