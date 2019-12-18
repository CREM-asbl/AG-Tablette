/**
 * Représente un point du plan
 */
export class Point {
  /**
   * create point from another point or coordinates
   * @param {{x: number, y: number}} point - point to copy
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {Segment} segment - parent segment
   * @param {Shape} shape - shape
   */
  constructor() {
    let argc = 0;
    if (typeof arguments[argc] == 'object') {
      this.x = arguments[argc].x;
      this.y = arguments[argc].y;
      argc++;
    } else {
      this.x = arguments[argc++];
      this.y = arguments[argc++];
    }
    this.type = arguments[argc++]; // 'vertex', 'segmentPoint' or 'center'
    this.segment = arguments[argc++];
    this.shape = arguments[argc++];
  }

  setCoordinates({ x, y }) {
    this.x = x;
    this.y = y;
  }

  saveToObject() {
    const save = {
      x: this.x,
      y: this.y,
      type: this.type,
    };
    return save;
  }

  initFromObject(save) {
    this.x = save.x;
    this.y = save.y;
    this.type = save.type;
  }

  /**
   * move the point with Point or coordinates
   * @param {{x: number, y: number}} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @param {number} neg - negative translation
   * @return {{x: number, y:number}} new coordinates
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
      y = !isNaN(arguments[i + 1]) ? arguments[++i] : arguments[i];
      i++;
      neg = arguments[i];
    }
    multiplier = neg ? -1 : 1;
    this.x += x * multiplier;
    this.y += y * multiplier;
    return this.copy();
  }

  /**
   * add coordinates to point without update the coordinates of the point,
   *  if you want update, use translate
   * @param {{x: number, y: number}} point - point to add
   * @param {number} x - other method
   * @param {number} y - other method
   * @return {{x: number, y:number}} new coordinates
   */
  addCoordinates() {
    let x, y;
    if (typeof arguments[0] == 'object') {
      x = arguments[0].x;
      y = arguments[0].y;
    } else {
      x = arguments[0];
      y = !isNaN(arguments[1]) ? arguments[1] : arguments[0];
    }
    x = this.x + x;
    y = this.y + y;
    return new Point(x, y, this.type, this.segment, this.shape);
  }

  /**
   * sub coordinates to point without update the coordinates of the point,
   *  if you want update, use translate with true as last parameter
   * @param {{x: number, y: number}} point - point to sub
   * @param {number} x - other method
   * @param {number} y - other method
   * @return {{x: number, y:number}} new coordinates
   */
  subCoordinates() {
    let x, y;
    if (typeof arguments[0] == 'object') {
      x = arguments[0].x;
      y = arguments[0].y;
    } else {
      x = arguments[0];
      y = arguments[0] ? arguments[1] : arguments[0];
    }
    x = this.x + x * -1;
    y = this.y + y * -1;
    return new Point(x, y, this.type, this.segment, this.shape);
  }

  /**
   * multiplies ths coordinates with multiplier
   * @param {*} multiplier
   * @param {*} must_change_this - if this must be modified
   */
  multiplyWithScalar(multiplier, must_change_this = false) {
    let new_point = new Point(
      this.x * multiplier,
      this.y * multiplier,
      this.type,
      this.segment,
      this.shape,
    );
    if (must_change_this) {
      this.x = new_point.x;
      this.y = new_point.y;
    }
    return new_point;
  }

  copy() {
    return new Point(this.x, this.y, this.type, this.segment, this.shape);
  }

  /**
   *
   * @param {number} angle - rotation angle
   * @param {{x: number, y: number}} [center] - rotation center
   * @return {{x: number, y: number}} new coordinates
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
    return this.copy();
  }

  getRotated(angle, center = { x: 0, y: 0 }) {
    let s = Math.sin(angle),
      c = Math.cos(angle),
      x = this.x - center.x,
      y = this.y - center.y,
      newX = x * c - y * s + center.x,
      newY = x * s + y * c + center.y,
      newPoint = this.copy();
    newPoint.setCoordinates({ x: newX, y: newY });
    return newPoint;
  }

  /**
   * Renvoie l'angle (en radians) entre la droite reliant this et point, et l'axe
   * horizontal passant par this.
   * @param  {Point} point    Le second point
   * @return {float}          L'angle, en radians. L'angle renvoyé est dans
   *                              l'intervalle [0, 2PI[
   */
  getAngle(point) {
    let pt = {
      x: point.x - this.x,
      y: point.y - this.y,
    };
    //Trouver l'angle de pt par rapport à (0,0)
    // https://en.wikipedia.org/wiki/Atan2 -> voir image en haut à droite,
    //  sachant qu'ici l'axe des y est inversé.
    let angle = Math.atan2(pt.y, pt.x);
    if (angle < 0) angle += 2 * Math.PI;
    if (2 * Math.PI - angle < 0.00001) angle = 0;
    return angle;
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
    return this.dist(new Point(x, y)) < 1;
  }

  setToCanvasCoordinates() {
    this.multiplyWithScalar(app.workspace.zoomLevel);
    this.translate(app.workspace.translateOffset.x, app.workspace.translateOffset.y);
  }
}
