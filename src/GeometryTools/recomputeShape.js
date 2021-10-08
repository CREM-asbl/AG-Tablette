import { Coordinates } from '../Core/Objects/Coordinates';
import { app } from '../Core/App';

export function computeAllShapeTransform(shape) {
  if (app.environment.name != 'Geometrie') return;
  shape.hasGeometryReferenced.forEach(ref => {
    let sRef = app.upperDrawingEnvironment.findObjectById(ref);
    sRef.points.forEach(pt => {
      if (pt.reference) {
        let ptRef = app.upperDrawingEnvironment.findObjectById(pt.reference, 'point');
        if (!ptRef || ptRef.shape.id != shape.id) {
        } else {
          pt.coordinates = new Coordinates(ptRef.coordinates);
        }
      }
    })
    computeShapeTransform(sRef);
    computeAllShapeTransform(sRef);
  })
}

export function computeShapeTransform(shape) {
  if (app.environment.name != 'Geometrie') return;
  if (shape.familyName == 'Regular') {
    let externalAngle = (Math.PI * 2) / shape.segments.length;
    if (shape.isReversed) {
      externalAngle *= -1;
    }
    let v1 = shape.segments[0].vertexes[0].coordinates;
    let v2 = shape.segments[0].vertexes[1].coordinates;

    let length = v1.dist(v2);
    let startAngle = Math.atan2(-(v1.y - v2.y), -(v1.x - v2.x));

    for (let i = 2; i < shape.vertexes.length; i++) {
      let dx = length * Math.cos(startAngle - (i - 1) * externalAngle);
      let dy = length * Math.sin(startAngle - (i - 1) * externalAngle);

      let coord = shape.vertexes[i - 1].coordinates.add(new Coordinates({x: dx, y: dy}));

      shape.vertexes[i].coordinates = coord;
    }
  }
  shape.divisionPoints.forEach(pt => computeDivisionPoint(pt));
}

export function computeDivisionPoint(point) {
  if (app.environment.name != 'Geometrie') return;
  let segment = point.segments[0];
  let firstPoint = segment.vertexes[0];
  let secondPoint = segment.vertexes[1];
  firstPoint.ratio = 0;
  secondPoint.ratio = 1;

  if (firstPoint.ratio > secondPoint.ratio)
    [firstPoint, secondPoint] = [secondPoint, firstPoint];

  const segLength = secondPoint.coordinates.substract(
    firstPoint.coordinates,
  );
  const part = segLength.multiply(point.ratio);

  point.coordinates = firstPoint.coordinates.add(part);
}