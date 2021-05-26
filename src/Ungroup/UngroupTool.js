import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Text } from '../Core/Objects/Text';

/**
 * Supprimer un groupe (ne supprime pas les formes).
 */
export class UngroupTool extends Tool {
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
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();

    setTimeout(() => {
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
      window.dispatchEvent(new CustomEvent('refreshUpper'));
    }, 50);

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager quand une forme est sélectionnée (onClick)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    this.userGroup = GroupManager.getShapeGroup(shape);
    if (this.userGroup) {
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'start' },
      });
    } else {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: {
            message: "La forme sélectionnée ne fait pas partie d'un groupe",
          },
        }),
      );
    }
  }

  _executeAction() {
    GroupManager.deleteGroup(this.userGroup);
  }
}
