import { Shape } from './Shape';
import { app } from '../App';
import { Coordinates } from './Coordinates';
import { Bounds } from './Bounds';

export class Silhouette {
  /**
   *
   * @param {Shape[]} shapes les shapes représentant la silhouette
   */
  constructor(shapes = [], loadFromSave = false, level = 1) {
    this.level = level;
    this.shapes = shapes.map(shape => {
      let shapeCopy = new Shape({
        ...shape,
        path: loadFromSave ? shape.path : shape.getSVGPath(false),
        drawingEnvironment: app.backgroundDrawingEnvironment,
        name: 'silhouette',
        color: '#000',
        borderColor: level % 2 != 0 ? '#fff' : '#000',
        opacity: 1,
        isPointed: false,
        size: 1,
      });
      if (level == 5 || level == 6) {
        shapeCopy.scale(2 / 3);
        shapeCopy.size = 0.66;
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
    this.shapes.forEach(s => {
      s.translate(translation);
    });
  }

  saveToObject() {
    let save = {
      shapesData: app.backgroundDrawingEnvironment.shapes.map(s => {
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
    let bounds = Bounds.getOuterBounds(...this.shapes.map(s => s.bounds));
    return bounds;
  }
}
