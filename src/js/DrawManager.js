import { app } from './App';
import { GridManager } from '../Grid/GridManager';
import { GroupManager } from './GroupManager';
import { ShapeManager } from './ShapeManager';

export class DrawManager {
  /* #################################################################### */
  /* ############################# TRANSFORM ############################ */
  /* #################################################################### */

  static resetTransformations() {
    app.upperCtx.setTransform(1, 0, 0, 1, 0, 0);
    app.mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    app.backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  static translateView(relativeOffset) {
    app.upperCtx.translate(relativeOffset.x, relativeOffset.y);
    app.mainCtx.translate(relativeOffset.x, relativeOffset.y);
    app.backgroundCtx.translate(relativeOffset.x, relativeOffset.y);
  }

  static scaleView(relativeScale) {
    app.upperCtx.scale(relativeScale, relativeScale);
    app.mainCtx.scale(relativeScale, relativeScale);
    app.backgroundCtx.scale(relativeScale, relativeScale);
  }

  /* #################################################################### */
  /* ############################### UPDATE ############################# */
  /* #################################################################### */

  static clearCtx(ctx) {
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.restore();
  }

  static refreshBackground() {
    DrawManager.clearCtx(app.backgroundCtx);

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

      let pts = GridManager.getVisibleGridPoints(min, max);
      pts.forEach(pt => {
        DrawManager.drawPoint(app.backgroundCtx, pt, '#F00', 1.5 / actualZoomLvl, false);
      });
    }

    //Tangram
    if (app.environment.name == 'Tangram' && app.tangram.silhouette) {
      // let { type, id } = app.workspace.settings.get('shownTangram');
      // let tangram = app.tangramManager.getTangram(type, id);
      DrawManager.drawShape(app.backgroundCtx, app.tangram.silhouette.shape);
      // tangram.polygons.forEach(polygon => {
      //   DrawManager.drawPoint(app.backgroundCtx, polygon[0], '#E90CC8', 1);
      //   for (let i = 0; i < polygon.length - 1; i++) {
      //     app.app.drawLine(DrawManager.backgroundCtx, polygon[i], polygon[i + 1], '#E90CC8', 3);
      //     app.app.drawPoint(DrawManager.backgroundCtx, polygon[i + 1], '#E90CC8', 1);
      //   }
      // });
    }
  }

  static refreshMain() {
    DrawManager.clearCtx(app.mainCtx);

    //Afficher les formes
    app.workspace.shapes
      .filter(shape => {
        return app.workspace.editingShapes.findIndex(s => s.id == shape.id) == -1;
      })
      .forEach(shape => {
        DrawManager.drawShape(app.mainCtx, shape);
        window.dispatchEvent(
          new CustomEvent('shapeDrawn', { detail: { ctx: app.mainCtx, shape: shape } }),
        );
      });
  }

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
   * @param  {Shape}      shape                Forme à dessiner
   * @param  {Number}     [borderSize=1]       Epaisseur des bordures de la forme
   * @param  {Segment}    [axeAngle=undefined] Axe de symétrie (pour reverse)
   */
  static drawShape(ctx, shape, borderSize = 1, axeAngle = undefined) {
    ctx.strokeStyle = shape.borderColor;
    ctx.fillStyle = shape.isBiface && shape.isReversed ? shape.second_color : shape.color;
    ctx.globalAlpha = shape.opacity;
    ctx.lineWidth = borderSize;
    const path = shape.getPath(axeAngle);

    ctx.fill(path);
    ctx.globalAlpha = 1;
    ctx.stroke(path);
    ctx.save();

    if (app.settings.get('areShapesPointed') && shape.name != 'silhouette') {
      if (shape.isSegment())
        DrawManager.drawPoint(ctx, shape.segments[0].vertexes[0], '#000', 1, false);
      shape.segments.forEach(seg => {
        if (!shape.isCircle()) DrawManager.drawPoint(ctx, seg.vertexes[1], '#000', 1, false);
      });
    }
    shape.segments.forEach(seg => {
      if (seg.points && seg.points.length) {
        seg.points.forEach(pt => {
          DrawManager.drawPoint(ctx, pt, '#000', 1, false);
        });
      }
    });
    if (shape.isCenterShown) DrawManager.drawPoint(ctx, shape.center, '#000', 1, false); //Le centre
    ctx.restore();

    ctx.lineWidth = 1;
  }

  /**
   * Dessiner une forme sur un canvas donné
   * @param  {Context2D}  ctx                  Canvas
   * @param  {Shapes[]}   involvedShapes       Formes à dessiner
   * @param  {Function}   fct1                 La fonction à appliquer sur les shapes avant le dessin
   * @param  {Function}   fct2                 La fonction à appliquer sur les shapes après le dessin
   * @param  {Number}     [borderSize=1]       Epaisseur des bordures de la forme
   * @param  {Segment}    [axeAngle=undefined] Axe de symétrie (pour reverse)
   * @param  {Boolean}    [isReversed=false]   Si le groupe doit etre retourné
   */
  static drawGroup(
    ctx,
    involvedShapes,
    fct1,
    fct2,
    borderSize = 1,
    axeAngle = undefined,
    isReversed = false,
  ) {
    let orderedInvolvedShapes = involvedShapes.sort((s1, s2) =>
      ShapeManager.getShapeIndex(s1) > ShapeManager.getShapeIndex(s2) ? 1 : -1,
    );
    if (isReversed) {
      orderedInvolvedShapes.reverse();
    }
    orderedInvolvedShapes.forEach(s => {
      fct1(s);
      DrawManager.drawShape(ctx, s, borderSize, axeAngle);
      fct2(s);
    });
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
  static drawLine(ctx, line, color = '#000', size = 1, doSave = true) {
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
  static drawArc(
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
  static drawText(ctx, text, position, color = '#000', doSave = true) {
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
  static drawCircle(ctx, point, color = '#000', radius = 10, doSave = true) {
    if (doSave) ctx.save();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius / app.workspace.zoomLevel, 0, 2 * Math.PI, 0);
    ctx.closePath();
    ctx.stroke();

    if (doSave) ctx.restore();
  }
}

// transform
window.addEventListener('resetTransformations', event => {
  DrawManager.resetTransformations();
});
window.addEventListener('translateView', event => {
  DrawManager.translateView(event.detail.offset);
});
window.addEventListener('scaleView', event => {
  DrawManager.scaleView(event.detail.scale);
});

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
window.addEventListener('draw-shape', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawShape(ctx, event.detail.shape, event.detail.borderSize, event.detail.axeAngle);
});
window.addEventListener('draw-group', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawGroup(
    ctx,
    event.detail.involvedShapes,
    event.detail.fct1,
    event.detail.fct2,
    event.detail.borderSize,
    event.detail.axeAngle,
    event.detail.isReversed,
  );
});
window.addEventListener('draw-point', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawPoint(
    ctx,
    event.detail.point,
    event.detail.color,
    event.detail.size,
    event.detail.doSave,
  );
});
window.addEventListener('draw-line', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawLine(
    ctx,
    event.detail.line,
    event.detail.color,
    event.detail.size,
    event.detail.doSave,
  );
});
window.addEventListener('draw-arc', event => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawArc(
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
  DrawManager.drawText(
    ctx,
    event.detail.text,
    event.detail.position,
    event.detail.color,
    event.detail.doSave,
  );
});
