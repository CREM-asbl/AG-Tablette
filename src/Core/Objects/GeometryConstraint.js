import { app } from '../App';
import { Coordinates } from './Coordinates';
import { Segment } from './Segment';
import { Shape } from './Shape';
import { Point } from './Point';

export class GeometryConstraint {
  /**
   *
   * @param {String} type         isFree (libre), isConstrained (sur des segments ou des points précis), isBlocked (bloqué par une contruction), isContructed (dessiné)
   * @param {[Coordinates]} lines pout isContructed
   * @param {[Point]} points      pout isContructed
   */
  constructor(type, lines = [], points = []) {
    this.type = type;
    this.segments = lines.map((ln) => {
      let path = '';
      if (ln.length == 2) {
        // segment de droite
        let angle = ln[0].angleWith(ln[1]);
        ln[0] = ln[0].substract({
          x: 10000 * Math.cos(angle),
          y: 10000 * Math.sin(angle),
        });
        ln[1] = ln[1].add({
          x: 10000 * Math.cos(angle),
          y: 10000 * Math.sin(angle),
        });
        path = ['M', ln[0].x, ln[0].y, 'L', ln[1].x, ln[1].y].join(' ');
      } else if (ln.length == 3) {
        // cercle
        let oppositeCoordinates = ln[2].multiply(2).substract(ln[0]),
          radius = ln[0].dist(ln[2]);
        path = ['M', ln[0].x, ln[0].y]
          .concat([
            'A',
            radius,
            radius,
            0,
            1,
            0,
            oppositeCoordinates.x,
            oppositeCoordinates.y,
          ])
          .concat(['A', radius, radius, 0, 1, 0, ln[1].x, ln[1].y])
          .join(' ');
      }
      let s = new Shape({
        drawingEnvironment: app.upperDrawingEnvironment,
        path: path,
        borderColor: app.settings.constraintsDrawColor,
        opacity: 0,
      });
      return s.segments[0];
    });
    this.points = points.map(
      (pt) =>
        new Point({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: pt,
          color: app.settings.constraintsDrawColor,
          size: 2,
        }),
    );
  }

  get isFree() {
    return this.type == 'isFree';
  }

  get isConstrained() {
    return this.type == 'isConstrained';
  }

  get isBlocked() {
    return this.type == 'isBlocked';
  }

  get isConstructed() {
    return this.type == 'isConstructed';
  }

  projectionOnConstraints(coordinates) {
    let projectionsOnContraints = this.segments
      .map((segment) => {
        let projection = segment.projectionOnSegment(coordinates);
        let dist = projection.dist(coordinates);
        return { projection: projection, dist: dist };
      })
      .concat(
        this.points.map((pt) => {
          let dist = pt.coordinates.dist(coordinates);
          return { projection: pt.coordinates, dist: dist };
        }),
      );
    projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
    return projectionsOnContraints[0].projection;
  }
}
