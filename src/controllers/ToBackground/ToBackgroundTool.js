import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';
import { findIndexById } from '../Core/Tools/general';

/**
 * Déplacer une figure derrière toutes les autres.
 */
export class ToBackgroundTool extends Tool {
  constructor() {
    super('toBackground', 'Arrière-plan', 'tool');
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    const toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        placer une figure derrière toutes les autres.<br />
        Touchez une figure pour la placer en arrière-plan.
      </p>
    `;
  }

  start() {
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
