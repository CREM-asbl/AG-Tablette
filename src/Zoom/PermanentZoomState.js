import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { Point } from '../Core/Objects/Point';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomState extends State {
  constructor() {
    super('permanent_zoom', 'Zoomer');

    this.currentStep = null; // listen-canvas-click -> zooming-plane

    this.baseDist = null;

    this.lastDist = null;

    this.centerProp = null;

    this.start();
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';

    this.touchStartId = app.addListener('canvastouchstart', this.handler);
    this.mouseWheelId = app.addListener('canvasmousewheel', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';
    this.touchStartId = app.addListener('canvastouchstart', this.handler);
    this.mouseWheelId = app.addListener('canvasmousewheel', this.handler);
    window.dispatchEvent(
      new CustomEvent('app-state-changed', {
        detail: { startParams: undefined },
      })
    );
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('canvastouchstart', this.touchStartId);
    app.removeListener('canvastouchmove', this.touchMoveId);
    app.removeListener('canvastouchend', this.touchEndId);
    app.removeListener('canvasmousewheel', this.mouseWheelId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvastouchstart') {
      this.onTouchStart(event.detail.touches);
    } else if (event.type == 'canvastouchmove') {
      this.onTouchMove(event.detail.touches);
    } else if (event.type == 'canvastouchend') {
      this.onTouchEnd(event.detail.touches);
    } else if (event.type == 'canvasmousewheel') {
      this.onMouseWheel(event.detail.deltaY);
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  onTouchStart(touches) {
    if (touches.length == 2) {
      app.upperDrawingEnvironment.removeAllObjects();
      window.dispatchEvent(new CustomEvent('abort-state'));
      this.touchMoveId = app.addListener('canvastouchmove', this.handler);
      this.touchEndId = app.addListener('canvastouchend', this.handler);
    }
  }

  onTouchMove(touches) {
    if (touches.length !== 2) return;

    if (this.currentStep == 'listen-canvas-click') {
      let point1 = touches[0],
        point2 = touches[1];
      this.centerProp = new Coordinates({
        x: (point1.x + point2.x) / 2 / app.canvasWidth,
        y: (point1.y + point2.y) / 2 / app.canvasHeight,
      });
      this.baseDist = point1.dist(point2);
      if (this.baseDist == 0) this.baseDist = 0.001;

      this.currentStep = 'zooming-plane';
    } else {
      let point1 = touches[0],
        point2 = touches[1],
        newDist = point1.dist(point2);
      if (newDist == 0) newDist = 0.001;
      this.lastDist = newDist;

      let scaleOffset = newDist / this.baseDist,
        originalZoom = app.workspace.zoomLevel,
        minZoom = app.settings.get('minZoomLevel'),
        maxZoom = app.settings.get('maxZoomLevel');
      if (scaleOffset * originalZoom > maxZoom) {
        // -> scaleOffset*originalZoom = maxZoom
        scaleOffset = maxZoom / originalZoom - 0.001;
      }
      if (scaleOffset * originalZoom < minZoom) {
        scaleOffset = minZoom / originalZoom + 0.001;
      }

      let originalTranslateOffset = app.workspace.translateOffset,
        newZoom = originalZoom * scaleOffset,
        actualWinSize = new Coordinates({
          x: app.canvasWidth,
          y: app.canvasHeight,
        }).multiply(1 / originalZoom),
        newWinSize = actualWinSize.multiply(1 / scaleOffset),
        newTranslateoffset = originalTranslateOffset
          .multiply(1 / originalZoom)
          .add(
            newWinSize
              .substract(actualWinSize)
              .multiply(this.centerProp.x, this.centerProp.y)
          )
          .multiply(newZoom);

      app.workspace.setZoomLevel(newZoom, false);
      app.workspace.setTranslateOffset(newTranslateoffset);

      app.workspace.setTranslateOffset(originalTranslateOffset, false);
      app.workspace.setZoomLevel(originalZoom, false);
    }
  }

  onTouchEnd() {
    if (this.currentStep != 'zooming-plane') return;

    let offset = this.lastDist / this.baseDist,
      actualZoom = app.workspace.zoomLevel,
      minZoom = app.settings.get('minZoomLevel'),
      maxZoom = app.settings.get('maxZoomLevel');

    if (offset * actualZoom > maxZoom) {
      // -> offset*actualZoom = maxZoom
      offset = maxZoom / actualZoom - 0.001;
    }
    if (offset * actualZoom < minZoom) {
      offset = minZoom / actualZoom + 0.001;
    }

    this.actions = [
      {
        name: 'ZoomAction',
        scaleOffset: offset,
        originalZoom: actualZoom,
        originalTranslateOffset: new Coordinates(app.workspace.translateOffset),
        centerProp: this.centerProp,
      },
    ];

    this.executeAction();
    this.restart();
  }

  onMouseWheel(deltaY) {
    if (this.currentStep != 'listen-canvas-click') return;

    let actualZoom = app.workspace.zoomLevel,
      minZoom = app.settings.get('minZoomLevel'),
      maxZoom = app.settings.get('maxZoomLevel'),
      offset = (actualZoom - deltaY / 100) / actualZoom,
      mousePos = app.workspace.lastKnownMouseCoordinates;

    if (offset * actualZoom > maxZoom) {
      // -> offset*actualZoom = maxZoom
      offset = maxZoom / actualZoom - 0.001;
    }
    if (offset * actualZoom < minZoom) {
      offset = minZoom / actualZoom + 0.001;
    }

    this.actions = [
      {
        name: 'ZoomAction',
        scaleOffset: offset,
        originalZoom: actualZoom,
        originalTranslateOffset: new Coordinates(app.workspace.translateOffset),
        centerProp: mousePos.multiply(
          1 / app.canvasWidth,
          1 / app.canvasHeight
        ),
      },
    ];

    this.executeAction();
  }
}
