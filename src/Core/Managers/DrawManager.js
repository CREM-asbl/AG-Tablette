import { app } from '../App';
import { GridManager } from '../../Grid/GridManager';
import { ShapeManager } from './ShapeManager';
import { Point } from '../Objects/Point';

export class DrawManager {
  /* #################################################################### */
  /* ############################### UPDATE ############################# */
  /* #################################################################### */

  /**
   * efface un canvas
   * @param {Context2D} ctx   le ctx à effacer
   */
  static clearCtx(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  /**
   * Refresh the background and the forbidden ctx (grid and silhouette)
   */
  static refreshBackground() {
    DrawManager.clearCtx(app.backgroundCtx);

    // Grid
    if (app.workspace.settings.get('isGridShown')) {
      let canvasWidth = app.canvas.main.clientWidth,
        canvasHeight = app.canvas.main.clientHeight,
        offsetX = app.workspace.translateOffset.x,
        offsetY = app.workspace.translateOffset.y,
        actualZoomLvl = app.workspace.zoomLevel,
        // Ne pas voir les points apparaître :
        marginToAdd = 20 * actualZoomLvl,
        min = {
          x: -offsetX / actualZoomLvl - marginToAdd,
          y: -offsetY / actualZoomLvl - marginToAdd,
        },
        max = {
          x: (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
          y: (canvasHeight - offsetY) / actualZoomLvl + marginToAdd,
        };

      let pts = GridManager.getVisibleGridPoints(min, max);
      pts.forEach(pt => {
        DrawManager.drawPoint(
          app.backgroundCtx,
          pt,
          '#F00',
          1.5 * actualZoomLvl,
          false
        );
      });
    }

    // Tangram
    if (app.silhouette) {
      let ctx;
      if (app.silhouette.level != 3 && app.silhouette.level != 4) {
        ctx = app.backgroundCtx;
      } else {
        ctx = app.forbiddenCtx;
        DrawManager.clearCtx(ctx);
        // clear au cas ou
      }

      let bounds = app.silhouette.bounds;
      let silhouetteCenter = new Point(
        (bounds[1] + bounds[0]) / 2,
        (bounds[3] + bounds[2]) / 2
      );
      let width = app.canvasWidth / 2;
      let height = app.canvasHeight;
      let canvasCenter = new Point(width / 2, height / 2);

      if (app.silhouette.level != 3 && app.silhouette.level != 4) {
        canvasCenter.translate(width, 0);
      }

      silhouetteCenter.setToCanvasCoordinates();

      let translation = canvasCenter.subCoordinates(silhouetteCenter);

      translation.multiplyWithScalar(1 / app.workspace.zoomLevel, true);

      app.silhouette.shapes.forEach(s => {
        s.translate(translation);
        DrawManager.drawShape(ctx, s);
      });
    }
  }

  /**
   * Refresh the main ctx (regular shapes)
   */
  static refreshMain() {
    DrawManager.clearCtx(app.mainCtx);

    //Afficher les formes
    app.workspace.shapes
      .filter(shape => {
        return (
          app.workspace.editingShapes.findIndex(s => s.id == shape.id) == -1
        );
      })
      .forEach(shape => {
        DrawManager.drawShape(app.mainCtx, shape);
        window.dispatchEvent(
          new CustomEvent('shapeDrawn', { detail: { shape: shape } })
        );
      });
  }

  /**
   * Refresh the upper ctx (animations)
   */
  static refreshUpper() {
    DrawManager.clearCtx(app.upperCtx);
    window.dispatchEvent(new CustomEvent('drawUpper'));
  }

  /* #################################################################### */
  /* ############################### DRAW ############################### */
  /* #################################################################### */

  /**
   * Dessiner une forme sur un canvas donné
   * @param  {Context2D}  ctx                  Canvas
   * @param  {Shapes[]}   involvedShapes       Formes à dessiner
   * @param  {Function}   functionCalledBeforeDraw                 La fonction à appliquer sur les shapes avant le dessin
   * @param  {Function}   functionCalledAfterDraw                 La fonction à appliquer sur les shapes après le dessin
   * @param  {Number}     [borderSize=1]       Epaisseur des bordures de la forme
   * @param  {Segment}    [axeAngle=undefined] Axe de symétrie (pour reverse)
   * @param  {Boolean}    [isReversed=false]   Si le groupe doit etre retourné
   */
  static drawGroup(
    ctx,
    involvedShapes,
    functionCalledBeforeDraw,
    functionCalledAfterDraw,
    borderSize = 1,
    axeAngle = undefined,
    isReversed = false
  ) {
    let orderedInvolvedShapes = involvedShapes.sort((s1, s2) =>
      ShapeManager.getShapeIndex(s1) > ShapeManager.getShapeIndex(s2) ? 1 : -1
    );
    if (isReversed) {
      orderedInvolvedShapes.reverse();
    }
    orderedInvolvedShapes.forEach(s => {
      functionCalledBeforeDraw(s);
      DrawManager.drawShape(ctx, s, borderSize, axeAngle);
      functionCalledAfterDraw(s);
    });
  }

  /**
   * Dessiner une forme sur un canvas donné
   * @param  {Context2D}  ctx                  Canvas
   * @param  {Shape}      shape                Forme à dessiner
   * @param  {Number}     [borderSize=1]       Epaisseur des bordures de la forme
   * @param  {Number}     [axeAngle=undefined] Axe de symétrie (pour reverse)
   */
  static drawShape(ctx, shape, borderSize = 1, axeAngle = undefined) {
    ctx.strokeStyle = shape.borderColor;
    ctx.fillStyle =
      shape.isBiface && shape.isReversed ? shape.second_color : shape.color;
    ctx.globalAlpha = shape.opacity;
    ctx.lineWidth = borderSize;
    let scaleMethod =
      ctx.canvas.width == 52 && ctx.canvas.height == 52 ? 'no scale' : 'scale';
    let path = new Path2D(shape.getSVGPath(scaleMethod, axeAngle));

    ctx.save();

    ctx.fill(path, 'nonzero');
    ctx.globalAlpha = 1;
    ctx.stroke(path);

    ctx.restore();

    // ctx.save();

    if (
      app.settings.get('areShapesPointed') &&
      shape.name !== 'silhouette' &&
      !shape.isCircle()
    ) {
      shape.vertexes.forEach(point =>
        DrawManager.drawPoint(ctx, point, '#000', 1, false)
      );
    }

    shape.segmentPoints.forEach(point =>
      DrawManager.drawPoint(ctx, point, '#000', 1, false)
    );

    if (shape.isCenterShown)
      DrawManager.drawPoint(ctx, shape.center, '#000', 1, false); //Le centre

    ctx.restore();
    ctx.lineWidth = 1;
  }

  /**
   * Dessine une ligne
   * @param  {Context2D}  ctx             Canvas
   * @param  {Point}      line            Segment à dessiner
   * @param  {String}     [color='#000']  Couleur de la ligne
   * @param  {Number}     [size=1]        Epaisseur de la ligne
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  static drawSegment(ctx, segment, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    let v0Copy = new Point(segment.vertexes[0]);
    v0Copy.setToCanvasCoordinates();
    let SVGPath = ['M', v0Copy.x, v0Copy.y, segment.getSVGPath()].join(' ');

    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = size;

    let path = new Path2D(SVGPath);

    ctx.stroke(path);

    ctx.lineWidth = 1;
    if (doSave) ctx.restore();
  }

  /**
   * Dessiner un point
   * @param  {Context2D}  ctx            Canvas
   * @param  {Point}      point          Point à dessiner
   * @param  {String}     [color="#000"] Couleur du point
   * @param  {Number}     [size=1]       Taille du point
   * @param  {Boolean}    [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  static drawPoint(ctx, point, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;

    let copy = new Point(point);
    copy.setToCanvasCoordinates();

    ctx.beginPath();
    ctx.moveTo(copy.x, copy.y);
    ctx.arc(copy.x, copy.y, size * 2, 0, 2 * Math.PI, 0);
    ctx.closePath();
    ctx.fill();

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
  static drawText(ctx, text, position, color = '#000', doSave = true) {
    if (doSave) ctx.save();

    let fontSize = 13; // * app.workspace.zoomLevel;
    let positionCopy = new Point(position);
    positionCopy.setToCanvasCoordinates();

    ctx.fillStyle = color;
    ctx.font = fontSize + 'px Arial';
    ctx.fillText(
      text,
      positionCopy.x - (3 * text.length) / app.workspace.zoomLevel,
      positionCopy.y + fontSize / 100
    );

    if (doSave) ctx.restore();
  }
}

// refresh
window.addEventListener('refresh', () => {
  DrawManager.refreshMain();
});
window.addEventListener('refreshMain', () => {
  DrawManager.refreshMain();
});
window.addEventListener('refreshUpper', () => {
  DrawManager.refreshUpper();
});
window.addEventListener('refreshBackground', () => {
  DrawManager.refreshBackground();
});

// draw
window.addEventListener('draw-group', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawGroup(
    ctx,
    event.detail.involvedShapes,
    event.detail.functionCalledBeforeDraw,
    event.detail.functionCalledAfterDraw,
    event.detail.borderSize,
    event.detail.axeAngle,
    event.detail.isReversed
  );
});
window.addEventListener('draw-shape', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawShape(
    ctx,
    event.detail.shape,
    event.detail.borderSize,
    event.detail.axeAngle
  );
});
window.addEventListener('draw-segment', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawSegment(
    ctx,
    event.detail.segment,
    event.detail.color,
    event.detail.size,
    event.detail.doSave
  );
});
window.addEventListener('draw-point', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawPoint(
    ctx,
    event.detail.point,
    event.detail.color,
    event.detail.size,
    event.detail.doSave
  );
});
window.addEventListener('draw-text', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawText(
    ctx,
    event.detail.text,
    event.detail.position,
    event.detail.color,
    event.detail.doSave
  );
});
