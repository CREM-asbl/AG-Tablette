import { html } from 'lit';
import { app, setState } from '../Core/App';
import { ShapeManager } from '../Core/Managers/ShapeManager';
import { Text } from '../Core/Objects/Text';
import { Tool } from '../Core/States/Tool';

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
      <h3>${toolName}</h3>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Une fois sélectionné, un texte "biface" apparaît sur les figures étant
        bifaces.<br />
        Touchez une figure pour qu'elle devienne biface, et touchez une seconde
        fois pour annuler.
      </p>
    `;
  }

  start() {
    setTimeout(() => setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } }), 50);
  }

  listen() {
    app.upperCanvasElem.removeAllObjects();
    this.removeListeners();

    // setTimeout(() => {
      app.mainCanvasElem.shapes.map((s) => {
        if (s.isBiface) {
          new Text({
            drawingEnvironment: app.upperCanvasElem,
            coordinates: s.centerCoordinates,
            referenceId: s.id,
            message: 'Biface',
            type: 'biface',
          });
        }
      });
      // window.dispatchEvent(new CustomEvent('refreshUpper'));
    // }, 50);

    app.workspace.selectionConstraints =
      app.fastSelectionConstraints.click_all_shape;
    this.objectSelectedId = app.addListener('objectSelected', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.upperCanvasElem.removeAllObjects();
    this.removeListeners();
  }

  /**
   * Appelée par événement du SelectManager lorsqu'une figures a été sélectionnée (click)
   * @param  {Shape} shape            La figure sélectionnée
   */
  objectSelected(shape) {
    this.involvedShapes = ShapeManager.getAllBindedShapes(shape);

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
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
