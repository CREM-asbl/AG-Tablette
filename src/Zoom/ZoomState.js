import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Point } from '../Core/Objects/Point';

/**
 * Zoomer/Dézoomer le plan
 */
export class ZoomState extends State {
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
    let toolName = 'Zoom';
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez l'écran n'importe où dans la zone de dessin, et faites glissez votre doigt sans le
        relacher, pour zoomer ou dézoomer le plan entier.<br />
        Le zoom se fait par rapport au centre de l'écran: écartez votre doigt du centre pour zoomer,
        et rapprochez-le du centre pour dézoomer.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    this.baseDist = null;

    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    this.mouseDownId = app.addListener('canvasmousedown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('canvasmousedown', this.mouseDownId);
    app.removeListener('canvasmousemove', this.mouseMoveId);
    app.removeListener('canvasmouseup', this.mouseUpId);
  }

  _actionHandle(event) {
    if (event.type == 'canvasmousedown') {
      this.onMouseDown();
    } else if (event.type == 'canvasmousemove') {
      this.onMouseMove();
    } else if (event.type == 'canvasmouseup') {
      this.onMouseUp();
    } else {
      console.log('unsupported event type : ', event.type);
    }
  }

  onMouseDown() {
    if (this.currentStep != 'listen-canvas-click') return;

    this.baseDist = this.getDist(app.workspace.lastKnownMouseCoordinates);

    this.currentStep = 'zooming-plane';
    this.mouseMoveId = app.addListener('canvasmousemove', this.handler);
    this.mouseUpId = app.addListener('canvasmouseup', this.handler);
  }

  onMouseMove() {
    if (this.currentStep != 'zooming-plane') return;

    let newDist = this.getDist(app.workspace.lastKnownMouseCoordinates),
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
      actualWinSize = new Point(app.canvasWidth, app.canvasHeight).multiplyWithScalar(
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

  onMouseUp() {
    if (this.currentStep != 'zooming-plane') return;

    let offset = this.getDist(app.workspace.lastKnownMouseCoordinates) / this.baseDist,
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
        originalTranslateOffset: app.workspace.translateOffset,
        centerProp: new Point(0.5, 0.5),
      },
    ];

    this.executeAction();
    this.restart();
  }

  getDist(mouseCoordinates) {
    let halfWinSize = new Point(app.canvasWidth, app.canvasHeight).multiplyWithScalar(
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
