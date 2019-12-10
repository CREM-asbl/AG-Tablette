import { app } from './App';

export class DrawAPI {
  constructor(upperCanvas, mainCanvas, backgroundCanvas, invisibleCanvas) {
    this.canvas = {
      upper: upperCanvas,
      main: mainCanvas,
      background: backgroundCanvas,
      invisible: invisibleCanvas,
    };
    this.upperCtx = this.canvas.upper.getContext('2d');
    this.mainCtx = this.canvas.main.getContext('2d');
    this.backgroundCtx = this.canvas.background.getContext('2d');
    this.invisibleCtx = this.canvas.invisible.getContext('2d');

    this.lastKnownMouseCoordinates = null;
  }

  clearCtx(ctx) {
    let canvasWidth = this.canvas.main.clientWidth,
      canvasHeight = this.canvas.main.clientHeight,
      maxX = canvasWidth * app.settings.get('maxZoomLevel'),
      maxY = canvasHeight * app.settings.get('maxZoomLevel');

    //TODO: calculer la zone à clear, en fonction du zoom et translate!
    ctx.clearRect(-10000, -10000, 20000, 20000);
  }

  resetTransformations() {
    this.upperCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  translateView(relativeOffset) {
    this.upperCtx.translate(relativeOffset.x, relativeOffset.y);
    this.mainCtx.translate(relativeOffset.x, relativeOffset.y);
    this.backgroundCtx.translate(relativeOffset.x, relativeOffset.y);
  }

  scaleView(relativeScale) {
    this.upperCtx.scale(relativeScale, relativeScale);
    this.mainCtx.scale(relativeScale, relativeScale);
    this.backgroundCtx.scale(relativeScale, relativeScale);
  }

  askRefresh(canvas = 'main') {
    if (canvas == 'main') this.refreshMain();
    else if (canvas == 'upper') this.refreshUpper();
    else if (canvas == 'background') this.refreshBackground();
    //TODO: limite de refresh par seconde? windowAnimationFrame?
    //TODO: ne pas mettre les canvas à jour qd mouseMove pendant une animFrame
    //TODO: vérifier que seule cette fonction est appelée de l'extérieur.
  }

  refreshBackground() {
    this.clearCtx(this.backgroundCtx);

    //Grid:
    if (app.workspace.settings.get('isGridShown')) {
      let canvasWidth = this.canvas.main.clientWidth,
        canvasHeight = this.canvas.main.clientHeight,
        offsetX = app.workspace.translateOffset.x,
        offsetY = app.workspace.translateOffset.y,
        actualZoomLvl = app.workspace.zoomLevel,
        //Ne pas voir les points apparaître:
        marginToAdd = 20 * actualZoomLvl,
        min = {
          x: -offsetX / actualZoomLvl - marginToAdd,
          y: -offsetY / actualZoomLvl - marginToAdd,
        },
        max = {
          x: (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
          y: (canvasHeight - offsetY) / actualZoomLvl + marginToAdd,
        };

      let pts = app.workspace.grid.getVisibleGridPoints(min, max);
      pts.forEach(pt => {
        this.drawPoint(this.backgroundCtx, pt, '#F00', 1.5 / actualZoomLvl, false);
      });
    }

    //Tangram
    if (app.workspace.settings.get('isTangramShown')) {
      let { type, id } = app.workspace.settings.get('shownTangram');
      let tangram = app.tangramManager.getTangram(type, id);
      tangram.polygons.forEach(polygon => {
        this.drawPoint(this.backgroundCtx, polygon[0], '#E90CC8', 1);
        for (let i = 0; i < polygon.length - 1; i++) {
          app.drawAPI.drawLine(this.backgroundCtx, polygon[i], polygon[i + 1], '#E90CC8', 3);
          app.drawAPI.drawPoint(this.backgroundCtx, polygon[i + 1], '#E90CC8', 1);
        }
      });
    }
  }

  refreshMain() {
    this.clearCtx(this.mainCtx);

    //Afficher les formes
    let shapesToSkip = app.state ? app.state.getEditingShapes() : [];
    app.workspace.shapes
      .filter(shape => {
        return shapesToSkip.findIndex(s => s.id == shape.id) == -1;
      })
      .forEach(shape => {
        this.drawShape(this.mainCtx, shape);
        if (app.state) app.state.shapeDrawn(this.mainCtx, shape);
      });
  }

  refreshUpper() {
    this.clearCtx(this.upperCtx);

    if (app.state) {
      app.state.draw(this.upperCtx, this.lastKnownMouseCoordinates);
    }
  }

  /**
   * Dessiner une forme sur un canvas donné
   * @param  {Context2D} ctx   le canvas
   * @param  {Shape} shape la forme
   */
  drawShape(ctx, shape, borderSize = 1) {
    ctx.strokeStyle = shape.borderColor;
    ctx.fillStyle = shape.isBiface && shape.isReversed ? shape.second_color : shape.color;
    ctx.globalAlpha = shape.opacity;
    ctx.lineWidth = borderSize;

    ctx.fill(shape.path);
    ctx.globalAlpha = 1;
    ctx.stroke(shape.path);
    ctx.save();

    if (app.settings.get('areShapesPointed')) {
      if (shape.isSegment()) this.drawPoint(ctx, shape.segments[0].vertexes[0], '#000', 1, false);
      shape.segments.forEach(seg => {
        this.drawPoint(ctx, seg.vertexes[1], '#000', 1, false);
        if (seg.points)
          seg.points.forEach(pt => {
            this.drawPoint(ctx, pt, '#000', 1, false);
          });
      });
    }
    if (shape.isCenterShown) this.drawPoint(ctx, shape.center, '#000', 1, false); //Le centre
    ctx.restore();

    ctx.lineWidth = 1;
  }

  /**
   * Dessiner un point
   * @param  {Context2D} ctx            le canvas
   * @param  {{x: float, y: float}} coordinates    les coordonnées du point
   * @param  {String} [color="#000"] La couleur du point
   * @param  {Number} [size=1]       Taille du point
   * @param  {Boolean} [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawPoint(ctx, coordinates, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(coordinates.x, coordinates.y);
    ctx.arc(coordinates.x, coordinates.y, size * 2, 0, 2 * Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    if (doSave) ctx.restore();
  }

  /**
   * Dessine un segment
   * @param  {Point} fromPoint    origine
   * @param  {Point} toPoint      destination
   * @param  {String} [color='#000'] Couleur de la ligne
   * @param  {Boolean} [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawLine(ctx, fromPoint, toPoint, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(fromPoint.x, fromPoint.y);
    ctx.lineTo(toPoint.x, toPoint.y);
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 1;
    if (doSave) ctx.restore();
  }

  /**
   * Dessine un texte
   * @param  {Context2D}  ctx         Le canvas
   * @param  {String}  text           Le texte à dessiner
   * @param  {Point}  point           Les coordonnées
   * @param  {String}  [color='#000'] La couleur du texte
   * @param  {Boolean} [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawText(ctx, text, point, color = '#000', doSave = true) {
    if (doSave) ctx.save();

    ctx.fillStyle = color;
    ctx.font = '13px Arial';
    ctx.fillText(text, point.x, point.y);

    if (doSave) ctx.restore();
  }

  /**
   * Dessine un cercle
   * @param  {Context2D} ctx         Le canvas
   * @param  {Point} point           Coordonnées du centre
   * @param  {String} [color='#000'] Couleur du bord
   * @param  {float} [radius=10]     Le rayon
   */
  drawCircle(ctx, point, color = '#000', radius = 10, doSave = true) {
    if (doSave) ctx.save();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius / this.app.workspace.zoomLevel, 0, 2 * Math.PI, 0);
    ctx.closePath();
    ctx.stroke();

    if (doSave) ctx.restore();
  }

  /**
   * Vérifie si un point est à l'intérieur d'une forme ou non
   * @param  {{x: float, y: float}}  point le point
   * @param  {Shape}  shape la forme
   * @return {Boolean}       true si le point est dans la forme
   */
  isPointInShape(point, shape) {
    const ctx = this.invisibleCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const selected = ctx.isPointInPath(shape.path, point.x, point.y);
    return selected;
  }
}
