import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Tool } from '../Core/States/Tool';
import { resetPositionHelpConfig } from './resetPosition.helpConfig';

/**
 *
 */
export class ResetPositionTool extends Tool {
  constructor() {
    super('resetPosition', 'Remettre à la position initiale', 'tool');
  }

  start() {
    helpConfigRegistry.register(this.name, resetPositionHelpConfig);

    appActions.setActiveTool(this.name);
    appActions.setCurrentStep('listen');
  }

  listen() {
    this.removeListeners();
    window.dispatchEvent(new CustomEvent('reset-selection-constraints'));
    app.workspace.selectionConstraints.eventType = 'click';
    app.workspace.selectionConstraints.shapes.canSelect = true;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  end() {
    this.removeListeners();
  }

  objectSelected(object) {
    if (!object) return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(object);

    this.executeAction();
    appActions.setCurrentStep('listen');
  }

  _executeAction() {
    this.involvedShapes.forEach((s) => {
      s.points.forEach(
        (pt) => (pt.coordinates = new Coordinates(pt.startTangramCoordinates)),
      );
    });
  }
}
