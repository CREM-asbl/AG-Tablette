
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app } from '../Core/App';
import { GroupManager } from '../Core/Managers/GroupManager';
import { Tool } from '../Core/States/Tool';
import { ungroupHelpConfig } from './ungroup.helpConfig';

/**
 * Supprimer un groupe (ne supprime pas les figures).
 */
export class UngroupTool extends Tool {
  constructor() {
    super('ungroup', 'Dégrouper', 'tool');
  }

  updateToolStep(step, extraState = {}) {
    appActions.setToolState(extraState);
    appActions.setCurrentStep(step);
  }



  start() {
    helpConfigRegistry.register(this.name, ungroupHelpConfig);

    appActions.setActiveTool(this.name);

    setTimeout(
      () => {
        this.updateToolStep('listen');
        this.listen();
      },
      50,
    );
  }

  listen() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();

    app.mainCanvasLayer.shapes.map((s) => {
      const currentGroup = GroupManager.getShapeGroup(s);
      if (currentGroup != null) {
        new s.constructor({
          ...s,
          layer: 'upper',
          path: s.getSVGPath('no scale', false, false),
          fillOpacity: 0,
          strokeColor: currentGroup.color,
          strokeWidth: 3,
          divisionPointInfos: s.divisionPoints.map((dp) => {
            return {
              coordinates: dp.coordinates,
              ratio: dp.ratio,
              segmentIdx: dp.segments[0].idx,
              id: dp.id,
              color: dp.color,
            };
          }),
          segmentsColor: s.segments.map((seg) => {
            return seg.color;
          }),
          pointsColor: s.points.map((pt) => {
            return pt.color;
          }),
        });
      }
    });

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);

    window.dispatchEvent(new CustomEvent('refreshUpper'));
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperCanvasLayer.removeAllObjects();
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
      this.updateToolStep('listen');
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
