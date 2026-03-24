
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Tool } from '../Core/States/Tool';
import { translateHelpConfig } from './translate.helpConfig';

/**
 * Faire translater le plan
 */
export class TranslateTool extends Tool {
  constructor() {
    super('translate', 'Déplacer le plan', 'tool');

    this.currentStep = null; // listen-canvas-click -> translating-plane

    this.startClickCoordinates = null;
  }



  /**
   * initialiser l'état
   */
  start() {
    helpConfigRegistry.register(this.name, translateHelpConfig);

    appActions.setActiveTool(this.name);

    setTimeout(
      () => {
        appActions.setCurrentStep('listen');
      },
      50,
    );
  }

  listen() {
    this.removeListeners();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  translate() {
    this.removeListeners();

    this.mouseMoveId = app.addListener('canvasMouseMove', this.handler);
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
  }

  canvasMouseDown() {
    if (app.tool.currentStep !== 'listen') return;

    this.startClickCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.startOffset = new Coordinates(app.workspace.translateOffset);

    appActions.setCurrentStep('translate');
  }

  canvasMouseMove() {
    if (app.tool.currentStep !== 'translate') return;

    const newOffset = app.workspace.translateOffset.add(
      app.workspace.lastKnownMouseCoordinates
        .substract(this.startClickCoordinates)
        .multiply(app.workspace.zoomLevel),
    );

    app.workspace.setTranslateOffset(newOffset);
    app.workspace.setTranslateOffset(this.startOffset, false);
  }

  canvasMouseUp() {
    if (app.tool.currentStep !== 'translate') return;

    this.executeAction();
    appActions.setCurrentStep('listen');
  }

  _executeAction() {
    const newOffset = app.workspace.translateOffset.add(
      app.workspace.lastKnownMouseCoordinates
        .substract(this.startClickCoordinates)
        .multiply(app.workspace.zoomLevel),
    );

    app.workspace.setTranslateOffset(newOffset);
  }
}
