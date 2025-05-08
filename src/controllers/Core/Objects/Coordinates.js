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
    let isEqual = dist <= precision; // Changé de < à <=
    return isEqual;
  }

  /**
   * Renvoie l'angle (en radians) entre la droite reliant this et point, et l'axe
   * horizontal passant par this.
   * @param  {Coordinates} coordinates
   * @return {float}          L'angle, en radians. L'angle renvoyé est dans
   *                              l'intervalle [0, 2PI[
   */
  angleWith(coordinates) {
    let coord = coordinates.substract(this);
    //Trouver l'angle de coord par rapport à (0,0)
    // https://en.wikipedia.org/wiki/Atan2 -> voir image en haut à droite,
    //  sachant qu'ici l'axe des y est inversé.
    let angle = Math.atan2(coord.y, coord.x);
    if (angle < 0) angle += 2 * Math.PI;
    if (2 * Math.PI - angle < 0.00001) angle = 0;
    return angle;
  }

  /**
   * return this middle of this and coordinates
   * @param {*} coordinates
   */
  middleWith(coordinates) {
    let middle = this.add(coordinates).multiply(1 / 2);
    return middle;
  }

  /**
   * Rotate with rotationAngle and centre
   * @param {Number}       rotationAngle
   * @param {Coordinates}  center
   */
  rotate(rotationAngle, center = Coordinates.nullCoordinates) {
    let startAngle = center.angleWith(this),
      newAngle = startAngle + rotationAngle,
      dist = this.dist(center),
      newCoordinates = center.add(
        new Coordinates({
          x: dist * Math.cos(newAngle),
          y: dist * Math.sin(newAngle),
        }),
      );
    return newCoordinates;
  }

  dist(coordinates) {
    let pow1 = Math.pow(coordinates.x - this.x, 2),
      pow2 = Math.pow(coordinates.y - this.y, 2);
    let dist = Math.sqrt(pow1 + pow2);
    return dist;
  }

  toCanvasCoordinates() {
    return this.multiply(app.workspace.zoomLevel).add(app.workspace.translateOffset);
  }

  fromCanvasCoordinates() {
    return this.substract(app.workspace.translateOffset).multiply(1 / app.workspace.zoomLevel);
  }

  static get nullCoordinates() {
    let nullCoordinates = new Coordinates({ x: 0, y: 0 });
    return nullCoordinates;
  }
}
