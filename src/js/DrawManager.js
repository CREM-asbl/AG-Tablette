import { app } from './App';

export class DrawManager {
  constructor(upperCanvas, mainCanvas, backgroundCanvas, invisibleCanvas) {
    app.canvas = {
      upper: upperCanvas,
      main: mainCanvas,
      background: backgroundCanvas,
      invisible: invisibleCanvas,
    };
    app.upperCtx = app.canvas.upper.getContext('2d');
    app.mainCtx = app.canvas.main.getContext('2d');
    app.backgroundCtx = app.canvas.background.getContext('2d');
    app.invisibleCtx = app.canvas.invisible.getContext('2d');

    window.addEventListener('canvasmousemove', event => {
      app.lastKnownMouseCoordinates = event.detail.mousePos;
      window.dispatchEvent(new CustomEvent('refreshUpper'));
    });

    // transform
    window.addEventListener('resetTransformations', event => {
      this.resetTransformations();
    });
    window.addEventListener('translateView', event => {
      this.translateView(event.detail.offset);
    });
    window.addEventListener('scaleView', event => {
      this.scaleView(event.detail.scale);
    });

    // refresh
    window.addEventListener('refresh', event => {
      this.refreshMain();
    });
    window.addEventListener('refreshMain', event => {
      this.refreshMain();
    });
    window.addEventListener('refreshUpper', event => {
      this.refreshUpper();
    });
    window.addEventListener('refreshBackground', event => {
      this.refreshBackground();
    });

    // draw
    window.addEventListener('draw-shape', event => {
      const ctx = event.detail.ctx || app.upperCtx;
      this.drawShape(
        ctx,
        event.detail.shape,
        event.detail.borderSize,
        event.detail.axeAngle,
        event.detail.doSave,
      );
    });
    window.addEventListener('draw-point', event => {
      const ctx = event.detail.ctx || app.upperCtx;
      this.drawPoint(
        ctx,
        event.detail.point,
        event.detail.color,
        event.detail.size,
        event.detail.doSave,
      );
    });
    window.addEventListener('draw-line', event => {
      const ctx = event.detail.ctx || app.upperCtx;
      this.drawLine(
        ctx,
        event.detail.line,
        event.detail.color,
        event.detail.size,
        event.detail.doSave,
      );
    });
    window.addEventListener('draw-arc', event => {
      const ctx = event.detail.ctx || app.upperCtx;
      this.drawArc(
        ctx,
        event.detail.startPoint,
        event.detail.endPoint,
        event.detail.center,
        event.detail.counterclockwise,
        event.detail.color,
        event.detail.size,
        event.detail.doSave,
      );
    });
    window.addEventListener('draw-text', event => {
      const ctx = event.detail.ctx || app.upperCtx;
      this.drawText(
        ctx,
        event.detail.text,
        event.detail.position,
        event.detail.color,
        event.detail.doSave,
      );
    });
  }

  /* #################################################################### */
  /* ############################# TRANSFORM ############################ */
  /* #################################################################### */

  resetTransformations() {
    app.upperCtx.setTransform(1, 0, 0, 1, 0, 0);
    app.mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    app.backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  translateView(relativeOffset) {
    app.upperCtx.translate(relativeOffset.x, relativeOffset.y);
    app.mainCtx.translate(relativeOffset.x, relativeOffset.y);
    app.backgroundCtx.translate(relativeOffset.x, relativeOffset.y);
  }

  scaleView(relativeScale) {
    app.upperCtx.scale(relativeScale, relativeScale);
    app.mainCtx.scale(relativeScale, relativeScale);
    app.backgroundCtx.scale(relativeScale, relativeScale);
  }

  /* #################################################################### */
  /* ############################### UPDATE ############################# */
  /* #################################################################### */

  clearCtx(ctx) {
    let canvasWidth = app.canvas.main.clientWidth,
      canvasHeight = app.canvas.main.clientHeight,
      maxX = canvasWidth * app.settings.get('maxZoomLevel'),
      maxY = canvasHeight * app.settings.get('maxZoomLevel');

    //TODO: calculer la zone à clear, en fonction du zoom et translate!
    ctx.clearRect(-10000, -10000, 20000, 20000);
  }

  // askRefresh(canvas = 'main') {
  //   if (canvas == 'main') this.refreshMain();
  //   else if (canvas == 'upper') this.refreshUpper();
  //   else if (canvas == 'background') this.refreshBackground();
  //   //TODO: limite de refresh par seconde? windowAnimationFrame?
  //   //TODO: ne pas mettre les canvas à jour qd mouseMove pendant une animFrame
  //   //TODO: vérifier que seule cette fonction est appelée de l'extérieur.
  // }

  refreshBackground() {
    this.clearCtx(app.backgroundCtx);

    //Grid:
    if (app.workspace.settings.get('isGridShown')) {
      let canvasWidth = app.canvas.main.clientWidth,
        canvasHeight = app.canvas.main.clientHeight,
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
        this.drawPoint(app.backgroundCtx, pt, '#F00', 1.5 / actualZoomLvl, false);
      });
    }

    //Tangram
    // if (app.workspace.settings.get('isTangramShown')) {
    //   let { type, id } = app.workspace.settings.get('shownTangram');
    //   let tangram = app.tangramManager.getTangram(type, id);
    //   tangram.polygons.forEach(polygon => {
    //     this.drawPoint(app.backgroundCtx, polygon[0], '#E90CC8', 1);
    //     for (let i = 0; i < polygon.length - 1; i++) {
    //       app.DrawManager.drawLine(app.backgroundCtx, polygon[i], polygon[i + 1], '#E90CC8', 3);
    //       app.DrawManager.drawPoint(app.backgroundCtx, polygon[i + 1], '#E90CC8', 1);
    //     }
    //   });
    // }
  }

  refreshMain() {
    this.clearCtx(app.mainCtx);

    //Afficher les formes
    app.workspace.shapes
      .filter(shape => {
        return app.editingShapes.findIndex(s => s.id == shape.id) == -1;
      })
      .forEach(shape => {
        this.drawShape(app.mainCtx, shape);
        window.dispatchEvent(
          new CustomEvent('shapeDrawn', { detail: { ctx: app.mainCtx, shape: shape } }),
        );
      });
  }

  refreshUpper() {
    this.clearCtx(app.upperCtx);
    window.dispatchEvent(
      new CustomEvent('drawUpper', {
        detail: { ctx: app.upperCtx },
      }),
    );
  }

  /* #################################################################### */
  /* ############################### DRAW ############################### */
  /* #################################################################### */

  /**
   * Dessiner une forme sur un canvas donné
   * @param  {Context2D}  ctx             Canvas
   * @param  {Shape}      shape           Forme à dessiner
   * @param  {Number}     [borderSize=1]  Epaisseur des bordures de la forme
   * @param  {Boolean}    [axeAngle=true] Axe de symétrie (pour reverse)
   */
  drawShape(ctx, shape, borderSize = 1, axeAngle = undefined) {
    ctx.strokeStyle = shape.borderColor;
    ctx.fillStyle = shape.isBiface && shape.isReversed ? shape.second_color : shape.color;
    ctx.globalAlpha = shape.opacity;
    ctx.lineWidth = borderSize;
    const path = shape.getPath(axeAngle);

    ctx.fill(path);
    ctx.globalAlpha = 1;
    ctx.stroke(path);
    ctx.save();

    if (app.settings.get('areShapesPointed')) {
      if (shape.isSegment()) this.drawPoint(ctx, shape.segments[0].vertexes[0], '#000', 1, false);
      shape.segments.forEach(seg => {
        if (!shape.isCircle()) this.drawPoint(ctx, seg.vertexes[1], '#000', 1, false);
      });
    }
    shape.segments.forEach(seg => {
      if (seg.points && seg.points.length) {
        seg.points.forEach(pt => {
          this.drawPoint(ctx, pt, '#000', 1, false);
        });
      }
    });
    if (shape.isCenterShown) this.drawPoint(ctx, shape.center, '#000', 1, false); //Le centre
    ctx.restore();

    ctx.lineWidth = 1;
  }

  /**
   * Dessiner un point
   * @param  {Context2D}  ctx            Canvas
   * @param  {Point}      point          Point à dessiner
   * @param  {String}     [color="#000"] Couleur du point
   * @param  {Number}     [size=1]       Taille du point
   * @param  {Boolean}    [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawPoint(ctx, point, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.arc(point.x, point.y, size * 2, 0, 2 * Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    if (doSave) ctx.restore();
  }

  /**
   * Dessine un segment
   * @param  {Context2D}  ctx             Canvas
   * @param  {Point}      line            Segment à dessiner
   * @param  {String}     [color='#000']  Couleur de la ligne
   * @param  {Number}     [size=1]        Epaisseur de la ligne
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawLine(ctx, line, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.moveTo(line.vertexes[0].x, line.vertexes[0].y);
    ctx.lineTo(line.vertexes[1].x, line.vertexes[1].y);
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 1;
    if (doSave) ctx.restore();
  }

  /**
   * Dessine un texte
   * @param  {Context2D}  ctx               Canvas
   * @param  {String}     startPoint        Point de départ
   * @param  {String}     endPoint          Point d'arrivée
   * @param  {String}     center            Center
   * @param  {Boolean}    counterclockwise  Si anti-horaire
   * @param  {String}     [color='#000']    Couleur du texte
   * @param  {Number}     [size=1]          Epaisseur de l'arc
   * @param  {Boolean}    [doSave=true]     Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawArc(
    ctx,
    startPoint,
    endPoint,
    center,
    counterclockwise,
    color = '#000',
    size = 1,
    doSave = true,
  ) {
    let firstAngle = center.getAngle(startPoint),
      secondAngle = center.getAngle(endPoint);
    if (startPoint.equal(endPoint)) secondAngle += 2 * Math.PI;

    if (doSave) ctx.save();

    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = size;

    ctx.beginPath();
    ctx.arc(center.x, center.y, endPoint.dist(center), firstAngle, secondAngle, counterclockwise);
    ctx.stroke();

    ctx.lineWidth = 1;
    if (doSave) ctx.restore();
  }

  /**
   * Dessine un texte
   * @param  {Context2D}  ctx             Canvas
   * @param  {String}     text            Texte à dessiner
   * @param  {Point}      position        Coordonnées
   * @param  {String}     [color='#000']  Couleur du texte
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  drawText(ctx, text, position, color = '#000', doSave = true) {
    if (doSave) ctx.save();

    ctx.fillStyle = color;
    ctx.font = '13px Arial';
    ctx.fillText(text, position.x, position.y);

    if (doSave) ctx.restore();
  }

  /**
   * Dessine un cercle
   * @param  {Context2D}  ctx             Canvas
   * @param  {Point}      point           Coordonnées du centre
   * @param  {String}     [color='#000']  Couleur du bord
   * @param  {float}      [radius=10]     Rayon
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
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
}
