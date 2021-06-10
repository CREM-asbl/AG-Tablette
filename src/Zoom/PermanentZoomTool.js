import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomTool extends Tool {
  constructor() {
    super('permanent_zoom', 'Zoomer');

    this.currentStep = null; // listen-canvas-click -> zooming-plane

    this.baseDist = null;

    this.lastDist = null;

    this.centerProp = null;

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
    if (touches.length == 2) {
      let point1 = touches[0],
        point2 = touches[1];
      this.centerProp = new Coordinates({
        x: (point1.x + point2.x) / 2 / app.canvasWidth,
        y: (point1.y + point2.y) / 2 / app.canvasHeight,
      });
      this.baseDist = point1.dist(point2);
      if (this.baseDist == 0) this.baseDist = 0.001;

      this.originalTranslateOffset = app.workspace.translateOffset;
      this.originalZoom = app.workspace.zoomLevel;

      app.upperDrawingEnvironment.removeAllObjects();
      setState({
        tool: { name: this.name, currentStep: 'start', mode: 'touch', title: this.title },
      });
    }
  }

  canvasTouchMove(touches) {
    if (touches.length !== 2) return;

    if (app.tool.currentStep == 'start') {
      let point1 = touches[0],
        point2 = touches[1],
        newDist = point1.dist(point2);
      if (newDist == 0) newDist = 0.001;
      this.lastDist = newDist;

      let scaleOffset = newDist / this.baseDist,
        minZoom = app.settings.minZoomLevel,
        maxZoom = app.settings.maxZoomLevel;
      if (scaleOffset * this.originalZoom > maxZoom) {
        // -> scaleOffset*originalZoom = maxZoom
        scaleOffset = maxZoom / this.originalZoom - 0.001;
      }
      if (scaleOffset * this.originalZoom < minZoom) {
        scaleOffset = minZoom / this.originalZoom + 0.001;
      }

      let
        newZoom = this.originalZoom * scaleOffset,
        actualWinSize = new Coordinates({
          x: app.canvasWidth,
          y: app.canvasHeight,
        }).multiply(1 / this.originalZoom),
        newWinSize = actualWinSize.multiply(1 / scaleOffset),
        newTranslateoffset = this.originalTranslateOffset
          .multiply(1 / this.originalZoom)
          .add(
            newWinSize
              .substract(actualWinSize)
              .multiply(this.centerProp.x, this.centerProp.y),
          )
          .multiply(newZoom);

      app.workspace.setZoomLevel(newZoom, false);
      app.workspace.setTranslateOffset(newTranslateoffset);
    }
  }

  canvasTouchEnd() {
    if (app.tool.currentStep != 'start') return;

    let offset = this.lastDist / this.baseDist,
      actualZoom = this.originalZoom,
      minZoom = app.settings.minZoomLevel,
      maxZoom = app.settings.maxZoomLevel;

    if (offset * actualZoom > maxZoom) {
      // -> offset*actualZoom = maxZoom
      offset = maxZoom / actualZoom - 0.001;
    }
    if (offset * actualZoom < minZoom) {
      offset = minZoom / actualZoom + 0.001;
    }

    this.scaleOffset = offset;

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'init' } });
  }

  canvasMouseWheel(deltaY) {
    this.originalTranslateOffset = app.workspace.translateOffset;
    this.originalZoom = app.workspace.zoomLevel;

    let minZoom = app.settings.minZoomLevel,
      maxZoom = app.settings.maxZoomLevel,
      offset = (this.originalZoom - deltaY / 100) / this.originalZoom,
      mousePos = app.workspace.lastKnownMouseCoordinates;

    if (offset * this.originalZoom > maxZoom) {
      // -> offset*originalZoom = maxZoom
      offset = maxZoom / this.originalZoom - 0.001;
    }
    if (offset * this.originalZoom < minZoom) {
      offset = minZoom / this.originalZoom + 0.001;
    }

    this.scaleOffset = offset;
    this.centerProp = mousePos.multiply(
      1 / app.canvasWidth,
      1 / app.canvasHeight,
    );

    setState({ tool: { name: this.name, currentStep: 'start', mode: 'wheel', title: this.title } });
    this.executeAction();
  }

  _executeAction() {
    let originalZoom = this.originalZoom;
    let originalTranslateOffset = new Coordinates(
      this.originalTranslateOffset,
    );

    let newZoom = originalZoom * this.scaleOffset,
      actualWinSize = new Coordinates({
        x: app.canvasWidth,
        y: app.canvasHeight,
      }).multiply(1 / originalZoom),
      newWinSize = actualWinSize.multiply(1 / this.scaleOffset),
      newTranslateoffset = originalTranslateOffset
        .multiply(1 / originalZoom)
        .add(
          newWinSize
            .substract(actualWinSize)
            .multiply(this.centerProp.x, this.centerProp.y),
        )
        .multiply(newZoom);

    app.workspace.setZoomLevel(newZoom, false);
    app.workspace.setTranslateOffset(newTranslateoffset);
  }
}
