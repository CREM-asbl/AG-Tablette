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
    this.shapes = shapes || [];
  }

  saveToObject() {
    let save = {
      shapes: this.shapes.map(s => s.saveToObject()),
    };
    return save;
  }

  initFromObject(save) {
    if (save.shapes) {
      this.shapes = save.shapes.map(s => Shape.fromObject(s));
    } else if (save.shape) {
      this.shapes = [save.shape].map(s => Shape.fromObject(s));
    }
  }

  copy() {
    return new Silhouette(this.shapes.map(s => s.copy()));
  }
}
