/**
 * Représente un point du plan
 */
export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  translate(x, y) {
    if (y == undefined) {
      this.x += x;
      this.y += x;
    } else {
      this.x += x;
      this.y += y;
    }
  }

  multiplyWithScalar(mult) {
    this.x *= mult;
    this.y *= mult;
  }

  copy() {
    return new Point(this.x, this.y);
  }

  /**
   * distance with another Point or coordinates
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
