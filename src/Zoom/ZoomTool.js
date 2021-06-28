import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit';
import { Coordinates } from '../Core/Objects/Coordinates';
import { createElem } from '../Core/Tools/general';

/**
 * Zoomer/Dézoomer le plan
 */
export class ZoomTool extends Tool {
  constructor() {
    super('zoom', 'Zoomer', 'tool');

    this.currentStep = null; // listen-canvas-click -> zooming-plane

    this.baseDist = null;
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
        Touchez l'écran n'importe où dans la zone de dessin, et faites glissez
        votre doigt sans le relacher, pour zoomer ou dézoomer le plan entier.<br />
        Le zoom se fait par rapport au centre de l'écran: écartez votre doigt du
        centre pour zoomer, et rapprochez-le du centre pour dézoomer.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.openZoomMenu();
  }

  zoom() {
    this.applyZoom(app.tool.zoomLevel);
  }

  execute() {
    this.executeAction();
  }

  /**
   * stopper l'état
   */
  end() {
    this.zoomMenu = null;
  }

  openZoomMenu() {
    if (!this.zoomMenu) {
      import('./zoom-menu');
      this.zoomMenu = createElem('zoom-menu');
    }
  }

  applyZoom(newZoom) {
    let originalTranslateOffset = app.workspace.translateOffset,
      originalZoom = app.workspace.zoomLevel,
      scaleOffset = newZoom / originalZoom,
      actualWinSize = new Coordinates({
        x: app.canvasWidth,
        y: app.canvasHeight,
      }).multiply(1 / originalZoom),
      newWinSize = actualWinSize.multiply(1 / scaleOffset),
      newTranslateoffset = originalTranslateOffset
        .multiply(1 / originalZoom)
        .add(newWinSize.substract(actualWinSize).multiply(1 / 2))
        .multiply(newZoom);

    app.workspace.setZoomLevel(newZoom, false);
    app.workspace.setTranslateOffset(newTranslateoffset);
  }

  _executeAction() {
    let newZoom = app.tool.zoomLevel;
    this.applyZoom(newZoom);
  }
}
