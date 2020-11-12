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
      this.points.forEach(pt => {
        if (pt.visible) {
          window.dispatchEvent(
            new CustomEvent('draw-point', {
              detail: { point: pt, color: pt.color },
            })
          );
        }
      });
    }
  }

  /**
   * find an object in this drawingEnvironment
   * @param {String} id
   * @param {String} objectType   'shape', 'segment' or 'point'
   */
  findObjectById(id, objectType = 'shape') {
    let object = this[objectType + 's'].find(obj => obj.id == id);
    return object;
  }

  /**
   * find the index of an object in this drawingEnvironment
   * @param {String} id
   * @param {String} objectType   'shape', 'segment' or 'point'
   */
  findIndexById(id, objectType = 'shape') {
    let index = this[objectType + 's'].findIndex(obj => obj.id == id);
    return index;
  }

  /**
   * remove an object from this drawingEnvironment
   * @param {String} id
   * @param {String} objectType   'shape', 'segment' or 'point'
   */
  removeObjectById(id, objectType = 'shape') {
    if (objectType == 'shape') {
      let object = this.findObjectById(id, objectType);
      object.segments.forEach(seg => this.removeObjectById(seg.id, 'segment'));
      object.points.forEach(pt => this.removeObjectById(pt.id, 'point'));
    }
    let index = this.findIndexById(id, objectType);
    this[objectType + 's'].splice(index, 1);
  }
}
