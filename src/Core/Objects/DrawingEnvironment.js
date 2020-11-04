/**
 * Représente les bords (d'une figure ou d'un segment)
 */
export class DrawingEnvironment {
  /**
   *
   */
  constructor(ctx) {
    this.ctx = ctx;

    this.shapes = [];
    this.segments = [];
    this.points = [];

    this.mustDrawShapes = true;
    this.mustDrawSegments = true;
    this.mustDrawPoints = true;

    this.mustScaleShapes = true;
  }

  removeAllObjects() {
    this.shapes = [];
    this.segments = [];
    this.points = [];
    this.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  draw() {
    if (this.mustDrawShapes) {
      this.shapes.forEach(s =>
        window.dispatchEvent(
          new CustomEvent('draw-shape', { detail: { shape: s } })
        )
      );
    }
    if (this.mustDrawPoints) {
      this.points.forEach(pt =>
        window.dispatchEvent(
          new CustomEvent('draw-points', { detail: { point: pt } })
        )
      );
    }
  }
}
