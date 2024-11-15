import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { applyZoom } from './ZoomTool';


/**
 * Calcule le niveau de zoom en appliquant les limites min et max.
 *
 * @param {number} currentZoom - Le niveau de zoom actuel.
 * @param {number} zoomOffset - Le facteur de zoom à appliquer (ex: 1.1 pour zoomer, 0.9 pour dézoomer).
 * @param {number} minZoom - Le niveau de zoom minimum autorisé.
 * @param {number} maxZoom - Le niveau de zoom maximum autorisé.
 * @returns {number} Le nouveau niveau de zoom, en respectant les limites.
 */
const calculateZoomWithLimits = (currentZoom, zoomOffset, minZoom, maxZoom) => {
  let newZoom = currentZoom * zoomOffset
  if (newZoom > maxZoom) newZoom = maxZoom
  if (newZoom < minZoom) newZoom = minZoom
  return newZoom;
}


/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomTool extends Tool {
  constructor() {
    super('zoom', 'Zoomer');

    this.currentStep = null; // listen-canvas-click -> zooming-plane

    this.init();
  }

  /**
   * initialiser l'état
   */
  init() {
    this.removeListeners();
    this.touchStartId = app.addListener('canvasTouchStart', this.handler);
    this.mouseWheelId = app.addListener('canvasMouseWheel', this.handler);
  }

  start() {
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
    this.removeListeners();
  }

  canvasTouchStart(touches) {
    this.running = true
    if (touches.length == 2) {
      const point1 = touches[0], point2 = touches[1];
      this.baseDist = point1.dist(point2);
      if (this.baseDist == 0) this.baseDist = 0.001;
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
      const scaleOffset = newDist / this.baseDist
      const newZoom = calculateZoomWithLimits(this.originalZoom, scaleOffset, app.settings.minZoomLevel, app.settings.maxZoomLevel)
      applyZoom(newZoom)
    }
  }

  canvasTouchEnd() {
    if (!this.running) return;
    this.running = false;
    window.dispatchEvent(new CustomEvent('actions-executed', { detail: { name: this.title } }));
  }

  canvasMouseWheel(deltaY) {
    if (!this.isLastActionZoom)
      setState({ tool: { name: this.name, currentStep: 'start', mode: 'wheel', title: this.title } });
    clearTimeout(this.timeoutId);
    this.originalZoom = app.workspace.zoomLevel;
    const scaleOffset = (this.originalZoom - deltaY / 100) / this.originalZoom
    const newZoom = calculateZoomWithLimits(this.originalZoom, scaleOffset, app.settings.minZoomLevel, app.settings.maxZoomLevel)
    applyZoom(newZoom);
    this.isLastActionZoom = true;
    this.timeoutId = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('actions-executed', { detail: { name: this.title } }))
      this.isLastActionZoom = false;
    }, 300)
  }
}
