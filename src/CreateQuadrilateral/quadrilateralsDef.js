import { GeometryConstraint } from '../Core/Objects/GeometryConstraint';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Segment } from '../Core/Objects/Segment';
import { Point } from '../Core/Objects/Point';
import { app } from '../Core/App';

const finishShapeEnd = (points, segments, numberOfPointsRequired) => {
  if (segments.length < 4) {
    if (numberOfPointsRequired < 3)
      segments.push(
        new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          vertexIds: [points[1].id, points[2].id],
        }),
      );
    if (numberOfPointsRequired < 4)
      segments.push(
        new Segment({
          drawingEnvironment: app.upperDrawingEnvironment,
          vertexIds: [points[2].id, points[3].id],
        }),
      );
  }
}

export const Square = {
  numberOfPointsRequired: 2,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    let externalAngle = (Math.PI * 2) / 4;

    let length = points[0].coordinates.dist(points[1].coordinates);

    let startAngle = points[0].coordinates.angleWith(
      points[1].coordinates,
    );

    for (let i = 0; i < 2; i++) {
      let dx = length * Math.cos(startAngle - externalAngle * (i + 1));
      let dy = length * Math.sin(startAngle - externalAngle * (i + 1));
      let newCoordinates = points[i + 1].coordinates.add(
        new Coordinates({ x: dx, y: dy }),
      );
      if (points.length == i + 2) {
        points[i + 2] = new Point({
          drawingEnvironment: app.upperDrawingEnvironment,
          coordinates: newCoordinates,
          color: app.settings.temporaryDrawColor,
          size: 2,
        });
      } else {
        points[i + 2].coordinates = newCoordinates;
      }
    }
    finishShapeEnd(points, segments, Square.numberOfPointsRequired);
  }
}

export const Rectangle = {
  numberOfPointsRequired: 3,
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
      return new GeometryConstraint('isContrained', lines);
    }
  ],
  finishShape: (points, segments) => {
    let newCoordinates = points[2].coordinates
      .substract(points[1].coordinates)
      .add(points[0].coordinates);
    if (points.length == 3) {
      points[3] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Rectangle.numberOfPointsRequired);
  }
}

export const Losange = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      let lines = [
        [
          points[0].coordinates,
          points[0].coordinates,
          points[1].coordinates,
        ],
      ];
      return new GeometryConstraint('isContrained', lines);
    }
  ],
  finishShape: (points, segments) => {
    let diagonnalCenter = points[0].coordinates.middleWith(
      points[2].coordinates,
    );
    let newCoordinates = diagonnalCenter
      .multiply(2)
      .substract(points[1].coordinates);
    if (points.length == 3) {
      points[3] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Losange.numberOfPointsRequired);
  }
}

export const Parallelogram = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    let newCoordinates = points[2].coordinates
      .substract(points[1].coordinates)
      .add(points[0].coordinates);
    if (points.length == 3) {
      points[3] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Losange.numberOfPointsRequired);
  }
}

export const RightAngleTrapeze = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    let projection = segments[0].projectionOnSegment(
      points[2].coordinates,
    );
    let newCoordinates = points[2].coordinates
      .substract(projection)
      .add(points[0].coordinates);
    if (points.length == 3) {
      points[3] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Losange.numberOfPointsRequired);
  }
}

export const IsoscelesTrapeze = {
  numberOfPointsRequired: 3,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: (points, segments) => {
    let projection = segments[0].projectionOnSegment(
      points[2].coordinates,
    );
    let middleOfSegment = segments[0].middle;
    let newCoordinates = points[2].coordinates
      .substract(projection.multiply(2))
      .add(middleOfSegment.multiply(2));
    if (points.length == 3) {
      points[3] = new Point({
        drawingEnvironment: app.upperDrawingEnvironment,
        coordinates: newCoordinates,
        color: app.settings.temporaryDrawColor,
        size: 2,
      });
    } else {
      points[3].coordinates = newCoordinates;
    }
    finishShapeEnd(points, segments, Losange.numberOfPointsRequired);
  }
}

export const Trapeze = {
  numberOfPointsRequired: 4,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    (points) => {
      let lines = [
        [
          points[2].coordinates,
          points[2].coordinates
            .substract(points[1].coordinates)
            .add(points[0].coordinates),
        ],
      ];
      return new GeometryConstraint('isContrained', lines);
    }
  ],
  finishShape: () => {}
}

export const IrregularQuadrilateral = {
  numberOfPointsRequired: 4,
  constraints: [
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
    () => new GeometryConstraint('isFree'),
  ],
  finishShape: () => {}
}