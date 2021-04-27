import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { createElem } from '../Core/Tools/general';
import { GroupManager } from '../Core/Managers/GroupManager';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import './opacity-popup';

/**
 * Modifier l'opacité d'une forme
 */
export class OpacityTool extends Tool {
  constructor() {
    super('opacity', 'Opacité', 'tool');

    this.currentStep = null; // choose-opacity -> listen-canvas-click

    this.opacity = 0.7;
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
        définir pour chaque forme si elle est transparente, semi-transparente ou
        complètement opaque.<br />
        Après avoir choisit l'une de ces 3 options dans le menu, touchez une
        forme pour lui appliquer la modification.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.removeListeners();

    createElem('opacity-popup');
  }

  selectObject() {
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
    if (app.tool.currentStep != 'selectObject') return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'selectObject' } });
  }

   _executeAction() {
    this.involvedShapes.forEach((s) => {
      s.opacity = app.workspaceSettings.shapeOpacity;
    });
  }
}
