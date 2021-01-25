/**
 * Représente les bords (d'une figure ou d'un segment)
 */
export class Bounds {
  /**
   * @param {Number}          minX
   * @param {Number}          minY
   * @param {Number}          maxX
   * @param {Number}          maxY
   */
  constructor(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  static getOuterBounds(...bounds) {
    let minX = bounds[0].minX,
      minY = bounds[0].minY,
      maxX = bounds[0].maxX,
      maxY = bounds[0].maxY;
    bounds.forEach(bound => {
      minX = Math.min(minX, bound.minX);
      minY = Math.min(minY, bound.minY);
      maxX = Math.max(maxX, bound.maxX);
      maxY = Math.max(maxY, bound.maxY);
    });
    return new Bounds(minX, minY, maxX, maxY);
  }
}
