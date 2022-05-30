import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Cacher des figures.
 */
export class HideTool extends Tool {
  constructor() {
    super('hide', 'Cacher', 'tool');
  }

  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  end() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
  }

  objectSelected(shape) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'listen' },
    });
  }

  _executeAction() {
    this.involvedShapes.forEach(s => s.geometryObject.geometryIsHidden = true);
  }
}
