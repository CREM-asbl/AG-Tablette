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
        layer: 'tangram',
        name: 'silhouette',
        strokeColor: level % 2 != 0 ? '#fff' : '#000',
        fillOpacity: 1,
        isPointed: false,
        size: level < 5 ? 1 : 0.6,
      });
      if (level > 4) {
        shapeCopy.scale(0.6);
      }
      return shapeCopy;
    });

    const bounds = this.bounds;
    let silhouetteMaxX = new Coordinates({
      x: bounds.maxX,
      y: (bounds.maxY + bounds.minY) / 2,
    }),
      width = app.canvasWidth,
      height = app.canvasHeight,
      expectedCoord = new Coordinates({ x: (width - 16), y: height / 2 });
    silhouetteMaxX = silhouetteMaxX.toCanvasCoordinates();
    let translation = expectedCoord.substract(silhouetteMaxX);
    this.shapes.forEach((s) => s.translate(translation));
  }

  saveToObject() {
    console.log('silhouette save')
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

  static initFromObject(save, level) {
    return new Silhouette(save.shapesData, true, level);
  }

  get bounds() {
    let bounds = Bounds.getOuterBounds(...this.shapes.map((s) => s.bounds));
    return bounds;
  }
}
