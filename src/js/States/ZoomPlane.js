import { app } from '../App';
import { State } from './State';
import { Point } from '../Objects/Point';

/**
 * Zoomer/Dézoomer le plan
 */
export class ZoomPlaneState extends State {
  constructor() {
    super('zoom_plane');

    this.currentStep = null; // listen-canvas-click -> zooming-plane

    this.baseDist = null;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    this.baseDist = null;

    window.addEventListener('canvasmousedown', this.handler);
  }

  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    window.addEventListener('canvasmousedown', this.handler);
  }

  end() {
    window.removeEventListener('canvasmousedown', this.handler);
    window.removeEventListener('canvasmousemove', this.handler);
    window.removeEventListener('canvasmouseup', this.handler);
  }

  _actionHandle(event) {
    if (event.type == 'canvasmousedown') {
      this.onMouseDown(event.detail.mousePos);
    } else if (event.type == 'canvasmousemove') {
      this.onMouseMove(event.detail.mousePos);
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp(event.detail.mousePos);
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onMouseDown(mouseCoordinates) {
    if (this.currentStep != 'listen-canvas-click') return;

    this.baseDist = this.getDist(mouseCoordinates);

    this.currentStep = 'zooming-plane';
    window.addEventListener('canvasmousemove', this.handler);
    window.addEventListener('canvasmouseup', this.handler);
  }

  onMouseMove(mouseCoordinates) {
    if (this.currentStep != 'zooming-plane') return;

    let newDist = this.getDist(mouseCoordinates),
      scaleOffset = newDist / this.baseDist,
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
      actualWinSize = new Point(app.cvsDiv.clientWidth, app.cvsDiv.clientHeight).multiplyWithScalar(
        1 / originalZoom,
      ),
      newWinSize = actualWinSize.multiplyWithScalar(1 / scaleOffset),
      newTranslateoffset = new Point(
        (originalTranslateOffset.x / originalZoom - (actualWinSize.x - newWinSize.x) / 2) * newZoom,
        (originalTranslateOffset.y / originalZoom - (actualWinSize.y - newWinSize.y) / 2) * newZoom,
      );

    app.workspace.setZoomLevel(newZoom, false);
    app.workspace.setTranslateOffset(newTranslateoffset);

    app.workspace.setTranslateOffset(originalTranslateOffset, false);
    app.workspace.setZoomLevel(originalZoom, false);
  }

  onMouseUp(mouseCoordinates) {
    if (this.currentStep != 'zooming-plane') return;

    let offset = this.getDist(mouseCoordinates) / this.baseDist,
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
        originalTranslateOffset: app.workspace.translateOffset,
        centerProp: new Point(0.5, 0.5),
      },
    ];

    this.executeAction();
    this.restart();
  }

  getDist(mouseCoordinates) {
    let halfWinSize = new Point(app.cvsDiv.clientWidth, app.cvsDiv.clientHeight).multiplyWithScalar(
        1 / app.workspace.zoomLevel / 2,
      ),
      translateOffset = app.workspace.translateOffset.multiplyWithScalar(
        1 / app.workspace.zoomLevel,
      ),
      center = halfWinSize.subCoordinates(translateOffset),
      dist = center.dist(mouseCoordinates);

    if (dist == 0) dist = 0.001;
    return dist;
  }
}
