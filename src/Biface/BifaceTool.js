import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Text } from '../Core/Objects/Text';

/**
 * Rendre une shape biface
 */
export class BifaceTool extends Tool {
  constructor() {
    super('biface', 'Biface', 'tool');
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
        Une fois sélectionné, un texte "biface" apparaît sur les formes étant
        bifaces.<br />
        Touchez une forme pour qu'elle devienne biface, et touchez une seconde
        fois pour annuler.
      </p>
    `;
  }

  start() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();

    setTimeout(() => {
      app.mainDrawingEnvironment.shapes.map((s) => {
        if (s.isBiface) {
          new Text({
            drawingEnvironment: app.upperDrawingEnvironment,
            coordinates: s.centerCoordinates,
            referenceId: s.id,
            message: 'Biface',
            type: 'biface',
          });
        }
      });
      window.dispatchEvent(new CustomEvent('refreshUpper'));
    }, 50);

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperDrawingEnvironment.removeAllObjects();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une forme a été sélectionnée (click)
   * @param  {Shape} shape            La forme sélectionnée
   */
  objectSelected(shape) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape, true);

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'start' } });
  }

  _executeAction() {
    // if ! all biface => set to biface
    // else set to not biface
    let valueToSet = !this.involvedShapes.every((s) => {
      return s.isBiface;
    });
    this.involvedShapes.forEach((s) => {
      s.isBiface = valueToSet;
    });
  }
}