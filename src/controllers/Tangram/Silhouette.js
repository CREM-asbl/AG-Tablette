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
    console.log('Silhouette constructor: creating with', shapes.length, 'shapes, loadFromSave:', loadFromSave);
    console.log('Silhouette constructor: canvas already has', app.tangramCanvasLayer.shapes.length, 'shapes');

    // Filter out duplicate shapes based on path to avoid duplication
    const uniqueShapes = [];
    const seenPaths = new Set();
    for (const shape of shapes) {
      const path = loadFromSave ? shape.path : shape.getSVGPath(false);
      if (!seenPaths.has(path)) {
        seenPaths.add(path);
        uniqueShapes.push(shape);
      }
    }
    console.log('Silhouette constructor: filtered to', uniqueShapes.length, 'unique shapes');

    this.level = level;
    this.shapes = uniqueShapes.map((shape) => {
      // Always use path for silhouette shapes to ensure proper segment creation
      const path = loadFromSave ? shape.path : shape.getSVGPath(false);

      if (!path) {
        console.warn('Silhouette: Shape has no path', shape);
      }

      const shapeData = {
        // Preserve style properties from original shape
        fillColor: shape.fillColor,
        strokeWidth: shape.strokeWidth,
        // Override silhouette-specific properties
        path: path,
        layer: 'tangram',
        name: 'silhouette',
        strokeColor: level % 2 !== 0 ? '#fff' : '#000',
        fillOpacity: 1,
        isPointed: false,
        size: level < 5 ? 1 : 0.6,
      };

      const shapeCopy = new RegularShape(shapeData);
      return shapeCopy;
    });
    console.log('Silhouette constructor: created', this.shapes.length, 'shapes');
  }

  translate(translation) {
    this.shapes.forEach((s) => s.translate(translation));
  }

  scale(scale) {
    this.shapes.forEach((s) => s.scale(scale));
  }

  saveToObject() {
    // Only save shapes that belong to this silhouette instance
    const silhouetteShapeIds = new Set(this.shapes.map(s => s.id));
    console.log('Silhouette saveToObject: silhouetteShapeIds', [...silhouetteShapeIds]);
    console.log('Silhouette saveToObject: canvas shapes', app.tangramCanvasLayer.shapes.map(s => ({ id: s.id, name: s.name })));

    const save = {
      shapesData: app.tangramCanvasLayer.shapes
        .filter((s) => silhouetteShapeIds.has(s.id))
        .map((s) => {
          const shapeData = s.saveData();
          // Keep segmentIds and pointIds for proper loading
          // shapeData.segmentIds = undefined;
          // shapeData.pointIds = undefined;
          return shapeData;
        }),
    };
    console.log('Silhouette saveToObject: saving shapesData length', save.shapesData.length);
    return save;
  }

  get bounds() {
    if (this.shapes.length === 0) {
      return new Bounds(0, 0, 0, 0);
    }

    const shapeBounds = this.shapes.map((s) => {
      if (!s.segments || s.segments.length === 0) {
        return null;
      }
      const b = s.bounds;
      if (!(b instanceof Bounds) ||
        isNaN(b.minX) || isNaN(b.minY) || isNaN(b.maxX) || isNaN(b.maxY)) {
        return null;
      }
      return b;
    }).filter(b => b !== null);

    if (shapeBounds.length === 0) {
      return new Bounds(0, 0, 0, 0);
    }
    return Bounds.getOuterBounds(...shapeBounds);
  }

  get silouhetteMax() {
    const bounds = this.bounds;
    return new Coordinates({
      x: bounds.maxX,
      y: (bounds.maxY + bounds.minY) / 2,
    });
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
      x: ((this.bounds.maxX + this.bounds.minX) * app.workspace.zoomLevel) / 2,
      y: ((this.bounds.maxY + this.bounds.minY) * app.workspace.zoomLevel) / 2,
    };
  }

  get largeur() {
    return Math.ceil(this.maxX - this.minX);
  }

  get hauteur() {
    return Math.ceil(this.maxY - this.minY);
  }

  /**
  * Positionne la silhouette dans le canvas tangram selon le niveau
  * @param {string} fileExtension - Extension du fichier ('agt', 'ags', etc.)
  */
  positionInTangramCanvas(fileExtension = '') {
    if (fileExtension !== 'agt') {
      if (this.level > 4) {
        this.scale(0.6);
      }

      // Store initial center after scaling
      const initialCenterY = this.center.y;

      // Repositionner à gauche (compensation du décalage)
      this.translate({
        x: -this.bounds.minX,
        y: 0,
      });

      // Centrer verticalement dans le canvas
      const targetCenterY = (app.canvasHeight / 2);
      this.translate({
        x: 0,
        y: targetCenterY - initialCenterY
      });
      const tangramCanvasLayerWidth = app.canvasWidth / 2;
      if (this.largeur > tangramCanvasLayerWidth) {
        // Décaler légèrement et ajuster le zoom
        this.translate({ x: 16 / app.workspace.zoomLevel, y: 0 });
        app.workspace.setZoomLevel(
          app.workspace.zoomLevel *
          (app.canvasWidth / (2 * (this.largeur + 32))),
        );
      } else {
        // Centrer horizontalement dans la zone tangram
        const diff = (tangramCanvasLayerWidth - this.largeur) / 2;
        this.translate({ x: diff / app.workspace.zoomLevel, y: 0 });
      }
    }
    app.tangramCanvasLayer.clear();
    app.tangramCanvasLayer.draw();
  }
}
