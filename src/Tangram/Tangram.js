import { uniqId } from '../js/Tools/general';
import { Shape } from '../js/Objects/Shape';

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
      shapes: this.shapes.map(s => s.saveToObject()),
      silhouette: this.silhouette,
    };
    return data;
  }

  initFromObject(data) {
    this.id = data.id;
    this.name = data.name;
    this.shapes = data.shapes.map(sData => {
      let shape = new Shape({ x: 0, y: 0 }, []);
      shape.initFromObject(sData);
      return shape;
    });
    this.silhouette = data.silhouette;
  }
}
