import { app, setState } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Tool } from '../Core/States/Tool';
import { applyZoom } from './ZoomTool';

/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomTool extends Tool {
  constructor() {
    super('zoom', 'Zoomer');

    this.currentStep = null; // listen-canvas-click -> zooming-plane

    this.baseDist = null;

    this.init();
  }

  /**
   * initialiser l'état
   */
  init() {
    console.log('init')
    this.removeListeners();
    this.touchStartId = app.addListener('canvasTouchStart', this.handler);
    this.mouseWheelId = app.addListener('canvasMouseWheel', this.handler);
  }

  start() {
    console.log('start')
    this.removeListeners();
    if (app.tool.mode == 'touch') {
      this.touchMoveId = app.addListener('canvasTouchMove', this.handler);
      this.touchEndId = app.addListener('canvasTouchEnd', this.handler);
    }
  }

  /**
   * stopper l'état
   */
  end() {
    console.log('end')
    this.removeListeners();
  }

  canvasTouchStart(touches) {
    if (touches.length == 2) {
      const point1 = touches[0], point2 = touches[1];
      const centerProp = new Coordinates({
        x: (point1.x + point2.x) / 2 / app.canvasWidth,
        y: (point1.y + point2.y) / 2 / app.canvasHeight
      });
      this.baseDist = point1.dist(point2);
      if (this.baseDist == 0) this.baseDist = 0.001;

      this.originalTranslateOffset = app.workspace.translateOffset;
      this.originalZoom = app.workspace.zoomLevel;


      app.upperCanvasLayer.removeAllObjects();
      setState({
        tool: { name: this.name, currentStep: 'start', mode: 'touch', title: this.title },
      });
    }
  }

  canvasTouchMove(touches) {
    if (touches.length !== 2) return;

    if (app.tool.currentStep == 'start') {
      const point1 = touches[0], point2 = touches[1]
      let newDist = point1.dist(point2);
      if (newDist == 0) newDist = 0.001;

      let scaleOffset = newDist / this.baseDist,
        minZoom = app.settings.minZoomLevel,
        maxZoom = app.settings.maxZoomLevel;
      if (scaleOffset * this.originalZoom > maxZoom) {
        scaleOffset = maxZoom / this.originalZoom - 0.001;
      }
      if (scaleOffset * this.originalZoom < minZoom) {
        scaleOffset = minZoom / this.originalZoom + 0.001;
      }
      applyZoom(this.originalZoom * scaleOffset)
    }
  }

  canvasTouchEnd() {
    window.dispatchEvent(new CustomEvent('actions-executed', { detail: { name: this.title } }));
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'init' } });
  }

  canvasMouseWheel(deltaY) {
    clearTimeout(this.timeoutId);

    this.originalTranslateOffset = app.workspace.translateOffset;
    this.originalZoom = app.workspace.zoomLevel;

    let minZoom = app.settings.minZoomLevel,
      maxZoom = app.settings.maxZoomLevel,
      offset = (this.originalZoom - deltaY / 100) / this.originalZoom,
      mousePos = app.workspace.lastKnownMouseCoordinates;

    if (offset * this.originalZoom > maxZoom) {
      offset = maxZoom / this.originalZoom - 0.001;
    }
    if (offset * this.originalZoom < minZoom) {
      offset = minZoom / this.originalZoom + 0.001;
    }

    this.scaleOffset = offset;
    const centerProp = mousePos.multiply(
      1 / app.canvasWidth,
      1 / app.canvasHeight,
    );

    if (!this.isLastActionZoom)
      setState({ tool: { name: this.name, currentStep: 'start', mode: 'wheel', title: this.title } });

    applyZoom(this.originalZoom * offset);
    this.isLastActionZoom = true;
    this.timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('actions-executed', { detail: { name: this.title } }))
      this.isLastActionZoom = false;
    }, 300)
  }
}
