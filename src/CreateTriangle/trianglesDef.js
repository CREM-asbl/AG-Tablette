import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';

export const EquilateralTriangle = {
  numberOfPointsToRequired: 2,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    let externalAngle = (Math.PI * 2) / 3;

    let length = points[0].coordinates.dist(points[1].coordinates);

    let startAngle = points[0].coordinates.angleWith(
      points[1].coordinates,
    );

    let dx = length * Math.cos(startAngle - externalAngle);
    let dy = length * Math.sin(startAngle - externalAngle);

    let newCoordinates = points[1].coordinates.add(
      new Coordinates({ x: dx, y: dy }),
    );

    if (points.length == 2) {
      points[2] = new Point({
        layer: 'upper',
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[2].coordinates = newCoordinates;
    }

    if (segments.length == 1) {
      segments.push(
        new Segment({
          layer: 'upper',
          vertexIds: [points[1].id, points[2].id],
        }),
      );
    }
  }
}

export const RightAngleIsoscelesTriangle = {
  numberOfPointsToRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      let angle = points[0].coordinates.angleWith(
        points[1].coordinates,
      );
      let length = points[0].coordinates.dist(
        points[1].coordinates,
      );
      let perpendicularAngle = angle + Math.PI / 2;
      let constraintsPoints = [
        points[1].coordinates.add(
          new Coordinates({
            x: Math.cos(perpendicularAngle) * length,
            y: Math.sin(perpendicularAngle) * length,
          }),
        ),
        points[1].coordinates.substract(
          new Coordinates({
            x: Math.cos(perpendicularAngle) * length,
            y: Math.sin(perpendicularAngle) * length,
          }),
        ),
      ];
      return new GeometryConstraint('isConstrained', [], constraintsPoints);
    }
  ],
  finishShape: () => {},
}

export const RightAngleTriangle = {
  numberOfPointsToRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      let angle = points[0].coordinates.angleWith(
        points[1].coordinates,
      );
      let perpendicularAngle = angle + Math.PI / 2;
      let lines = [
        [
          points[1].coordinates,
          new Coordinates({
            x: points[1].x + Math.cos(perpendicularAngle) * 100,
            y: points[1].y + Math.sin(perpendicularAngle) * 100,
          }),
        ],
      ];
      return new GeometryConstraint('isConstrained', lines);
    }
  ],
  finishShape: () => {},
}

export const IsoscelesTriangle = {
  numberOfPointsToRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      let angle = points[0].coordinates.angleWith(
        points[1].coordinates,
      );
      let middle = points[0].coordinates.middleWith(
        points[1].coordinates,
      );
      let perpendicularAngle = angle + Math.PI / 2;
      let lines = [
        [
          middle,
          new Coordinates({
            x: middle.x + Math.cos(perpendicularAngle) * 100,
            y: middle.y + Math.sin(perpendicularAngle) * 100,
          }),
        ],
      ];
      return new GeometryConstraint('isConstrained', lines);
    }
  ],
  finishShape: () => {},
}

export const IrregularTriangle = {
  numberOfPointsToRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: () => {},
}
