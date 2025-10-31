import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Tool } from '../Core/States/Tool';

/**
 * Construire le centre d'une figure (l'afficher)
 */
export class BuildCenterTool extends Tool {
  constructor() {
    super('buildCenter', 'Construire le centre', 'operation');
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
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez une figure pour construire son centre. Si le centre était déjà
        construit, cela va supprimer le centre.
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
    if (!shape) return;

    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);
    if (this.involvedShapes.some(s => s.name.endsWith('StraightLine'))) {
      window.dispatchEvent(new CustomEvent('show-notif', { detail: { message: 'Il n\'y a pas de centre sur les droites et demi-droites' }}));
      return;
    }
    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  _executeAction() {
    const mustShowCenter = this.involvedShapes.some((s) => {
      return !s.isCenterShown;
    });

    this.involvedShapes.map((s) => (s.isCenterShown = mustShowCenter));
  }
}
