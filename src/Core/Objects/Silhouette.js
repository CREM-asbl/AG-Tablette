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
  constructor(shapes = []) {
    this.shapes = shapes.map(shape => {
      shape.name = 'silhouette';
      shape.color = '#000';
      shape.borderColor = '#fff';
      shape.opacity = 1;
      return shape;
    });
  }

  saveToObject() {
    let save = {
      shapes: this.shapes.map(s => s.saveToObject()),
    };
    return save;
  }

  static initFromObject(save) {
    return new Silhouette(save.shapes.map(s => Shape.fromObject(s)));
  }

  copy() {
    return new Silhouette(this.shapes.map(s => s.copy()));
  }

  toSVG() {
    return this.shapes.map(shape => shape.to_svg()).join('\n');
  }
}
