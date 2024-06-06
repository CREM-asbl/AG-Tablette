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
    console.log(app.mainCanvasLayer.shapes)
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

    let silhouetteMax = this.silouhetteMax,
      width = app.canvasWidth,
      height = app.canvasHeight,
      expectedCoord = new Coordinates({ x: (width - app.workspace.translateOffset.x - 16), y: height / 2 });
    console.log(silhouetteMax, width, app.workspace.translateOffset, expectedCoord)
    silhouetteMax = silhouetteMax.multiply(app.workspace.zoomLevel);
    let translation = expectedCoord.substract(silhouetteMax);
    console.log(silhouetteMax, translation)
    this.translate(translation);
  }

  translate(translation) {
    this.shapes.forEach((s) => s.translate(translation));
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
    return this.bounds.minX * app.workspace.zoomLevel + app.workspace.translateOffset.x;
  }

  get maxX() {
    return this.bounds.maxX;
  }

}
