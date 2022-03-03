import { app } from '../App';
import { Bounds } from './Bounds';
import { Coordinates } from './Coordinates';
import { RegularShape } from './Shapes/RegularShape';

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
        drawingEnvironment: app.backgroundDrawingEnvironment,
        name: 'silhouette',
        fillColor: '#000',
        strokeColor: level % 2 != 0 ? '#fff' : '#000',
        fillOpacity: 1,
        isPointed: false,
        size: 1,
      });
      if (level == 5 || level == 6) {
        shapeCopy.scale(0.6);
        shapeCopy.size = 0.6;
      }
      return shapeCopy;
    });

    const bounds = this.bounds;
    let silhouetteCenter = new Coordinates({
        x: (bounds.maxX + bounds.minX) / 2,
        y: (bounds.maxY + bounds.minY) / 2,
      }),
      width = app.canvasWidth,
      height = app.canvasHeight,
      expectedCenter = new Coordinates({ x: (3 * width) / 4, y: height / 2 });
    silhouetteCenter = silhouetteCenter.toCanvasCoordinates();
    let translation = expectedCenter.substract(silhouetteCenter);
    translation = translation.multiply(1 / app.workspace.zoomLevel);
    this.shapes.forEach((s) => {
      s.translate(translation);
    });
  }

  saveToObject() {
    let save = {
      shapesData: app.backgroundDrawingEnvironment.shapes.map((s) => {
        let shapeData = s.saveData();
        shapeData.segmentIds = undefined;
        shapeData.pointIds = undefined;
        return shapeData;
      }),
    };
    return save;
  }

  static initFromObject(save, level) {
    return new Silhouette(save.shapesData, true, level);
  }

  get bounds() {
    let bounds = Bounds.getOuterBounds(...this.shapes.map((s) => s.bounds));
    return bounds;
  }
}
