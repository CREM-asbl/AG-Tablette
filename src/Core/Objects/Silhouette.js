import { Shape } from './Shape';

/**
 * Groupe de formes liées. Un tel groupe est créé par l'utilisateur à l'aide de
 * l'outil de création de groupes (Grouper/Dégrouper).
 */
export class Silhouette {
  /**
   *
   * @param {Shape[]} shapes les shapes représentant la silhouette
   */
  constructor(shapes) {
    this.shapes = shapes;
  }

  saveToObject() {
    let save = {
      shapes: this.shapes.map(s => s.saveToObject()),
    };
    return save;
  }

  initFromObject(save) {
    this.shapes = save.shapes.map(s => {
      let newShape = new Shape({ x: 0, y: 0 }, null);
      newShape.initFromObject(s);
      return newShape;
    });
  }
}