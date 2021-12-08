import { Coordinates } from '../Core/Objects/Coordinates';
import { app } from '../Core/App';
import { Shape } from '../Core/Objects/Shape';

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
  });
  shape.geometryTransformationChildShapeIds.forEach(childId => {
    let child = app.upperDrawingEnvironment.findObjectById(childId);
    let parentVertexes = app.upperDrawingEnvironment.findObjectById(child.geometryTransformationParentShapeId).vertexes;
    child.vertexes.forEach((pt, idx) => {
      pt.coordinates = parentVertexes[idx].coordinates;
    });
    let axis;
    if (child.geometryTransformationName == 'orthogonalSymetry') {
      if (child.geometryTransformationCharacteristicElementIds.length == 1) {
        axis = app.upperDrawingEnvironment.findObjectById(child.geometryTransformationCharacteristicElementIds[0], 'segment');
      } else {
        let pts = child.geometryTransformationCharacteristicElementIds.map(refId =>
          app.upperDrawingEnvironment.findObjectById(refId, 'point')
        );
        let axisShape = new Shape({
          drawingEnvironment: app.invisibleDrawingEnvironment,
          path: `M ${pts[0].coordinates.x} ${pts[0].coordinates.y} L ${pts[1].coordinates.x} ${pts[1].coordinates.y}`,
          borderColor: app.settings.referenceDrawColor,
          borderSize: 2,
        });
        axis = axisShape.segments[0];
      }
      reverseShape(child, axis);
    } else if (child.geometryTransformationName == 'centralSymetry') {
      let center = app.upperDrawingEnvironment.findObjectById(child.geometryTransformationCharacteristicElementIds[0], 'point').coordinates;
      child.rotate(Math.PI, center);
    } else if (child.geometryTransformationName == 'translation') {
      let pts = child.geometryTransformationCharacteristicElementIds.map(refId =>
        app.upperDrawingEnvironment.findObjectById(refId, 'point')
      );
      child.translate(pts[1].coordinates.substract(pts[0].coordinates));
    } else if (child.geometryTransformationName == 'rotation') {
      let pts = child.geometryTransformationCharacteristicElementIds.map(refId =>
        app.upperDrawingEnvironment.findObjectById(refId, 'point')
      );
      let angle = pts[2].coordinates.angleWith(pts[1].coordinates) - pts[2].coordinates.angleWith(pts[3].coordinates);

      if (angle > Math.PI) angle -= 2 * Math.PI;
      if (angle < -Math.PI) angle += 2 * Math.PI;
      angle *= -1;

      child.rotate(angle, pts[0].coordinates);
    }
    // computeShapeTransform(child);
    computeAllShapeTransform(child);
  });
}

function reverseShape(shape, selectedAxis) {
  shape.points.forEach((pt) => {
    computePointPosition(pt, selectedAxis);
  });
}

function computePointPosition(point, selectedAxis) {
  let center = selectedAxis.projectionOnSegment(point);

  //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
  point.coordinates = point.coordinates.add(
    center.substract(point.coordinates).multiply(2),
  );
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
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
  // } else if (shape.name == 'RightAngleTrapeze') {
  //   let projection = shape.segments[0].projectionOnSegment(shape.vertexes[2].coordinates);
  //   shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
  //     .substract(projection)
  //     .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'RightAngleTrapeze2') {
    let startAngle = shape.segments[0].getAngleWithHorizontal();
    let dx = shape.constructionSpec.height * Math.cos(startAngle + Math.PI / 2);
    let dy = shape.constructionSpec.height * Math.sin(startAngle + Math.PI / 2);

    shape.vertexes[2].coordinates = shape.vertexes[1].coordinates.add(new Coordinates({x: dx, y: dy}));

    startAngle = shape.segments[1].getAngleWithHorizontal();
    dx = shape.constructionSpec.smallBaseLength * Math.cos(startAngle + Math.PI / 2);
    dy = shape.constructionSpec.smallBaseLength * Math.sin(startAngle + Math.PI / 2);

    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates.add(new Coordinates({x: dx, y: dy}));
  } else if (shape.name == 'IsoscelesTrapeze') {
    let projection = shape.segments[0].projectionOnSegment(shape.vertexes[2].coordinates);
    let middleOfSegment = shape.segments[0].middle;
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(projection.multiply(2))
      .add(middleOfSegment.multiply(2));
  } else if (shape.name == 'Trapeze') {
    let length = shape.constructionSpec.thirdSegmentLength;
    let firstSegment = shape.segments[0];
    let angle = firstSegment.getAngleWithHorizontal();
    shape.vertexes[3].coordinates = new Coordinates({
      x: shape.vertexes[2].x + length * Math.cos(angle),
      y: shape.vertexes[2].y + length * Math.sin(angle),
    });
  } else if (shape.name == 'RightAngleIsoscelesTriangle') {
    let firstSegment = shape.segments[0];
    let angle =
      firstSegment.getAngleWithHorizontal() -
      shape.constructionSpec.angle;
    let length = firstSegment.length;

    shape.vertexes[2].coordinates = new Coordinates({
      x: shape.vertexes[1].x + length * Math.cos(angle),
      y: shape.vertexes[1].y + length * Math.sin(angle),
    });
  } else if (shape.name == 'RightAngleTriangle') {
    let firstSegment = shape.segments[0];
    let angle =
      firstSegment.getAngleWithHorizontal() -
      shape.constructionSpec.angle;
    let length = shape.constructionSpec.secondSegmentLength;

    shape.vertexes[2].coordinates = new Coordinates({
      x: shape.vertexes[1].x + length * Math.cos(angle),
      y: shape.vertexes[1].y + length * Math.sin(angle),
    });
  } else if (shape.name == 'IsoscelesTriangle') {
    let firstSegment = shape.segments[0];
    let middle = firstSegment.middle;
    let angle =
      firstSegment.getAngleWithHorizontal() -
      Math.PI / 2;
    let height = shape.constructionSpec.height;

    shape.vertexes[2].coordinates = new Coordinates({
      x: middle.x + height * Math.cos(angle),
      y: middle.y + height * Math.sin(angle),
    });
  } else if (shape.name == 'ParalleleSegment') {
    let seg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let angle = seg.getAngleWithHorizontal();
    let segLength = shape.constructionSpec.segmentLength;

    shape.vertexes[1].coordinates = new Coordinates({
      x: shape.vertexes[0].coordinates.x + segLength * Math.cos(angle),
      y: shape.vertexes[0].coordinates.y + segLength * Math.sin(angle),
    });
  } else if (shape.name == 'PerpendicularSegment') {
    let seg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let angle = seg.getAngleWithHorizontal() + Math.PI / 2;
    let segLength = shape.constructionSpec.segmentLength;

    shape.vertexes[1].coordinates = new Coordinates({
      x: shape.vertexes[0].coordinates.x + segLength * Math.cos(angle),
      y: shape.vertexes[0].coordinates.y + segLength * Math.sin(angle),
    });
  } else if (shape.name == 'ParalleleSemiStraightLine') {
    let seg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let angle = seg.getAngleWithHorizontal();
    let segLength = shape.constructionSpec.segmentLength;

    shape.vertexes[1].coordinates = new Coordinates({
      x: shape.vertexes[0].coordinates.x + segLength * Math.cos(angle),
      y: shape.vertexes[0].coordinates.y + segLength * Math.sin(angle),
    });
  } else if (shape.name == 'PerpendicularSemiStraightLine') {
    let seg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let angle = seg.getAngleWithHorizontal() + Math.PI / 2;
    let segLength = shape.constructionSpec.segmentLength;

    shape.vertexes[1].coordinates = new Coordinates({
      x: shape.vertexes[0].coordinates.x + segLength * Math.cos(angle),
      y: shape.vertexes[0].coordinates.y + segLength * Math.sin(angle),
    });
  } else if (shape.name == 'ParalleleStraightLine') {
    let seg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let angle = seg.getAngleWithHorizontal();

    shape.vertexes[1].coordinates = new Coordinates({
      x: shape.vertexes[0].coordinates.x + 100 * Math.cos(angle),
      y: shape.vertexes[0].coordinates.y + 100 * Math.sin(angle),
    });
  } else if (shape.name == 'PerpendicularStraightLine') {
    let seg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let angle = seg.getAngleWithHorizontal() + Math.PI / 2;

    shape.vertexes[1].coordinates = new Coordinates({
      x: shape.vertexes[0].coordinates.x + 100 * Math.cos(angle),
      y: shape.vertexes[0].coordinates.y + 100 * Math.sin(angle),
    });
  } else if (shape.name == 'PointOnLine') {
    let ref = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    // let coord = ref.projectionOnSegment(shape.points[0].coordinates);
    // if (!ref.isCoordinatesOnSegment(coord)) {
    //   if (coord.dist(ref.vertexes[0].coordinates) < coord.dist(ref.vertexes[1].coordinates)) {
    //     coord = ref.vertexes[0].coordinates;
    //   } else {
    //     coord = ref.vertexes[1].coordinates;
    //   }
    // }

    let firstPoint = ref.vertexes[0];
    let secondPoint = ref.vertexes[1];
    firstPoint.ratio = 0;
    secondPoint.ratio = 1;

    const segLength = secondPoint.coordinates.substract(
      firstPoint.coordinates,
    );
    const part = segLength.multiply(shape.points[0].ratio);

    console.log({...shape.points[0]});

    let coord = firstPoint.coordinates.add(part);
    shape.points[0].coordinates = coord;
  } else if (shape.name == 'PointOnShape') {
    let coord = shape.points[0].coordinates;
    let ref = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'shape');
    if (ref.isCoordinatesInPath(coord) || ref.isCoordinatesOnBorder(coord)) {
      return
    }
    let projections = ref.segments.map(seg => {
      let proj = seg.projectionOnSegment(coord);
      if (!seg.isCoordinatesOnSegment(proj)) {
        if (proj.dist(seg.vertexes[0].coordinates) < proj.dist(seg.vertexes[1].coordinates)) {
          proj = seg.vertexes[0].coordinates;
        } else {
          proj = seg.vertexes[1].coordinates;
        }
      }
      let dist = proj.dist(coord);
      return {proj, dist};
    });
    projections.sort((p1, p2) => {
      return p1.dist - p2.dist
    });
    shape.points[0].coordinates = projections[0].proj;
  } else if (shape.name == 'PointOnIntersection') {
    let firstSeg = app.upperDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let secondSeg = app.upperDrawingEnvironment.findObjectById(shape.referenceId2, 'segment');
    let coord =  firstSeg.intersectionWith(secondSeg);
    shape.points[0].coordinates = coord;
  }
  shape.divisionPoints.forEach(pt => computeDivisionPoint(pt));
  if (shape.isCenterShown) {
    shape.center.coordinates = shape.centerCoordinates;
  }
  // shape.divisionPoints.forEach(pt => computeDivisionPoint(pt));
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

export function computeConstructionSpec(shape, maxIndex = 100) {
  if (shape.name == 'Rectangle') {
    let angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.height = shape.vertexes[2].coordinates.dist(shape.vertexes[1]);
    if (angle < Math.PI / 2 + .1 && angle > Math.PI / 2 - .1)
      shape.constructionSpec.height *= -1;
  } else if (shape.name == 'Losange') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
  } else if (shape.name == 'Parallelogram') {
  // } else if (shape.name == 'RightAngleTrapeze') {
  //   shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
  //   shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
  //   shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'RightAngleTrapeze2') {
    let angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.height = shape.vertexes[2].coordinates.dist(shape.vertexes[1]);
    if (Math.abs(angle - Math.PI / 2) < .1)
      shape.constructionSpec.height *= -1;

    if (maxIndex > 2) {
      angle = shape.vertexes[2].getVertexAngle();
      shape.constructionSpec.smallBaseLength = shape.vertexes[3].coordinates.dist(shape.vertexes[2]);
      if (shape.constructionSpec.height <= 0)
        shape.constructionSpec.smallBaseLength *= -1;
    }
  } else if (shape.name == 'IsoscelesTrapeze') {
    // shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    // shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    // shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'Trapeze') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
    shape.constructionSpec.thirdSegmentLength = shape.segments[2].length;
    if (Math.abs(shape.segments[0].getAngleWithHorizontal() - shape.segments[2].getAngleWithHorizontal()) > 0.1)
      shape.constructionSpec.thirdSegmentLength *= -1;
  } else if (shape.name == 'RightAngleIsoscelesTriangle') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
  } else if (shape.name == 'RightAngleTriangle') {
    shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'IsoscelesTriangle') {
    shape.constructionSpec.height = shape.segments[0].middle.dist(shape.vertexes[2].coordinates);
    if (shape.vertexes[1].getVertexAngle() > Math.PI)
      shape.constructionSpec.height *= -1;
  } else if (
    shape.name == 'ParalleleSemiStraightLine' ||
    shape.name == 'ParalleleSegment'
  ) {
    shape.constructionSpec.segmentLength = shape.segments[0].length;
    let reference = app.mainDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    if (Math.abs(reference.getAngleWithHorizontal() - shape.segments[0].getAngleWithHorizontal()) > 0.1)
      shape.constructionSpec.segmentLength *= -1;
  } else if (
    shape.name == 'PerpendicularSemiStraightLine' ||
    shape.name == 'PerpendicularSegment'
  ) {
    shape.constructionSpec.segmentLength = shape.segments[0].length;
    let reference = app.mainDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    if (Math.abs(reference.getAngleWithHorizontal() - shape.segments[0].getAngleWithHorizontal() + Math.PI / 2) > 0.1 &&
      Math.abs(reference.getAngleWithHorizontal() - shape.segments[0].getAngleWithHorizontal() + Math.PI / 2 - 2 * Math.PI) > 0.1)
      shape.constructionSpec.segmentLength *= -1;
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