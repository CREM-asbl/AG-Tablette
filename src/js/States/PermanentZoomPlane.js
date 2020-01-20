import { app } from '../App';
import { State } from './State';
import { Point } from '../Objects/Point';

/**
 * Zoomer/Dézoomer le plan
 */
export class PermanentZoomPlaneState extends State {
  constructor() {
    super('permanent_zoom_plane');

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

    window.addEventListener('canvastouchstart', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';
    window.addEventListener('canvastouchstart', this.handler);
    window.dispatchEvent(new CustomEvent('app-state-changed'));
  }

  /**
   * stopper l'état
   */
  end() {
    window.removeEventListener('canvastouchstart', this.handler);
    window.removeEventListener('canvastouchmove', this.handler);
    window.removeEventListener('canvastouchend', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'canvastouchstart') {
      this.onTouchStart(event.detail.touches);
    } else if (event.type == 'canvastouchmove') {
      this.onTouchMove(event.detail.touches);
    } else if (event.type == 'canvastouchend') {
      this.onTouchEnd(event.detail.touches);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onTouchStart(touches) {
    if (touches.length == 2) {
      window.dispatchEvent(new CustomEvent('abort-state'));
      window.addEventListener('canvastouchmove', this.handler);
      window.addEventListener('canvastouchend', this.handler);
    }
  }

  onTouchMove(touches) {
    if (touches.length !== 2) return;

    if (this.currentStep == 'listen-canvas-click') {
      let point1 = touches[0],
        point2 = touches[1];
      this.centerProp = new Point(
        ((point1.x + point2.x) / 2 - app.canvasLeftShift) / app.canvasWidth,
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
        name: 'ZoomPlaneAction',
        scaleOffset: offset,
        originalZoom: actualZoom,
        originalTranslateOffset: new Point(app.workspace.translateOffset),
        centerProp: this.centerProp,
      },
    ];

    this.executeAction();
    this.restart();
  }
}
