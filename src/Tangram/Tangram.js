import { uniqId } from '../Core/Tools/general';
import { Shape } from '../Objects/Shape';
import { Silhouette } from '../Objects/Silhouette';

export class Tangram {
  /**
   * Constructeur
   * @param {[Shape]} shapes   Liste des formes nécessaires pour construire le
   *                           le tangram.
   * @param {Object} silhouette Liste de polygones (= de tableaux de points)
   */
  constructor(name, shapes, silhouette) {
    this.id = uniqId();

    this.name = name;

    this.shapes = shapes;

    this.silhouette = silhouette;
  }

  saveToObject() {
    let data = {
      id: this.id,
      name: this.name,
    };
    if (this.shapes) data.shapes = this.shapes.map(s => s.saveToObject());
    if (this.silhouette) data.silhouette = this.silhouette.saveToObject();
    return data;
  }

  initFromObject(data) {
    this.id = data.id;
    this.name = data.name;
    if (data.shapes) {
      this.shapes = data.shapes.map(sData => {
        let shape = new Shape({ x: 0, y: 0 }, []);
        shape.initFromObject(sData);
        return shape;
      });
    }
    if (data.silhouette) {
      this.silhouette = new Silhouette();
      this.silhouette.initFromObject(data.silhouette);
    }
  }
}
