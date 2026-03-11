
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';
import { buildCenterHelpConfig } from './buildCenter.helpConfig';

/**
 * Construire le centre d'une figure (l'afficher)
 */
export class BuildCenterTool extends Tool {
  constructor() {
    super('buildCenter', 'Construire le centre', 'operation');
  }

  

  /**
   * initialiser l'état
   */
  start() {
    helpConfigRegistry.register(this.name, buildCenterHelpConfig);

    setTimeout(
      () =>
        setState({
          tool: { ...app.tool, name: this.name, currentStep: 'listen' },
        }),
      50,
    );
  }

  listen() {
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
    if (!shape) return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    if (this.involvedShapes.some((s) => s.name.endsWith('StraightLine'))) {
      window.dispatchEvent(
        new CustomEvent('show-notif', {
          detail: {
            message: "Il n'y a pas de centre sur les droites et demi-droites",
          },
        }),
      );
      return;
    }
    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  _executeAction() {
    const mustShowCenter = this.involvedShapes.some((s) => {
      return !s.isCenterShown;
    });

    this.involvedShapes.map((s) => (s.isCenterShown = mustShowCenter));
  }
}
