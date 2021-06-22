import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Tourner une forme (ou un ensemble de formes liées) sur l'espace de travail
 */
export class Rotate45Tool extends Tool {
  constructor() {
    super('rotate45', 'Tourner à 45°', 'move');

    // La forme que l'on déplace
    this.selectedShape = null;

    /*
      L'ensemble des formes liées à la forme sélectionnée, y compris la forme
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
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Cliquez sur une forme pour la faire tourner de 45° dans le sens
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
   * Appelée par événement du SelectManager quand une forme est sélectionnée (canvasMouseDown)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    this.selectedShape = shape;
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

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
