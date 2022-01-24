import { app } from '../App';
import { ShapeManager } from './ShapeManager';
import { Point } from '../Objects/Point';
import { Segment } from '../Objects/Segment';

export class DrawManager {
  /* #################################################################### */
  /* ############################### UPDATE ############################# */
  /* #################################################################### */

  /**
   * Refresh the background and the forbidden ctx (grid and silhouette)
   */
  static refreshBackground() {
    if (app.environment.name !== 'Tangram') {
      app.backgroundDrawingEnvironment.removeAllObjects();
      app.backgroundDrawingEnvironment.mustDrawGrid = app.settings.gridShown;
    }
    app.backgroundDrawingEnvironment.redraw();
  }

  /**
   * Refresh the main canvas (regular shapes)
   */
  static refreshMain() {
    app.mainDrawingEnvironment.redraw();
  }

  /**
   * Refresh the upper canvas (animations)
   */
  static refreshUpper() {
    window.dispatchEvent(new CustomEvent('refreshStateUpper'));
    app.upperDrawingEnvironment.redraw();
  }

  /* #################################################################### */
  /* ############################### DRAW ############################### */
  /* #################################################################### */

  /**
   * Dessiner un groupe de figures sur un canvas donné
   * @param  {Context2D}  ctx                        Canvas
   * @param  {Shapes[]}   involvedShapes             Figures à dessiner
   * @param  {Function}   functionCalledBeforeDraw   La fonction à appliquer sur les shapes avant le dessin
   * @param  {Function}   functionCalledAfterDraw    La fonction à appliquer sur les shapes après le dessin
   * @param  {Number}     borderSize                 Epaisseur des bordures de la figure
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
    isReversed = false,
  ) {
    const orderedInvolvedShapes = involvedShapes.sort((s1, s2) =>
      ShapeManager.getShapeIndex(s1) > ShapeManager.getShapeIndex(s2) ? 1 : -1,
    );
    if (isReversed) {
      orderedInvolvedShapes.reverse();
    }
    orderedInvolvedShapes.forEach((s) => {
      functionCalledBeforeDraw(s);
      DrawManager.drawShape(ctx, s, borderSize, axeAngle);
      functionCalledAfterDraw(s);
    });
  }

  /**
   * Dessiner une figure dans un environement de dessin
   * @param  {DrawingEnvironment}  drawingEnvironment
   * @param  {Shape}               shape
   * @param  {Number}              borderSize
   */
  static drawShape(drawingEnvironment, shape, scaling) {
    shape.setCtxForDrawing(drawingEnvironment.ctx, scaling);
    drawingEnvironment.ctx.miterLimit = 1;

    const pathScaleMethod = drawingEnvironment.mustScaleShapes
        ? 'scale'
        : 'no scale',
      path = new Path2D(shape.getSVGPath(pathScaleMethod));

    if (shape.name != 'CircleArc') drawingEnvironment.ctx.fill(path, 'nonzero');
    drawingEnvironment.ctx.globalAlpha = 1;
    if (shape.segments.some(seg => seg.color != undefined)) {
      shape.segments.forEach(seg => {
        let path = new Path2D(seg.getSVGPath(pathScaleMethod, true));
        drawingEnvironment.ctx.strokeStyle = seg.color ? seg.color : '#000';
        drawingEnvironment.ctx.stroke(path);
      });
    } else
      drawingEnvironment.ctx.stroke(path);
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

    const firstCoordinates = this.vertexes[0].coordinates.toCanvasCoordinates();

    const path = new Path2D(
      ['M', firstCoordinates.x, firstCoordinates.y, segment.getSVGPath()].join(
        ' ',
      ),
    );

    ctx.stroke(path);

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
        1000000 * Math.sin(angle),
      ),
      segment.vertexes[1].addCoordinates(
        1000000 * Math.cos(angle),
        1000000 * Math.sin(angle),
      ),
    );

    const v0Copy = new Point(transformSegment.vertexes[0]);
    v0Copy.setToCanvasCoordinates();

    const path = new Path2D(
      ['M', v0Copy.x, v0Copy.y, transformSegment.getSVGPath()].join(' '),
    );

    ctx.stroke(path);

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
  static drawPoint(drawingEnvironment, point, color = '#000', doSave = true) {
    let ctx = drawingEnvironment.ctx;
    if (doSave) ctx.save();

    ctx.fillStyle = color;
    ctx.globalAlpha = 1;

    const canvasCoodinates = point.coordinates.toCanvasCoordinates();

    ctx.beginPath();
    ctx.moveTo(canvasCoodinates.x, canvasCoodinates.y);
    ctx.arc(
      canvasCoodinates.x,
      canvasCoodinates.y,
      point.size * 2 * app.workspace.zoomLevel,
      0,
      2 * Math.PI,
      0,
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
  static drawText(
    drawingEnvironment,
    text,
    position,
    color = '#000',
    doSave = true,
  ) {
    let ctx = drawingEnvironment.ctx;
    if (doSave) ctx.save();

    const fontSize = 20;
    let positionCopy = position.add({
      x: (((-3 * fontSize) / 13) * text.length) / app.workspace.zoomLevel,
      y: fontSize / 2 / app.workspace.zoomLevel,
    });
    positionCopy = positionCopy.toCanvasCoordinates();

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
window.addEventListener('draw-group', (event) => {
  const ctx = event.detail.ctx || app.upperCtx;
  DrawManager.drawGroup(
    ctx,
    event.detail.involvedShapes,
    event.detail.functionCalledBeforeDraw,
    event.detail.functionCalledAfterDraw,
    event.detail.borderSize,
    event.detail.axeAngle,
    event.detail.isReversed,
  );
});
window.addEventListener('draw-shape', (event) => {
  const drawingEnvironment = event.detail.shape.drawingEnvironment;
  DrawManager.drawShape(
    drawingEnvironment,
    event.detail.shape,
    event.detail.scaling,
  );
});
window.addEventListener('draw-segment', (event) => {
  const drawingEnvironment =
    event.detail.shape.drawingEnvironment || app.workspace;
  DrawManager.drawSegment(
    drawingEnvironment,
    event.detail.segment,
    event.detail.color,
    event.detail.size,
    event.detail.doSave,
  );
});
window.addEventListener('draw-line', (event) => {
  const drawingEnvironment =
    event.detail.shape.drawingEnvironment || app.workspace;
  DrawManager.drawLine(
    drawingEnvironment,
    event.detail.segment,
    event.detail.color,
    event.detail.size,
    event.detail.doSave,
  );
});
window.addEventListener('draw-point', (event) => {
  const drawingEnvironment = event.detail.point.drawingEnvironment;
  DrawManager.drawPoint(
    drawingEnvironment,
    event.detail.point,
    event.detail.color,
    event.detail.doSave,
  );
});
window.addEventListener('draw-text', (event) => {
  const drawingEnvironment =
    event.detail.text.drawingEnvironment || app.workspace;
  DrawManager.drawText(
    drawingEnvironment,
    event.detail.text.message,
    event.detail.text.coordinates,
    event.detail.text.color,
    event.detail.doSave,
  );
});
