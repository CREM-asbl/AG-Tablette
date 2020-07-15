import { Shape } from './Shape';

export class Silhouette {
  /**
   *
   * @param {Shape[]} shapes les shapes représentant la silhouette
   */
  constructor(shapes = [], level = 1) {
    this.shapes = shapes.map(shape => {
      shape.name = 'silhouette';
      shape.color = '#000';
      shape.borderColor = level == 1 || level == 3 ? '#fff' : '#000';
      shape.size = level == 3 ? 1 : 2;
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

  static initFromObject(save, level) {
    return new Silhouette(
      save.shapes.map(s => Shape.fromObject(s)),
      level
    );
  }

  copy() {
    return new Silhouette(this.shapes.map(s => s.copy()));
  }

  toSVG() {
    return this.shapes.map(shape => shape.to_svg()).join('\n');
  }
}
