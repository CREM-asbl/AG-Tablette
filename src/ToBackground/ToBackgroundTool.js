import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Déplacer une forme derrière toutes les autres.
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
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>. Cet outil permet de
        placer une forme derrière toutes les autres.<br />
        Touchez une forme pour la placer en arrière-plan.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
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
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);
    this.involvedShapes.sort(
      (s1, s2) =>
        ShapeManager.getShapeIndex(s1) - ShapeManager.getShapeIndex(s2),
    );
    this.executeAction();

    window.dispatchEvent(new CustomEvent('refresh'));
  }

  _executeAction() {
    this.involvedShapes.forEach((s, index) => {
      let shapeIndex = app.mainDrawingEnvironment.findIndexById(s.id);
      let shape = app.mainDrawingEnvironment.shapes.splice(shapeIndex, 1)[0];
      app.mainDrawingEnvironment.shapes.splice(index, 0, shape);
    });
  }
}
