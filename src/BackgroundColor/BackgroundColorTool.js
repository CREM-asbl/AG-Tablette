import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Modifier la couleur de fond d'une figure
 */
export class BackgroundColorTool extends Tool {
  constructor() {
    super('backgroundColor', 'Colorier les figures', 'tool');

    this.currentStep = null; // choose-color -> listen-canvas-click
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
        Après avoir choisi une couleur, touchez une figure pour en colorier
        l'intérieur.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
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
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    this.executeAction();
    setState({
      tool: { ...app.tool, name: this.name, currentStep: 'listen' },
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
    });
  }
}
