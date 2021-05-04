import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { getComplementaryColor } from '../Core/Tools/general';

/**
 * Modifier la couleur de fond d'une forme
 */
export class BackgroundColorTool extends Tool {
  constructor() {
    super('backgroundColor', 'Colorier les formes', 'tool');

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
        Après avoir choisi une couleur, touchez une forme pour en colorier
        l'intérieur.
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
    let mustChangeOpacity = false;

    // setOpacity quand transparent
    if (
      this.involvedShapes.some((s) => {
        return s.opacity != 1;
      })
    ) {
      mustChangeOpacity = true;
    }

    this.involvedShapes.forEach((s) => {
      if (mustChangeOpacity) s.opacity = 0.7;
      s.color = app.settings.shapeFillColor;
      s.second_color = getComplementaryColor(s.color);
    });
  }
}