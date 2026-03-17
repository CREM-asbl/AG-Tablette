import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { appActions } from '../../store/appState';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';
import { rotate45HelpConfig } from './rotate45.helpConfig';

/**
 * Tourner une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class Rotate45Tool extends Tool {
  constructor() {
    super('rotate45', 'Tourner de 45°', 'move');

    // La figure que l'on déplace
    this.selectedShape = null;

    /*
      L'ensemble des figures liées à la figure sélectionnée, y compris la figure
      elle-même
    */
    this.involvedShapes = [];
  }

  start() {
    helpConfigRegistry.register(this.name, rotate45HelpConfig);

    appActions.setActiveTool(this.name);

    setTimeout(
      () => {
        appActions.setCurrentStep('listen');
        setState({
          tool: { ...app.tool, name: this.name, currentStep: 'listen' },
        });
      },
      50,
    );
  }

  listen() {
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.mousedown_all_shape;

    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager quand une figure est sélectionnée (canvasMouseDown)
   * @param  {Shape} shape            La figure sélectionnée
   */
  objectSelected(shape) {
    if (!shape) return;

    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    setTimeout(
      () => {
        appActions.setCurrentStep('listen');
        setState({
          tool: { ...app.tool, name: this.name, currentStep: 'listen' },
        });
      },
      50,
    );
  }

  _executeAction() {
    const centerCoord = this.selectedShape.centerCoordinates;
    this.involvedShapes.forEach((s) => {
      s.rotate(Math.PI / 4, centerCoord);
    });
  }
}
