import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { Point } from '../Core/Objects/Point';

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
      new CustomEvent('app-state-changed', { detail: { startParams: undefined } }),
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

  _actionHandle(event) {
    if (event.type == 'canvastouchstart') {
      this.onTouchStart(event.detail.touches);
    } else if (event.type == 'canvastouchmove') {
      this.onTouchMove(event.detail.touches);
    } else if (event.type == 'canvastouchend') {
      this.onTouchEnd(event.detail.touches);
    } else if (event.type == 'canvasmousewheel') {
      this.onMouseWheel(event.detail.mousePos, event.detail.deltaY);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onTouchStart(touches) {
    if (touches.length == 2) {
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
      this.centerProp = new Point(
        (point1.x + point2.x) / 2 / app.canvasWidth,
        (point1.y + point2.y) / 2 / app.canvasHeight,
      );
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
        actualWinSize = new Point(app.canvasWidth / originalZoom, app.canvasHeight / originalZoom),
        newWinSize = new Point(actualWinSize.x / scaleOffset, actualWinSize.y / scaleOffset),
        newTranslateoffset = new Point(
          (originalTranslateOffset.x / originalZoom -
            (actualWinSize.x - newWinSize.x) * this.centerProp.x) *
            newZoom,
          (originalTranslateOffset.y / originalZoom -
            (actualWinSize.y - newWinSize.y) * this.centerProp.y) *
            newZoom,
        );

      app.workspace.setZoomLevel(newZoom, false);
      app.workspace.setTranslateOffset(newTranslateoffset);

      app.workspace.setTranslateOffset(originalTranslateOffset, false);
      app.workspace.setZoomLevel(originalZoom, false);
    }
  }

  onTouchEnd(touches) {
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
        originalTranslateOffset: new Point(app.workspace.translateOffset),
        centerProp: this.centerProp,
      },
    ];

    this.executeAction();
    this.restart();
  }

  onMouseWheel(mousePos, deltaY) {
    if (this.currentStep != 'listen-canvas-click') return;

    let actualZoom = app.workspace.zoomLevel,
      minZoom = app.settings.get('minZoomLevel'),
      maxZoom = app.settings.get('maxZoomLevel'),
      offset = (actualZoom - deltaY / 100) / actualZoom;

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
        originalTranslateOffset: new Point(app.workspace.translateOffset),
        centerProp: new Point(mousePos.x / app.canvasWidth, mousePos.y / app.canvasHeight),
      },
    ];

    this.executeAction();
  }
}
