import { app, setState } from '../Core/App';
import { Tool } from '../Core/States/Tool';
import { html } from 'lit-element';
import { Coordinates } from '../Core/Objects/Coordinates';

/**
 * Zoomer/Dézoomer le plan
 */
export class ZoomTool extends Tool {
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
    this.removeListeners();

    this.mouseDownId = app.addListener('canvasMouseDown', this.handler);
  }

  zoom() {
    this.removeListeners();

    this.mouseMoveId = app.addListener('canvasMouseMove', this.handler);
    this.mouseUpId = app.addListener('canvasMouseUp', this.handler);
  }

  /**
   * stopper l'état
   */
  end() {
    this.removeListeners();
  }

  canvasMouseDown() {
    if (app.tool.currentStep != 'start') return;

    this.baseDist = this.getDistanceFromScreenCenter(
      app.workspace.lastKnownMouseCoordinates,
    );

    setState({ tool: { ...app.tool, currentStep: 'zoom' } });
  }

  canvasMouseMove() {
    if (app.tool.currentStep != 'zoom') return;

    let scaleOffset =
        this.getDistanceFromScreenCenter(
          app.workspace.lastKnownMouseCoordinates,
        ) / this.baseDist,
      originalZoom = app.workspace.zoomLevel,
      minZoom = app.settings.minZoomLevel,
      maxZoom = app.settings.maxZoomLevel;
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
    if (app.tool.currentStep != 'zoom') return;

    this.scaleOffset =
      this.getDistanceFromScreenCenter(
        app.workspace.lastKnownMouseCoordinates,
      ) / this.baseDist;
    this.originalZoom = app.workspace.zoomLevel;
    this.originalTranslateOffset = app.workspace.translateOffset;
    this.centerProp = new Coordinates({ x: 0.5, y: 0.5 });

    const minZoom = app.settings.minZoomLevel,
      maxZoom = app.settings.maxZoomLevel;
    if (this.scaleOffset * this.originalZoom > maxZoom) {
      // -> scaleOffset * originalZoom = maxZoom
      this.scaleOffset = maxZoom / this.originalZoom - 0.001;
    }
    if (this.scaleOffset * this.originalZoom < minZoom) {
      this.scaleOffset = minZoom / this.originalZoom + 0.001;
    }

    this.executeAction();
    setState({ tool: { ...app.tool, name: this.name, currentStep: 'start' } });
  }

  _executeAction() {
    let newZoom = this.originalZoom * this.scaleOffset,
      actualWinSize = new Coordinates({
        x: app.canvasWidth,
        y: app.canvasHeight,
      }).multiply(1 / this.originalZoom),
      newWinSize = actualWinSize.multiply(1 / this.scaleOffset),
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

  getDistanceFromScreenCenter(mouseCoordinates) {
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
