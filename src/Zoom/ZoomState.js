import { app } from '../Core/App';
import { State } from '../Core/States/State';
import { html } from 'lit-element';
import { Coordinates } from '../Core/Objects/Coordinates';

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
    let toolName = this.title;
    return html`
      <h2>${toolName}</h2>
      <p>
        Vous avez sélectionné l'outil <b>"${toolName}"</b>.<br />
        Touchez l'écran n'importe où dans la zone de dessin, et faites glissez
        votre doigt sans le relacher, pour zoomer ou dézoomer le plan entier.<br />
        Le zoom se fait par rapport au centre de l'écran: écartez votre doigt du
        centre pour zoomer, et rapprochez-le du centre pour dézoomer.
      </p>
    `;
  }

  /**
   * initialiser l'état
   */
  start() {
    this.currentStep = 'listen-canvas-click';
    this.baseDist = null;

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  /**
   * ré-initialiser l'état
   */
  restart() {
    this.end();
    this.currentStep = 'listen-canvas-click';

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    app.removeListener('canvasMouseDown', this.mouseDownId);
    app.removeListener('canvasMouseMove', this.mouseMoveId);
    app.removeListener('canvasMouseUp', this.mouseUpId);
  }

  /**
   * Main event handler
   */
  _actionHandle(event) {
    if (event.type == 'canvasMouseDown') {
      this.canvasMouseDown();
    } else if (event.type == 'canvasMouseMove') {
      this.onMouseMove();
    } else if (event.type == 'canvasMouseUp') {
      this.canvasMouseUp();
    } else {
      console.error('unsupported event type : ', event.type);
    }
  }

  canvasMouseDown() {
    if (this.currentStep != 'listen-canvas-click') return;

    this.baseDist = this.getDist(app.workspace.lastKnownMouseCoordinates);

    this.currentStep = 'zooming-plane';
    this.mouseMoveId = app.addListener('canvasMouseMove', this.handler);
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  onMouseMove() {
    if (this.currentStep != 'zooming-plane') return;

    let scaleOffset =
        this.getDist(app.workspace.lastKnownMouseCoordinates) / this.baseDist,
      originalZoom = app.workspace.zoomLevel,
      minZoom = app.settings.get('minZoomLevel'),
      maxZoom = app.settings.get('maxZoomLevel');
    if (scaleOffset * originalZoom > maxZoom) {
      // -> scaleOffset * originalZoom = maxZoom
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
        .add(newWinSize.substract(actualWinSize).multiply(1 / 2))
        .multiply(newZoom);

    app.workspace.setZoomLevel(newZoom, false);
    app.workspace.setTranslateOffset(newTranslateoffset);

    app.workspace.setTranslateOffset(originalTranslateOffset, false);
    app.workspace.setZoomLevel(originalZoom, false);
  }

  canvasMouseUp() {
    if (this.currentStep != 'zooming-plane') return;

    let scaleOffset =
        this.getDist(app.workspace.lastKnownMouseCoordinates) / this.baseDist,
      actualZoom = app.workspace.zoomLevel,
      minZoom = app.settings.get('minZoomLevel'),
      maxZoom = app.settings.get('maxZoomLevel');
    if (scaleOffset * actualZoom > maxZoom) {
      // -> scaleOffset * actualZoom = maxZoom
      scaleOffset = maxZoom / actualZoom - 0.001;
    }
    if (scaleOffset * actualZoom < minZoom) {
      scaleOffset = minZoom / actualZoom + 0.001;
    }

    this.actions = [
      {
        name: 'ZoomAction',
        scaleOffset: scaleOffset,
        originalZoom: actualZoom,
        originalTranslateOffset: app.workspace.translateOffset,
        centerProp: new Coordinates({ x: 0.5, y: 0.5 }),
      },
    ];

    this.executeAction();
    this.restart();
  }

  getDist(mouseCoordinates) {
    let halfWinSize = new Coordinates({
        x: app.canvasWidth,
        y: app.canvasHeight,
      }).multiply(1 / app.workspace.zoomLevel / 2),
      translateOffset = app.workspace.translateOffset.multiply(
        1 / app.workspace.zoomLevel,
      ),
      center = halfWinSize.substract(translateOffset),
      dist = center.dist(mouseCoordinates);

    if (dist == 0) dist = 0.001;
    return dist;
  }
}
