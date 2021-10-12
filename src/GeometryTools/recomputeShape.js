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
          console.log('wrong shape')
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
  } else if (shape.name == 'Rectangle') {
    let startAngle = shape.segments[0].getAngleWithHorizontal();
    let dx = shape.constructionSpec.height * Math.cos(startAngle + Math.PI / 2);
    let dy = shape.constructionSpec.height * Math.sin(startAngle + Math.PI / 2);

    shape.vertexes[2].coordinates = shape.vertexes[1].coordinates.add(new Coordinates({x: dx, y: dy}));
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
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

export function computeConstructionSpec(shape) {
  if (shape.name == 'Rectangle') {
    shape.constructionSpec.height = shape.vertexes[2].coordinates.dist(shape.vertexes[1]);
    let firstAngle = shape.vertexes[0].coordinates.angleWith(shape.vertexes[1].coordinates);
    let secondAngle = shape.vertexes[1].coordinates.angleWith(shape.vertexes[2].coordinates);
    if (secondAngle > firstAngle)
      firstAngle += 2 * Math.PI;
    if (firstAngle - secondAngle < Math.PI / 2 + .1 && firstAngle - secondAngle > Math.PI / 2 - .1)
      shape.constructionSpec.height *= -1;
  }
}

export function projectionOnConstraints(coordinates, constraints) {
  let projectionsOnContraints = constraints.lines
    .map((line) => {
      let projection = line.segment.projectionOnSegment(coordinates);
      let dist = projection.dist(coordinates);
      return { projection: projection, dist: dist };
    })
    .concat(
      constraints.points.map((pt) => {
        let dist = pt.dist(coordinates);
        return { projection: pt, dist: dist };
      }),
    );
  projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
  return projectionsOnContraints[0].projection;
}