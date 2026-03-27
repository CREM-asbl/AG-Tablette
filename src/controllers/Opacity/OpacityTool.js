
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';
import { createElem } from '../Core/Tools/general';
import './opacity-popup';
import { opacityHelpConfig } from './opacity.helpConfig';

/**
 * Modifier l'opacité d'une figure
 */
export class OpacityTool extends Tool {
  constructor() {
    super('opacity', 'Opacité', 'tool');

    this.currentStep = null; // choose-opacity -> listen-canvas-click

    this.opacity = 0.7;
  }



  /**
   * initialiser l'état
   */
  start() {
    helpConfigRegistry.register(this.name, opacityHelpConfig);

    appActions.setActiveTool(this.name);

    this.removeListeners();

    createElem('opacity-popup');
  }

  selectObject() {
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figure a été sélectionnée (click)
   * @param  {Shape} shape            La figure sélectionnée
   */
  objectSelected(shape) {
    if (app.tool.currentStep !== 'selectObject') return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    appActions.setCurrentStep('selectObject');
  }

  _executeAction() {
    this.involvedShapes.forEach((s) => {
      s.fillOpacity = app.settings.shapeOpacity;
    });
  }
}
