import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';

const finishShapeEnd = (points, segments, numberOfPointsRequired) => {
  if (segments.length < 4) {
    if (numberOfPointsRequired < 3)
      segments.push(
        new Segment({
          layer: 'upper',
          vertexIds: [points[1].id, points[2].id],
        }),
      );
    if (numberOfPointsRequired < 4)
      segments.push(
        new Segment({
          layer: 'upper',
          vertexIds: [points[2].id, points[3].id],
        }),
      );
  }
};

export const Square = {
  numberOfPointsRequired: 2,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    const externalAngle = (Math.PI * 2) / 4;

    const length = points[0].coordinates.dist(points[1].coordinates);

    const startAngle = points[0].coordinates.angleWith(points[1].coordinates);

    for (let i = 0; i < 2; i++) {
      const dx = length * Math.cos(startAngle - externalAngle * (i + 1));
      const dy = length * Math.sin(startAngle - externalAngle * (i + 1));
      const newCoordinates = points[i + 1].coordinates.add(
        new Coordinates({ x: dx, y: dy }),
      );
      if (points.length === i + 2) {
        points[i + 2] = new Point({
          layer: 'upper',
          coordinates: newCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
        });
      } else {
        points[i + 2].coordinates = newCoordinates;
      }
    }
    finishShapeEnd(points, segments, Square.numberOfPointsRequired);
  },
};

export const Rectangle = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      const angle = points[0].coordinates.angleWith(points[1].coordinates);
      const perpendicularAngle = angle + Math.PI / 2;
      const lines = [
        [
          points[1].coordinates,
          new Coordinates({
            x: points[1].x + Math.cos(perpendicularAngle) * 100,
            y: points[1].y + Math.sin(perpendicularAngle) * 100,
          }),
        ],
      ];
      return new GeometryConstraint('isConstrained', lines);
    },
  ],
  finishShape: (points, segments) => {
    const newCoordinates = points[2].coordinates
      .substract(points[1].coordinates)
      .add(points[0].coordinates);
    if (points.length === 3) {
      points[3] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Rectangle.numberOfPointsRequired);
  },
};

export const Losange = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      const lines = [
        [points[0].coordinates, points[0].coordinates, points[1].coordinates],
      ];
      return new GeometryConstraint('isConstrained', lines);
    },
  ],
  finishShape: (points, segments) => {
    const diagonnalCenter = points[0].coordinates.middleWith(
      points[2].coordinates,
    );
    const newCoordinates = diagonnalCenter
      .multiply(2)
      .substract(points[1].coordinates);
    if (points.length === 3) {
      points[3] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Losange.numberOfPointsRequired);
  },
};

export const Parallelogram = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    const newCoordinates = points[2].coordinates
      .substract(points[1].coordinates)
      .add(points[0].coordinates);
    if (points.length === 3) {
      points[3] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Parallelogram.numberOfPointsRequired);
  },
};

export const RightAngleTrapeze = {
  numberOfPointsRequired: 4,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      const angle = points[0].coordinates.angleWith(points[1].coordinates);
      const perpendicularAngle = angle + Math.PI / 2;
      const lines = [
        [
          points[1].coordinates,
          new Coordinates({
            x: points[1].x + Math.cos(perpendicularAngle) * 100,
            y: points[1].y + Math.sin(perpendicularAngle) * 100,
          }),
        ],
      ];
      return new GeometryConstraint('isConstrained', lines);
    },
    (points) => {
      const angle = points[1].coordinates.angleWith(points[2].coordinates);
      const perpendicularAngle = angle + Math.PI / 2;
      const lines = [
        [
          points[2].coordinates,
          new Coordinates({
            x: points[2].x + Math.cos(perpendicularAngle) * 100,
            y: points[2].y + Math.sin(perpendicularAngle) * 100,
          }),
        ],
      ];
      return new GeometryConstraint('isConstrained', lines);
    },
  ],
  finishShape: () => { },
};

export const IsoscelesTrapeze = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    const projection = segments[0].projectionOnSegment(points[2].coordinates);
    const middleOfSegment = segments[0].middle;
    const newCoordinates = points[2].coordinates
      .substract(projection.multiply(2))
      .add(middleOfSegment.multiply(2));
    if (points.length === 3) {
      points[3] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, IsoscelesTrapeze.numberOfPointsRequired);
  },
};

export const Trapeze = {
  numberOfPointsRequired: 4,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      const lines = [
        [
          points[2].coordinates,
          points[2].coordinates
            .substract(points[1].coordinates)
            .add(points[0].coordinates),
        ],
      ];
      return new GeometryConstraint('isConstrained', lines);
    },
  ],
  finishShape: () => { },
};

export const IrregularQuadrilateral = {
  numberOfPointsRequired: 4,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: () => { },
};
