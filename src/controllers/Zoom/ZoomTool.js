import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Tool } from '../Core/States/Tool';

export const applyZoom = newZoom => {
  const originalTranslateOffset = app.workspace.translateOffset,
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

/**
 * Zoomer/Dézoomer le plan
 */
export class ZoomTool extends Tool {
  constructor() {
    super('zoom', 'Zoomer', 'tool');
    this.currentStep = null; // listen-canvas-click -> zooming-plane
  }

  /**
   * initialiser l'état
   */
  start() { }

  zoom() {
    applyZoom(app.tool.zoomLevel);
  }

  execute() {
    this.executeAction();
  }

  /**
   * stopper l'état
   */
  end() { }

  _executeAction() {
    applyZoom(app.tool.zoomLevel);
  }
}
