import { Points } from '../Tools/points';

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
}

//Todo : Refactorer en Objet externe
export class Segment extends ShapeBuildStep {
  constructor({ x0, y0, x, y, coordinates, isArc = false, vertexes }) {
    super('segment');
    this.coordinates = coordinates || { x, y };
    this.vertexes = vertexes || [{ x: x0, y: y0 }, this.coordinates];
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

  copy() {
    let copy = new Segment(this);
    this.points.forEach(p => {
      copy.addPoint(p);
    });
    return copy;
  }

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

  /*************/
  //FIX : on ne peut pas encore les exploiter car coordonnées relatives
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
    let segmentLength = Points.dist(this.vertexes[0], this.vertexes[1]),
      dist1 = Points.dist(this.vertexes[0], point),
      dist2 = Points.dist(this.vertexes[1], point);

    if (dist1 > segmentLength || dist2 > segmentLength) return false;

    return true;
  }
  /***************************/

  setScale(size) {
    super.setScale(size);
    this.vertexes = this.vertexes.map(vertex => {
      return { x: vertex.x * size, y: vertex.y * size };
    });
    this.points.forEach(pt => {
      pt.x = pt.x * size;
      pt.y = pt.y * size;
    });
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
