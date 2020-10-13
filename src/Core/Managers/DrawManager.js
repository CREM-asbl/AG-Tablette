import { app } from '../App';
import { GridManager } from '../../Grid/GridManager';
import { ShapeManager } from './ShapeManager';
import { Point } from '../Objects/Point';
import { Segment } from '../Objects/Segment';

export class DrawManager {
  /* #################################################################### */
  /* ############################### UPDATE ############################# */
  /* #################################################################### */

  /**
   * efface le contenu d'un canvas
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
      const canvasWidth = app.canvas.main.clientWidth,
        canvasHeight = app.canvas.main.clientHeight,
        offsetX = app.workspace.translateOffset.x,
        offsetY = app.workspace.translateOffset.y,
        actualZoomLvl = app.workspace.zoomLevel,
        // Ne pas voir les points apparaître :
        marginToAdd = 20 * actualZoomLvl,
        min = new Point(
          -offsetX / actualZoomLvl - marginToAdd,
          -offsetY / actualZoomLvl - marginToAdd
        ),
        max = new Point(
          (canvasWidth - offsetX) / actualZoomLvl + marginToAdd,
          (canvasHeight - offsetY) / actualZoomLvl + marginToAdd
        ),
        pts = GridManager.getVisibleGridPoints(min, max);

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

      const bounds = app.silhouette.bounds,
        silhouetteCenter = new Point(
          (bounds[1] + bounds[0]) / 2,
          (bounds[3] + bounds[2]) / 2
        ),
        width = app.canvasWidth / 2,
        height = app.canvasHeight,
        canvasCenter = new Point(width / 2, height / 2);

      if (app.silhouette.level != 3 && app.silhouette.level != 4) {
        canvasCenter.translate(width, 0);
      }

      silhouetteCenter.setToCanvasCoordinates();

      const translation = canvasCenter.subCoordinates(silhouetteCenter);

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
   * Dessiner un groupe de formes sur un canvas donné
   * @param  {Context2D}  ctx                        Canvas
   * @param  {Shapes[]}   involvedShapes             Formes à dessiner
   * @param  {Function}   functionCalledBeforeDraw   La fonction à appliquer sur les shapes avant le dessin
   * @param  {Function}   functionCalledAfterDraw    La fonction à appliquer sur les shapes après le dessin
   * @param  {Number}     borderSize                 Epaisseur des bordures de la forme
   * @param  {Segment}    axeAngle                   Axe de symétrie (pour reverse)
   * @param  {Boolean}    isReversed                 Si le groupe doit etre retourné
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
    const orderedInvolvedShapes = involvedShapes.sort((s1, s2) =>
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
   * @param  {Number}      borderSize          Epaisseur des bordures de la forme
   * @param  {Number}      axeAngle            Axe de symétrie (pour reverse)
   */
  static drawShape(ctx, shape, borderSize = 1, axeAngle = undefined) {
    ctx.strokeStyle = shape.borderColor;
    ctx.fillStyle =
      shape.isBiface && shape.isReversed ? shape.second_color : shape.color;
    ctx.globalAlpha = shape.opacity;
    ctx.lineWidth = borderSize * app.workspace.zoomLevel;

    const pathScaleMethod =
        ctx.canvas.width == 52 && ctx.canvas.height == 52
          ? 'no scale'
          : 'scale',
      path = new Path2D(shape.getSVGPath(pathScaleMethod, axeAngle));

    ctx.save();

    if (shape.name != 'CircleArc') ctx.fill(path, 'nonzero');
    ctx.globalAlpha = 1;
    ctx.stroke(path);

    ctx.restore();

    // ctx.save();

    if (
      app.settings.get('areShapesPointed') &&
      shape.name !== 'silhouette' &&
      !shape.isCircle() &&
      !shape.isStraightLine()
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
   * Dessine un segment (segment de droite ou arc de cercle) sur un canvas donné
   * @param  {Context2D}  ctx             Canvas
   * @param  {Segment}    segment         Segment à dessiner
   * @param  {String}     [color='#000']  Couleur du segment
   * @param  {Number}     [size=1]        Epaisseur du segment
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  static drawSegment(ctx, segment, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = size * app.workspace.zoomLevel;

    const v0Copy = new Point(segment.vertexes[0]);
    v0Copy.setToCanvasCoordinates();

    const path = new Path2D(
      ['M', v0Copy.x, v0Copy.y, segment.getSVGPath()].join(' ')
    );

    ctx.stroke(path);

    ctx.lineWidth = 1;

    if (doSave) ctx.restore();
  }

  /**
   * Dessine une droite sur un canvas donné
   * @param  {Context2D}  ctx             Canvas
   * @param  {Segment}    segment         Segment à dessiner (base pour la droite)
   * @param  {String}     [color='#000']  Couleur de la droite
   * @param  {Number}     [size=1]        Epaisseur de la droite
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  static drawLine(ctx, segment, color = '#000', size = 1, doSave = true) {
    if (doSave) ctx.save();

    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = size * app.workspace.zoomLevel;

    let angle = segment.getAngleWithHorizontal();
    let transformSegment = new Segment(
      segment.vertexes[0].subCoordinates(
        1000000 * Math.cos(angle),
        1000000 * Math.sin(angle)
      ),
      segment.vertexes[1].addCoordinates(
        1000000 * Math.cos(angle),
        1000000 * Math.sin(angle)
      )
    );

    const v0Copy = new Point(transformSegment.vertexes[0]);
    v0Copy.setToCanvasCoordinates();

    // console.log(['M', v0Copy.x, v0Copy.y, transformSegment.getSVGPath()].join(' '));

    const path = new Path2D(
      ['M', v0Copy.x, v0Copy.y, transformSegment.getSVGPath()].join(' ')
    );

    ctx.stroke(path);

    ctx.lineWidth = 1;

    if (doSave) ctx.restore();
  }

  /**
   * Dessiner un point sur un canvas donné
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

    const copy = new Point(point);
    copy.setToCanvasCoordinates();

    ctx.beginPath();
    ctx.moveTo(copy.x, copy.y);
    ctx.arc(
      copy.x,
      copy.y,
      size * 2 * app.workspace.zoomLevel,
      0,
      2 * Math.PI,
      0
    );
    ctx.closePath();
    ctx.fill();

    if (doSave) ctx.restore();
  }

  /**
   * Ecrire du texte sur une canvas donné
   * @param  {Context2D}  ctx             Canvas
   * @param  {String}     text            Texte à dessiner
   * @param  {Point}      position        Coordonnées
   * @param  {String}     [color='#000']  Couleur du texte
   * @param  {Boolean}    [doSave=true]   Faut-il sauvegarder le contexte du canvas (optimisation)
   */
  static drawText(ctx, text, position, color = '#000', doSave = true) {
    if (doSave) ctx.save();

    const fontSize = 20,
      positionCopy = new Point(position);
    positionCopy.translate(
      (((-3 * fontSize) / 13) * text.length) / app.workspace.zoomLevel,
      fontSize / 2 / app.workspace.zoomLevel
    );
    positionCopy.setToCanvasCoordinates();

    ctx.fillStyle = color;
    ctx.font = fontSize + 'px Arial';
    ctx.fillText(text, positionCopy.x, positionCopy.y);

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
window.addEventListener('draw-line', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawLine(
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
