import { Points } from '../Tools/points';
import { rotatePoint } from '../Tools/geometry';
import { Point } from './Point';

export class ShapeBuildStep {
  constructor(type) {
    if (this.constructor === ShapeBuildStep) {
      throw new TypeError('Abstract class "ShapeBuildStep" cannot be instantiated directly');
    }
    this.type = type;
  }
  copy() {
    throw new TypeError('Copy method not implemented');
  }

  setScale(size) {
    this.coordinates = {
      x: this.coordinates.x * size,
      y: this.coordinates.y * size,
    };
  }

  rotate(angle, center = { x: 0, y: 0 }) {
    this.coordinates = rotatePoint(this.coordinates, angle, center);
  }

  translate(coordinates) {
    this.coordinates = Points.add(this.coordinates, coordinates);
  }
}

//Todo : Refactorer en Objet externe une fois que coordinates plus nécessaire
export class Segment extends ShapeBuildStep {
  constructor(point1, point2, isArc = false) {
    super('segment');
    this.coordinates = point2;
    this.vertexes = [new Point(point1), new Point(point2)];
    this.points = [];
    this.isArc = isArc;
  }

  addPoint({ x, y }) {
    //TODO: garder les points triés?
    this.points.push({ x, y });
  }

  deletePoint(point) {
    let i = this.points.findIndex(pt => {
      return Points.equal(pt, point);
    });
    if (i == -1) {
      console.error("couldn't delete point from segment");
      return null;
    }
    this.points.splice(i, 1);
  }

  copy(full = true) {
    let copy = new Segment(this.vertexes[0], this.vertexes[1], this.isArc);
    if (full) {
      this.points.forEach(p => {
        copy.addPoint(p);
      });
    }
    return copy;
  }

  //TODO: Simplifier la sauvegarde d'un segment et être plus proche des définitions dans les Kits
  saveToObject() {
    const save = {
      type: 'segment',
      coordinates: { x: this.coordinates.x, y: this.coordinates.y },
      points: this.points.map(pt => {
        return { x: pt.x, y: pt.y };
      }),
      isArc: this.isArc,
    };
    return save;
  }

  projectionPointOnSegment(point) {
    let center = null,
      p1x = this.vertexes[0].x,
      p1y = this.vertexes[0].y,
      p2x = this.vertexes[1].x,
      p2y = this.vertexes[1].y;

    //Calculer la projection du point sur l'axe.
    if (Math.abs(p2x - p1x) < 0.001) {
      //segment vertical
      center = { x: p1x, y: point.y };
    } else if (Math.abs(p2y - p1y) < 0.001) {
      //segment horizontal
      center = { x: point.x, y: p1y };
    } else {
      // axe.type=='NW' || axe.type=='SW'
      let f_a = (p1y - p2y) / (p1x - p2x),
        f_b = p2y - f_a * p2x,
        x2 = (point.x + point.y * f_a - f_a * f_b) / (f_a * f_a + 1),
        y2 = f_a * x2 + f_b;
      center = {
        x: x2,
        y: y2,
      };
    }
    return center;
  }

  isPointOnSegment(point) {
    let segmentLength = this.length,
      dist1 = Points.dist(this.vertexes[0], point),
      dist2 = Points.dist(this.vertexes[1], point);

    if (dist1 > segmentLength || dist2 > segmentLength) return false;

    return true;
  }

  get length() {
    return Points.dist(this.vertexes[0], this.vertexes[1]);
  }

  get direction() {
    const originVector = Points.sub(this.vertexes[1], this.vertexes[0]);
    return Points.multInt(originVector, 1 / this.length);
  }

  setScale(size) {
    super.setScale(size);
    this.vertexes.forEach(vertex => {
      vertex.multiplyWithScalar(size);
    });
    this.points.forEach(pt => {
      pt.x = pt.x * size;
      pt.y = pt.y * size;
    });
  }

  rotate(angle, center = { x: 0, y: 0 }) {
    super.rotate(angle, center);
    this.vertexes = this.vertexes.map(vertex => vertex.rotate(angle, center));
    this.points.forEach(pt => {
      let pointCoords = rotatePoint(pt, angle, center);
      pt.x = pointCoords.x;
      pt.y = pointCoords.y;
    });
  }

  translate(coordinates) {
    super.translate(coordinates);
    this.vertexes.forEach(vertex => vertex.translate(coordinates));
    this.points = this.points.map(point => Points.add(point, coordinates));
  }

  reverse() {
    this.vertexes.reverse();
  }

  get_middle() {
    return new Point(
      (this.vertexes[0].x + this.vertexes[1].x) / 2,
      (this.vertexes[0].y + this.vertexes[1].y) / 2,
    );
  }

  equal(segment) {
    if (this.vertexes[0].equal(segment.vertexes[1]) && this.vertexes[1].equal(segment.vertexes[0]))
      return true;
    if (this.vertexes[0].equal(segment.vertexes[0]) && this.vertexes[1].equal(segment.vertexes[1]))
      return true;
    return false;
  }

  hasSameDirection(segment) {
    return this.direction.x === segment.direction.x && this.direction.y === segment.direction.y;
  }
}

export class Vertex extends ShapeBuildStep {
  constructor({ x, y }) {
    super('vertex');
    this.coordinates = { x, y };
  }

  copy() {
    return new Vertex(this.coordinates);
  }

  saveToObject() {
    const save = {
      type: 'vertex',
      coordinates: { x: this.coordinates.x, y: this.coordinates.y },
    };
    return save;
  }
}

// Utilité d'un tel objet ?
export class MoveTo extends ShapeBuildStep {
  constructor({ x, y }) {
    super('moveTo');
    this.coordinates = { x, y };
  }

  copy() {
    return new MoveTo(this.coordinates);
  }

  saveToObject() {
    const save = {
      type: 'moveTo',
      coordinates: { x: this.coordinates.x, y: this.coordinates.y },
    };
    return save;
  }
}
