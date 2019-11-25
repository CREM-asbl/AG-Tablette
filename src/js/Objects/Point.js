/**
 * Représente un point du plan
 */
export class Point {
  /**
   * create point from another point or coordinates
   * @param {{x: number, y: number}} point - point to copy
   * @param {number} x - other method
   * @param {number} y - other method
   */
  constructor() {
    if (typeof arguments[0] == 'object') {
      this.x = arguments[0].x;
      this.y = arguments[0].y;
    } else {
      this.x = arguments[0];
      this.y = arguments[1];
    }
  }

  /**
   * move the point with Point or coordinates
   * @param {{x: number, y: number}} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} neg - negative translation
   * @return {{x: number, y:number}} translated point
   */
  translate() {
    let neg,
      multiplier,
      x,
      y,
      i = 0;
    if (typeof arguments[i] == 'object') {
      x = arguments[i].x;
      y = arguments[i].y;
      i++;
      neg = arguments[i];
    } else {
      x = arguments[i];
      y = arguments[i] ? arguments[++i] : arguments[i];
      i++;
      neg = arguments[i];
    }
    multiplier = neg ? -1 : 1;
    console.log(x, y, neg, multiplier);
    this.x += x * multiplier;
    this.y += y * multiplier;
    return { x: this.x, y: this.y };
  }

  multiplyWithScalar(multiplier) {
    this.x *= multiplier;
    this.y *= multiplier;
    return { x: this.x, y: this.y };
  }

  copy() {
    return new Point(this.x, this.y);
  }

  /**
   *
   * @param {number} angle - rotation angle
   * @param {{x: number, y: number}} [center] - rotation center
   * @return {{x: number, y: number}}
   */
  rotate(angle, center = { x: 0, y: 0 }) {
    let s = Math.sin(angle),
      c = Math.cos(angle),
      x = this.x - center.x,
      y = this.y - center.y,
      newX = x * c - y * s + center.x,
      newY = x * s + y * c + center.y;
    this.x = newX;
    this.y = newY;
    return { x: this.x, y: this.y };
  }

  /**
   * distance with another Point or coordinates
   * @param {Object} point - point to compare with
   * @param {number} x - other method
   * @param {number} y - other method
   * @return {number} dist - Euclidean distance
   */
  dist() {
    let x, y;
    if (arguments.length == 1) {
      if (arguments[0] instanceof Point || arguments[0][0] == undefined) {
        x = arguments[0].x;
        y = arguments[0].y;
      } else {
        x = arguments[0][0];
        y = arguments[0][1];
      }
    } else if (arguments.length == 2) {
      x = arguments[0];
      y = arguments[1];
    }
    let pow1 = Math.pow(x - this.x, 2),
      pow2 = Math.pow(y - this.y, 2);
    return Math.sqrt(pow1 + pow2);
  }

  /**
   * equality with another Point or coordinates
   * @param {Object} point - point to compare with
   * @param {number} x - other method
   * @param {number} y - other method
   */
  equal() {
    let x, y;
    if (arguments.length == 1) {
      if (arguments[0] instanceof Point || arguments[0][0] == undefined) {
        x = arguments[0].x;
        y = arguments[0].y;
      } else {
        x = arguments[0][0];
        y = arguments[0][1];
      }
    } else if (arguments.length == 2) {
      x = arguments[0];
      y = arguments[1];
    }
    return Math.abs(x - this.x) < 1 && Math.abs(y - this.y) < 1;
  }
}
