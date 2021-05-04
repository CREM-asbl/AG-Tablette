import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Modifier la couleur des bords d'une forme
 */
export class BorderColorTool extends Tool {
  constructor() {
    super('borderColor', 'Colorier les bords', 'tool');

    this.currentStep = null; // choose-color -> listen-canvas-click
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
        Après avoir choisi une couleur, touchez une forme pour en colorier les
        bords.
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

  selectShape() {
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

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'selectShape' },
    });
  }

  _executeAction() {
    this.involvedShapes.forEach((s) => {
      s.borderColor = app.settings.shapeBorderColor;
    });
  }
}