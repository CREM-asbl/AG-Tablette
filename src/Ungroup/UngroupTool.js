import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Text } from '../Core/Objects/Text';

/**
 * Supprimer un groupe (ne supprime pas les figures).
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
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Une fois cet outil sélectionné, le numéro du groupe apparaît sur chaque
        figure appartenant à un groupe.<br /><br />

        Pour supprimer entièrement un groupe, cliquez sur une des figures
        appartenant à ce groupe.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();

    app.mainDrawingEnvironment.shapes.map((s) => {
      let currentGroup = GroupManager.getShapeGroup(s);
      if (currentGroup != null) {
        new s.constructor({
          ...s,
          drawingEnvironment: app.upperDrawingEnvironment,
          path: s.getSVGPath('no scale', false, false),
          fillOpacity: 0,
          strokeColor: currentGroup.color,
          strokeWidth: 3,
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: dp.id };
          }),
        });
      }
    });

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
   * Appelée par événement du SelectManager quand une figure est sélectionnée (onClick)
   * @param  {Shape} shape            La figure sélectionnée
   */
  objectSelected(shape) {
    this.userGroup = GroupManager.getShapeGroup(shape);
    if (this.userGroup) {
      this.executeAction();
      setState({
        tool: { ...app.tool, name: this.name, currentStep: 'listen' },
      });
    } else {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: {
            message: "La figure sélectionnée ne fait pas partie d'un groupe",
          },
        }),
      );
    }
  }

  _executeAction() {
    GroupManager.deleteGroup(this.userGroup);
  }
}
