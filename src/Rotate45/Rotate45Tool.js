import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';

/**
 * Tourner une figure (ou un ensemble de figures liées) sur l'espace de travail
 */
export class Rotate45Tool extends Tool {
  constructor() {
    super('rotate45', 'Tourner à 45°', 'move');

    // La figure que l'on déplace
    this.selectedShape = null;

    /*
      L'ensemble des figures liées à la figure sélectionnée, y compris la figure
      elle-même
    */
    this.involvedShapes = [];
  }

  /**
   * Renvoie l'aide à afficher à l'utilisateur
   * @return {String} L'aide, en HTML
   */
  getHelpText() {
    let toolName = this.title;
    return html`
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Cliquez sur une figure pour la faire tourner de 45° dans le sens
        horloger.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
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
    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  _executeAction() {
    let centerCoord = this.selectedShape.centerCoordinates;
    this.involvedShapes.forEach((s) => {
      s.rotate(Math.PI / 4, centerCoord);
    });
  }
}
