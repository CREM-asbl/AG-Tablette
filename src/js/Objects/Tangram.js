import { uniqId } from '../Tools/general';
import { Shape } from './Shape';

export class Tangram {
  /**
   * Constructeur
   * @param {[Shape]} shapes   Liste des formes nécessaires pour construire le
   *                           le tangram.
   * @param {[[Points]]} polygons Liste de polygones (= de tableaux de points)
   */
  constructor(name, shapes, polygons) {
    this.id = uniqId();

    this.name = name;

    this.shapes = shapes;

    this.polygons = polygons;
  }

  saveToObject() {
    let data = {
      id: this.id,
      name: this.name,
      shapes: this.shapes.map(s => s.saveToObject()),
      polygons: this.polygons,
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
    this.polygons = data.polygons;
  }
}
