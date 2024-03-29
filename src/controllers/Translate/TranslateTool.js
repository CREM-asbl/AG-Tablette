import { html } from 'lit';
import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Tool } from '../Core/States/Tool';

/**
 * Faire translater le plan
 */
export class TranslateTool extends Tool {
  constructor() {
    super('translate', 'Déplacer le plan', 'tool');

    this.currentStep = null; // listen-canvas-click -> translating-plane

    this.startClickCoordinates = null;
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
        Touchez l'écran n'importe où dans la zone de dessin, et faites glissez
        votre doigt sans le relacher, pour faire glisser le plan entier.
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

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  translate() {
    this.removeListeners();

    this.mouseMoveId = app.addListener('canvasMouseMove', this.handler);
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
  }

  canvasMouseDown() {
    if (app.tool.currentStep != 'listen') return;

    this.startClickCoordinates = new Coordinates(
      app.workspace.lastKnownMouseCoordinates,
    );
    this.startOffset = new Coordinates(app.workspace.translateOffset);

    setState({ tool: { ...app.tool, currentStep: 'translate' } });
  }

  canvasMouseMove() {
    if (app.tool.currentStep != 'translate') return;

    let newOffset = app.workspace.translateOffset.add(
      app.workspace.lastKnownMouseCoordinates
        .substract(this.startClickCoordinates)
        .multiply(app.workspace.zoomLevel),
    );

    app.workspace.setTranslateOffset(newOffset);
    app.workspace.setTranslateOffset(this.startOffset, false);
  }

  canvasMouseUp() {
    if (app.tool.currentStep != 'translate') return;

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'listen' } });
  }

  _executeAction() {
    let newOffset = app.workspace.translateOffset.add(
      app.workspace.lastKnownMouseCoordinates
        .substract(this.startClickCoordinates)
        .multiply(app.workspace.zoomLevel),
    );

    app.workspace.setTranslateOffset(newOffset);
  }
}
