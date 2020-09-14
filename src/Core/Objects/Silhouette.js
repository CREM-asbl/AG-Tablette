import { Shape } from './Shape';

export class Silhouette {
  /**
   *
   * @param {Shape[]} shapes les shapes représentant la silhouette
   */
  constructor(shapes = [], level = 1) {
    this.level = level;
    this.shapes = shapes.map(shape => {
      shape.name = 'silhouette';
      shape.color = '#000';
      shape.borderColor = level % 2 != 0 ? '#fff' : '#000';
      shape.opacity = 1;
      if (level == 5 || level == 6) shape.scale(2 / 3);
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
      save.shapes.map(s => new Shape(s)),
      level
    );
  }

  get bounds() {
    //minX, maxX, minY, maxY
    let result = [[], [], [], []];
    this.shapes.forEach(shape => {
      shape.bounds.forEach((bound, idx) => {
        result[idx].push(bound);
      });
    });
    return result.map((value, idx) => {
      if (idx % 2) return Math.max(...value);
      else return Math.min(...value);
    });
  }

  copy() {
    return new Silhouette(this.shapes.map(s => s.copy()));
  }

  toSVG() {
    return this.shapes.map(shape => shape.toSVG()).join('\n');
  }
}
