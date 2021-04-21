import { app, setState } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';

/**
 * Construire le centre d'une forme (l'afficher)
 */
export class BuildCenterState extends State {
  constructor() {
    super('buildCenter', 'Construire le centre', 'operation');


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
        Touchez une forme pour construire son centre. Si le centre était déjà
        construit, cela va supprimer le centre.
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
    this.executeAction();
    setState({ tool: { ...app.tool, currentStep: 'start' } });
    window.dispatchEvent(new CustomEvent('refresh'));
  }

  executeAction() {
    let mustShowCenter = this.involvedShapes.some((s) => {
      return !s.isCenterShown;
    });

    this.involvedShapes.map((s) => (s.isCenterShown = mustShowCenter));
  }
}
