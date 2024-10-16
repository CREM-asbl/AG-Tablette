import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Tool } from '../Core/States/Tool';
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
    console.log(newZoom)
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
