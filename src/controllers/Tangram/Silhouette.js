import { app } from '../Core/App';
import { Bounds } from '../Core/Objects/Bounds';
import { Coordinates } from '../Core/Objects/Coordinates';
import { RegularShape } from '../Core/Objects/Shapes/RegularShape';

export class Silhouette {
  /**
   *
   * @param {RegularShape[]} shapes les shapes représentant la silhouette
   */
  constructor(shapes = [], loadFromSave = false, level = 1) {
    this.level = level;
    this.shapes = shapes.map((shape) => {
      let shapeCopy = new RegularShape({
        ...shape,
        path: loadFromSave ? shape.path : shape.getSVGPath(false),
        layer: 'tangram',
        name: 'silhouette',
        strokeColor: level % 2 != 0 ? '#fff' : '#000',
        fillOpacity: 1,
        isPointed: false,
        size: level < 5 ? 1 : 0.6,
      });
      return shapeCopy;
    });
  }

  translate(translation) {
    this.shapes.forEach((s) => s.translate(translation));
  }

  scale(scale) {
    this.shapes.forEach((s) => s.scale(scale));
  }


  saveToObject() {
    let save = {
      shapesData: app.tangramCanvasLayer.shapes.map((s) => {
        let shapeData = s.saveData();
        shapeData.segmentIds = undefined;
        shapeData.pointIds = undefined;
        return shapeData;
      }),
    };
    return save;
  }

  get bounds() {
    let bounds = Bounds.getOuterBounds(...this.shapes.map((s) => s.bounds));
    return bounds;
  }

  get silouhetteMax() {
    const bounds = this.bounds;
    return new Coordinates({ x: bounds.maxX, y: (bounds.maxY + bounds.minY) / 2 })
  }

  get minX() {
    return this.bounds.minX * app.workspace.zoomLevel;
  }

  get maxX() {
    return this.bounds.maxX * app.workspace.zoomLevel;
  }

  get minY() {
    return this.bounds.minY * app.workspace.zoomLevel;
  }

  get maxY() {
    return this.bounds.maxY * app.workspace.zoomLevel;
  }

  get center() {
    return {
      x: (this.bounds.maxX + this.bounds.minX) * app.workspace.zoomLevel / 2,
      y: (this.bounds.maxY + this.bounds.minY) * app.workspace.zoomLevel / 2
    };
  }

  get largeur() { return Math.ceil(this.maxX - this.minX) }

  get hauteur() { return Math.ceil(this.maxY - this.minY) }

}
