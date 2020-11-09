/**
 * Représente les bords (d'une figure ou d'un segment)
 */
export class DrawingEnvironment {
  /**
   *
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.shapes = [];
    this.segments = [];
    this.points = [];

    this.editingShapeIds = [];

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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  redraw() {
    this.clear();
    this.draw();
  }

  draw() {
    if (this.mustDrawShapes) {
      this.shapes.forEach(s => {
        if (this.editingShapeIds.findIndex(id => s.id == id) == -1) {
          window.dispatchEvent(
            new CustomEvent('draw-shape', { detail: { shape: s } })
          );
        }
      });
    }
    if (this.mustDrawPoints) {
      this.points.forEach(pt =>
        window.dispatchEvent(
          new CustomEvent('draw-point', {
            detail: { point: pt, color: pt.color },
          })
        )
      );
    }
  }
}
