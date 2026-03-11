
import { helpConfigRegistry } from '../../services/HelpConfigRegistry';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';
import { findIndexById } from '../Core/Tools/general';
import { toBackgroundHelpConfig } from './toBackground.helpConfig';

/**
 * Déplacer une figure derrière toutes les autres.
 */
export class ToBackgroundTool extends Tool {
  constructor() {
    super('toBackground', 'Arrière-plan', 'tool');
  }

  

  start() {
    helpConfigRegistry.register(this.name, toBackgroundHelpConfig);

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
    this.involvedShapes.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
    this.executeAction();

    // window.dispatchEvent(new CustomEvent('refresh'));
  }

  _executeAction() {
    this.involvedShapes.forEach((s, index) => {
      const shapeIndex = findIndexById(s.id);
      const shape = app.mainCanvasLayer.shapes.splice(shapeIndex, 1)[0];
      app.mainCanvasLayer.shapes.splice(index, 0, shape);
    });
  }
}
