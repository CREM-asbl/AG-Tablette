import { app } from '../App';

/**
 * Représente une coordonnée (pour un point ou des calculs)
 */
export class Coordinates {
  /**
   * @param {Number}                      x
   * @param {Number}                      y
   */
  constructor({ x = 0, y = 0 }) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
  }

  set(x, y) {
    this.x = parseFloat(x);
    this.y = parseFloat(y);
  }

  /**
   * add coordinates to this
   * @param {coordinates}  coordinates
   * @return {Coordinates} new coordinates
   */
  add(coordinates) {
    return new Coordinates({
      x: this.x + coordinates.x,
      y: this.y + coordinates.y,
    });
  }

  /**
   * substract coordinates to this
   * @param {Coordinates}  coordinates
   * @return {Coordinates} new coordinates
   */
  substract(coordinates) {
    return new Coordinates({
      x: this.x - coordinates.x,
      y: this.y - coordinates.y,
    });
  }

  /**
   * multiplies this with scalar(s)
   * @param {Number} multiplierX X axis multiplier
   * @param {Number} multiplierY Y axis multiplier
   */
  multiply(multiplierX, multiplierY = multiplierX) {
    return new Coordinates({
      x: this.x * multiplierX,
      y: this.y * multiplierY,
    });
  }

  equal(coordinates, precision = 0.001) {
    let dist = this.dist(coordinates);
    let isEqual = dist < precision;
    return isEqual;
  }

  dist(coordinates) {
    let pow1 = Math.pow(coordinates.x - this.x, 2),
      pow2 = Math.pow(coordinates.y - this.y, 2);
    let dist = Math.sqrt(pow1 + pow2);
    return dist;
  }

  toCanvasCoordinates() {
    return this.multiply(app.workspace.zoomLevel).add(
      app.workspace.translateOffset
    );
  }

  fromCanvasCoordinates() {
    return this.sub(app.workspace.translateOffset).multiply(
      1 / app.workspace.zoomLevel
    );
  }

  static get nullCoordinates() {
    let nullCoordinates = new Coordinates({ x: 0, y: 0 });
    return nullCoordinates;
  }
}
