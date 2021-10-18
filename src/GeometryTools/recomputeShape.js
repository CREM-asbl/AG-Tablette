import { Coordinates } from '../Core/Objects/Coordinates';
import { app } from '../Core/App';

export function computeAllShapeTransform(shape) {
  if (app.environment.name != 'Geometrie') return;
  shape.hasGeometryReferenced.forEach(ref => {
    let sRef = app.upperDrawingEnvironment.findObjectById(ref);
    let ptsMoved = [];
    sRef.points.forEach(pt => {
      if (pt.reference) {
        let ptRef = app.upperDrawingEnvironment.findObjectById(pt.reference, 'point');
        if (!ptRef || ptRef.shape.id != shape.id) {
        } else {
          pt.coordinates = new Coordinates(ptRef.coordinates);
          ptsMoved.push(pt.idx);
        }
      }
    })
    computeShapeTransform(sRef, ptsMoved);
    computeAllShapeTransform(sRef);
  })
}

export function computeShapeTransform(shape, ptsMoved) {
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
  } else if (shape.name == 'Losange') {
    let firstSegment = shape.segments[0];
    let angle =
      firstSegment.getAngleWithHorizontal() -
      shape.constructionSpec.angle;
    let length = firstSegment.length;

    shape.vertexes[2].coordinates = new Coordinates({
      x: shape.vertexes[1].x + length * Math.cos(angle),
      y: shape.vertexes[1].y + length * Math.sin(angle),
    });
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'Parallelogram') {
    if (ptsMoved.includes(0) && ptsMoved.includes(2)) {
      let l = shape.vertexes[0].coordinates.dist(shape.vertexes[2].coordinates);
      let fsl = shape.constructionSpec.firstSegmentLength;
      let a = Math.PI - shape.constructionSpec.angle;
      let b = Math.asin(fsl / l * Math.sin(a));
      let c = Math.PI - a - b;
      let refAngle = shape.vertexes[0].coordinates.angleWith(shape.vertexes[2].coordinates);
      let resultAngle = c + refAngle;
      shape.vertexes[1].coordinates = new Coordinates({
        x: shape.vertexes[0].x + fsl * Math.cos(resultAngle),
        y: shape.vertexes[0].y + fsl * Math.sin(resultAngle),
      });
    } else if (ptsMoved.includes(2)) {
      let secondSegment = shape.segments[1];
      let angle =
        secondSegment.getAngleWithHorizontal() +
        shape.constructionSpec.angle - Math.PI;
      let length = shape.constructionSpec.firstSegmentLength;

      shape.vertexes[0].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    } else if (shape.vertexes[2].reference == null) {
      let firstSegment = shape.segments[0];
      let angle =
        firstSegment.getAngleWithHorizontal() -
        shape.constructionSpec.angle;
      let length = shape.constructionSpec.secondSegmentLength;

      shape.vertexes[2].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    }
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'RightAngleTrapeze') {
    if (ptsMoved.includes(0) && ptsMoved.includes(2)) {
      let l = shape.vertexes[0].coordinates.dist(shape.vertexes[2].coordinates);
      let fsl = shape.constructionSpec.firstSegmentLength;
      let a = Math.PI - shape.constructionSpec.angle;
      let b = Math.asin(fsl / l * Math.sin(a));
      let c = Math.PI - a - b;
      let refAngle = shape.vertexes[0].coordinates.angleWith(shape.vertexes[2].coordinates);
      let resultAngle = c + refAngle;
      shape.vertexes[1].coordinates = new Coordinates({
        x: shape.vertexes[0].x + fsl * Math.cos(resultAngle),
        y: shape.vertexes[0].y + fsl * Math.sin(resultAngle),
      });
    } else if (ptsMoved.includes(2)) {
      let secondSegment = shape.segments[1];
      let angle =
        secondSegment.getAngleWithHorizontal() +
        shape.constructionSpec.angle - Math.PI;
      let length = shape.constructionSpec.firstSegmentLength;

      shape.vertexes[0].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    } else if (shape.vertexes[2].reference == null) {
      let firstSegment = shape.segments[0];
      let angle =
        firstSegment.getAngleWithHorizontal() -
        shape.constructionSpec.angle;
      let length = shape.constructionSpec.secondSegmentLength;

      shape.vertexes[2].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    }
    let projection = shape.segments[0].projectionOnSegment(shape.vertexes[2].coordinates);
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(projection)
      .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'IsoscelesTrapeze') {
    if (ptsMoved.includes(0) && ptsMoved.includes(2)) {
      let l = shape.vertexes[0].coordinates.dist(shape.vertexes[2].coordinates);
      let fsl = shape.constructionSpec.firstSegmentLength;
      let a = Math.PI - shape.constructionSpec.angle;
      let b = Math.asin(fsl / l * Math.sin(a));
      let c = Math.PI - a - b;
      let refAngle = shape.vertexes[0].coordinates.angleWith(shape.vertexes[2].coordinates);
      let resultAngle = c + refAngle;
      shape.vertexes[1].coordinates = new Coordinates({
        x: shape.vertexes[0].x + fsl * Math.cos(resultAngle),
        y: shape.vertexes[0].y + fsl * Math.sin(resultAngle),
      });
    } else if (ptsMoved.includes(2)) {
      let secondSegment = shape.segments[1];
      let angle =
        secondSegment.getAngleWithHorizontal() +
        shape.constructionSpec.angle - Math.PI;
      let length = shape.constructionSpec.firstSegmentLength;

      shape.vertexes[0].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    } else if (shape.vertexes[2].reference == null) {
      let firstSegment = shape.segments[0];
      let angle =
        firstSegment.getAngleWithHorizontal() -
        shape.constructionSpec.angle;
      let length = shape.constructionSpec.secondSegmentLength;

      shape.vertexes[2].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    }
    let projection = shape.segments[0].projectionOnSegment(shape.vertexes[2].coordinates);
    let middleOfSegment = shape.segments[0].middle;
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(projection.multiply(2))
      .add(middleOfSegment.multiply(2));
  } else if (shape.name == 'Trapeze') {
    // if (ptsMoved.includes(0) && ptsMoved.includes(2)) {
    //   let l = shape.vertexes[0].coordinates.dist(shape.vertexes[2].coordinates);
    //   let fsl = shape.constructionSpec.firstSegmentLength;
    //   let a = Math.PI - shape.constructionSpec.angle;
    //   let b = Math.asin(fsl / l * Math.sin(a));
    //   let c = Math.PI - a - b;
    //   let refAngle = shape.vertexes[0].coordinates.angleWith(shape.vertexes[2].coordinates);
    //   let resultAngle = c + refAngle;
    //   shape.vertexes[1].coordinates = new Coordinates({
    //     x: shape.vertexes[0].x + fsl * Math.cos(resultAngle),
    //     y: shape.vertexes[0].y + fsl * Math.sin(resultAngle),
    //   });
    // } else if (ptsMoved.includes(2)) {
    //   let secondSegment = shape.segments[1];
    //   let angle =
    //     secondSegment.getAngleWithHorizontal() +
    //     shape.constructionSpec.angle - Math.PI;
    //   let length = shape.constructionSpec.firstSegmentLength;

    //   shape.vertexes[0].coordinates = new Coordinates({
    //     x: shape.vertexes[1].x + length * Math.cos(angle),
    //     y: shape.vertexes[1].y + length * Math.sin(angle),
    //   });
    // } else
    // if (shape.vertexes[2].reference == null) {
      let firstSegment = shape.segments[0];
      let angle =
        firstSegment.getAngleWithHorizontal() -
        shape.constructionSpec.angle;
      let length = shape.constructionSpec.secondSegmentLength;

      shape.vertexes[2].coordinates = new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      });
    // }
    length = shape.constructionSpec.thirdSegmentLength;
    angle = firstSegment.getAngleWithHorizontal();
    shape.vertexes[3].coordinates = new Coordinates({
      x: shape.vertexes[2].x + length * Math.cos(angle),
      y: shape.vertexes[2].y + length * Math.sin(angle),
    });
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
    let angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.height = shape.vertexes[2].coordinates.dist(shape.vertexes[1]);
    if (angle < Math.PI / 2 + .1 && angle > Math.PI / 2 - .1)
      shape.constructionSpec.height *= -1;
  } else if (shape.name == 'Losange') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
  } else if (shape.name == 'Parallelogram') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'RightAngleTrapeze') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'IsoscelesTrapeze') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'Trapeze') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
    shape.constructionSpec.thirdSegmentLength = shape.segments[2].length;
    if (Math.abs(shape.segments[0].getAngleWithHorizontal() - shape.segments[2].getAngleWithHorizontal()) > 0.1)
      shape.constructionSpec.thirdSegmentLength *= -1;
  }
}

export function projectionOnConstraints(coordinates, constraints) {
  if (constraints.isFree)
    return coordinates;
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