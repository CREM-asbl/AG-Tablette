import { snapCoordinatesToGrid } from '../../utils/gridSnapping';
import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { findObjectById, mod } from '../Core/Tools/general';

export function computeAllShapeTransform(
  shape,
  layer = 'upper',
  includeChildren = true,
  includePointOnIntersection = true,
) {
  if (app.environment.name != 'Geometrie') return;
  if (includeChildren) {
    shape.geometryObject.geometryChildShapeIds.forEach((ref) => {
      const sRef = findObjectById(ref);
      if (!sRef) {
        console.info('child not found');
        return;
      }
      computeShapeTransform(sRef, layer);
      computeAllShapeTransform(sRef, layer);
    });
  } else if (includePointOnIntersection) {
    shape.geometryObject.geometryChildShapeIds.forEach((ref) => {
      const sRef = findObjectById(ref);
      if (!sRef) {
        console.info('child not found');
        return;
      }
      if (sRef.name == 'PointOnIntersection') {
        computeShapeTransform(sRef, layer);
        computeAllShapeTransform(sRef, layer);
      }
    });
  }

  shape.geometryObject.geometryTransformationChildShapeIds.forEach(
    (childId) => {
      const child = findObjectById(childId);
      computeShapeTransform(child);
      computeAllShapeTransform(child, layer);
    },
  );
  if (includeChildren) {
    shape.geometryObject.geometryDuplicateChildShapeIds.forEach((childId) => {
      const child = findObjectById(childId);
      computeShapeTransform(child);
      computeAllShapeTransform(child, layer);
    });
    shape.geometryObject.geometryMultipliedChildShapeIds.forEach((childId) => {
      const child = findObjectById(childId);
      computeShapeTransform(child);
      computeAllShapeTransform(child, layer);
    });
  }
}

function reverseShape(shape, selectedAxis) {
  shape.points.forEach((pt) => {
    computePointPosition(pt, selectedAxis);
  });
}

function computePointPosition(point, selectedAxis) {
  const center = selectedAxis.projectionOnSegment(point);

  //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
  point.coordinates = point.coordinates.add(
    center.substract(point.coordinates).multiply(2),
  );
}

export function computeShapeTransform(shape, layer = 'upper') {
  if (app.environment.name != 'Geometrie') return;

  if (shape.geometryObject.geometryTransformationParentShapeId) {
    computeTransformShape(shape);
    return;
  } else if (shape.geometryObject.geometryDuplicateParentShapeId) {
    computeDuplicateShape(shape);
    return;
  } else if (shape.geometryObject.geometryMultipliedParentShapeId) {
    computeDuplicateShape(shape);
    return;
  }

  computeLinkedShape(shape);

  if (shape.familyName == 'Regular') {
    let externalAngle = (Math.PI * 2) / shape.segments.length;
    if (shape.isReversed) {
      externalAngle *= -1;
    }
    const v1 = shape.segments[0].vertexes[0].coordinates;
    const v2 = shape.segments[0].vertexes[1].coordinates;

    const length = v1.dist(v2);
    const startAngle = Math.atan2(-(v1.y - v2.y), -(v1.x - v2.x));

    for (let i = 2; i < shape.vertexes.length; i++) {
      const dx = length * Math.cos(startAngle - (i - 1) * externalAngle);
      const dy = length * Math.sin(startAngle - (i - 1) * externalAngle);

      const coord = shape.vertexes[i - 1].coordinates.add(
        new Coordinates({ x: dx, y: dy }),
      );

      shape.vertexes[i].coordinates = snapCoordinatesToGrid(coord);
    }
  } else if (shape.name == 'Rectangle') {
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'Losange') {
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'Parallelogram') {
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(shape.vertexes[1].coordinates)
      .add(shape.vertexes[0].coordinates);
  } else if (shape.name == 'RightAngleTrapeze') {
  } else if (shape.name == 'IsoscelesTrapeze') {
    const projection = shape.segments[0].projectionOnSegment(
      shape.vertexes[2].coordinates,
    );
    const middleOfSegment = shape.segments[0].middle;
    shape.vertexes[3].coordinates = shape.vertexes[2].coordinates
      .substract(projection.multiply(2))
      .add(middleOfSegment.multiply(2));
  } else if (shape.name == 'Trapeze') {
  } else if (shape.name == 'RightAngleIsoscelesTriangle') {
    const firstSegment = shape.segments[0];
    const angle =
      firstSegment.getAngleWithHorizontal() -
      shape.geometryObject.geometryConstructionSpec.angle;
    const length = firstSegment.length;

    shape.vertexes[2].coordinates = snapCoordinatesToGrid(
      new Coordinates({
        x: shape.vertexes[1].x + length * Math.cos(angle),
        y: shape.vertexes[1].y + length * Math.sin(angle),
      }),
    );
  } else if (shape.name == 'RightAngleTriangle') {
  } else if (shape.name == 'IsoscelesTriangle') {
  } else if (shape.name == 'ParalleleSegment') {
  } else if (shape.name == 'PerpendicularSegment') {
  } else if (shape.name == 'SemiStraightLine') {
    const newValue = !shape.vertexes[0].coordinates.equal(
      shape.vertexes[1].coordinates,
      0.1,
    );
    if (newValue != shape.geometryObject.geometryIsVisibleByChoice) {
      shape.geometryObject.geometryIsVisibleByChoice = newValue;
      recomputeAllVisibilities(layer);
    }
  } else if (shape.name == 'ParalleleSemiStraightLine') {
  } else if (shape.name == 'PerpendicularSemiStraightLine') {
  } else if (shape.name == 'StraightLine') {
    const newValue = !shape.vertexes[0].coordinates.equal(
      shape.vertexes[1].coordinates,
      0.1,
    );
    if (newValue != shape.geometryObject.geometryIsVisibleByChoice) {
      shape.geometryObject.geometryIsVisibleByChoice = newValue;
      recomputeAllVisibilities(layer);
    }
  } else if (shape.name == 'ParalleleStraightLine') {
    const seg = findObjectById(shape.geometryObject.geometryParentObjectId1);
    const angle = seg.getAngleWithHorizontal();

    shape.vertexes[1].coordinates = snapCoordinatesToGrid(
      new Coordinates({
        x: shape.vertexes[0].coordinates.x + 100 * Math.cos(angle),
        y: shape.vertexes[0].coordinates.y + 100 * Math.sin(angle),
      }),
    );
  } else if (shape.name == 'PerpendicularStraightLine') {
    const seg = findObjectById(shape.geometryObject.geometryParentObjectId1);
    let angle = seg.getAngleWithHorizontal() + Math.PI / 2;
    if (shape.isReversed) angle += Math.PI;

    shape.vertexes[1].coordinates = snapCoordinatesToGrid(
      new Coordinates({
        x: shape.vertexes[0].coordinates.x + 100 * Math.cos(angle),
        y: shape.vertexes[0].coordinates.y + 100 * Math.sin(angle),
      }),
    );
  } else if (shape.name == 'Strip') {
    const seg = shape.segments[0];
    const angle = seg.getAngleWithHorizontal();

    shape.vertexes[3].coordinates = snapCoordinatesToGrid(
      new Coordinates({
        x: shape.vertexes[2].coordinates.x + 100 * Math.cos(angle),
        y: shape.vertexes[2].coordinates.y + 100 * Math.sin(angle),
      }),
    );
  } else if (shape.name == 'PointOnLine') {
    const ref = findObjectById(shape.geometryObject.geometryParentObjectId1);
    const point = shape.points[0];

    let coord;
    if (ref.shape.name == 'Circle') {
      const refShape = ref.shape;
      const angle =
        refShape.segments[0].arcCenter.coordinates.angleWith(
          refShape.vertexes[0].coordinates,
        ) +
        shape.points[0].ratio * Math.PI * 2;
      coord = refShape.segments[0].arcCenter.coordinates.add({
        x: refShape.segments[0].radius * Math.cos(angle),
        y: refShape.segments[0].radius * Math.sin(angle),
      });
    } else if (ref.isArc()) {
      const firstAngle = ref.arcCenter.coordinates.angleWith(
        ref.vertexes[0].coordinates,
      );
      let secondAngle = ref.arcCenter.coordinates.angleWith(
        ref.vertexes[1].coordinates,
      );
      if (secondAngle <= firstAngle) {
        secondAngle += Math.PI * 2;
      }
      let newAngle = firstAngle + point.ratio * (secondAngle - firstAngle);
      if (ref.counterclockwise) {
        newAngle =
          firstAngle - point.ratio * (2 * Math.PI - secondAngle + firstAngle);
      }
      coord = new Coordinates({
        x: ref.arcCenter.coordinates.x + ref.radius * Math.cos(newAngle),
        y: ref.arcCenter.coordinates.y + ref.radius * Math.sin(newAngle),
      });
    } else {
      const firstPoint = ref.vertexes[0];
      const secondPoint = ref.vertexes[1];
      const segLength = secondPoint.coordinates.substract(
        firstPoint.coordinates,
      );
      const part = segLength.multiply(point.ratio);

      coord = firstPoint.coordinates.add(part);
    }
    shape.points[0].coordinates = snapCoordinatesToGrid(coord);
    ref.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
  } else if (shape.name == 'PointOnShape') {
    const coord = shape.points[0].coordinates;
    const ref = findObjectById(shape.geometryObject.geometryParentObjectId1);
    if (ref.isCoordinatesInPath(coord) || ref.isCoordinatesOnBorder(coord)) {
      return;
    }
    const projections = ref.segments.map((seg) => {
      let proj = seg.projectionOnSegment(coord);
      if (!seg.isCoordinatesOnSegment(proj)) {
        if (
          proj.dist(seg.vertexes[0].coordinates) <
          proj.dist(seg.vertexes[1].coordinates)
        ) {
          proj = seg.vertexes[0].coordinates;
        } else {
          proj = seg.vertexes[1].coordinates;
        }
      }
      const dist = proj.dist(coord);
      return { proj, dist };
    });
    projections.sort((p1, p2) => {
      return p1.dist - p2.dist;
    });
    shape.points[0].coordinates = snapCoordinatesToGrid(projections[0].proj);
  } else if (shape.name == 'PointOnIntersection') {
    const firstSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    const secondSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId2,
    );
    const coords = firstSeg.intersectionWith(secondSeg);
    const newValue = !!coords;
    if (newValue != shape.geometryObject.geometryIsVisibleByChoice) {
      shape.geometryObject.geometryIsVisibleByChoice = newValue;
      recomputeAllVisibilities(layer);
    }
    if (shape.geometryObject.geometryIsVisible == false) return;

    if (coords.length == 1)
      coords[1] = new Coordinates({ x: coords[0].x, y: coords[0].y });
    const lastCoords = shape.points.map((pt) => pt.coordinates);
    const mustInvertCoord =
      lastCoords[0].dist(coords[0]) + lastCoords[1].dist(coords[1]) >
      lastCoords[0].dist(coords[1]) + lastCoords[1].dist(coords[0]);
    if (mustInvertCoord) coords.reverse();
    shape.points.forEach(
      (pt, idx) => (pt.coordinates = snapCoordinatesToGrid(coords[idx])),
    );
    firstSeg.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
    secondSeg.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
  } else if (shape.name == 'PointOnIntersection2') {
    const firstSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    const secondSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId2,
    );
    const coords = firstSeg.intersectionWith(secondSeg, 0.001);
    const newValue = !!coords;
    if (newValue != shape.geometryObject.geometryIsVisibleByChoice) {
      shape.geometryObject.geometryIsVisibleByChoice = newValue;
      recomputeAllVisibilities(layer);
    }
    if (shape.geometryObject.geometryIsVisible == false) return;

    if (coords.length == 1)
      coords[1] = new Coordinates({ x: coords[0].x, y: coords[0].y });
    const lastCoords = shape.points.map((pt) => pt.coordinates);
    const mustInvertCoord =
      lastCoords[0].dist(coords[0]) > lastCoords[0].dist(coords[1]);
    if (mustInvertCoord) coords.reverse();
    shape.points.forEach(
      (pt, idx) => (pt.coordinates = snapCoordinatesToGrid(coords[idx])),
    );
    firstSeg.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
    secondSeg.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
  } else if (shape.name == 'CirclePart') {
  } else if (shape.name == 'CircleArc') {
  } else if (shape.name == '30degreesArc') {
    let angle =
      shape.segments[0].arcCenter.coordinates.angleWith(
        shape.vertexes[0].coordinates,
      ) +
      Math.PI / 6;
    if (shape.isReversed)
      angle =
        shape.segments[0].arcCenter.coordinates.angleWith(
          shape.vertexes[0].coordinates,
        ) -
        Math.PI / 6;
    const radius = shape.segments[0].arcCenter.coordinates.dist(
      shape.vertexes[0].coordinates,
    );
    const thirdPointCoordinates = new Coordinates({
      x: shape.segments[0].arcCenter.coordinates.x + Math.cos(angle) * radius,
      y: shape.segments[0].arcCenter.coordinates.y + Math.sin(angle) * radius,
    });
    shape.vertexes[1].coordinates = snapCoordinatesToGrid(
      thirdPointCoordinates,
    );
  } else if (shape.name == '45degreesArc') {
    let angle =
      shape.segments[0].arcCenter.coordinates.angleWith(
        shape.vertexes[0].coordinates,
      ) +
      Math.PI / 4;
    if (shape.isReversed)
      angle =
        shape.segments[0].arcCenter.coordinates.angleWith(
          shape.vertexes[0].coordinates,
        ) -
        Math.PI / 4;
    const radius = shape.segments[0].arcCenter.coordinates.dist(
      shape.vertexes[0].coordinates,
    );
    const thirdPointCoordinates = new Coordinates({
      x: shape.segments[0].arcCenter.coordinates.x + Math.cos(angle) * radius,
      y: shape.segments[0].arcCenter.coordinates.y + Math.sin(angle) * radius,
    });
    shape.vertexes[1].coordinates = snapCoordinatesToGrid(
      thirdPointCoordinates,
    );
  }

  shape.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
  if (shape.isCenterShown) {
    shape.center.coordinates = shape.centerCoordinates;
  }
}

function getPositionWithRatio(point, referenceSegment) {
  let coord;
  if (referenceSegment.shape.name == 'Circle') {
    const refShape = referenceSegment.shape;
    const angle =
      refShape.segments[0].arcCenter.coordinates.angleWith(
        refShape.vertexes[0].coordinates,
      ) +
      shape.points[0].ratio * Math.PI * 2;
    coord = refShape.segments[0].arcCenter.coordinates.add({
      x: refShape.segments[0].radius * Math.cos(angle),
      y: refShape.segments[0].radius * Math.sin(angle),
    });
  } else if (referenceSegment.isArc()) {
    const firstAngle = referenceSegment.arcCenter.coordinates.angleWith(
      referenceSegment.vertexes[0].coordinates,
    );
    let secondAngle = referenceSegment.arcCenter.coordinates.angleWith(
      referenceSegment.vertexes[1].coordinates,
    );
    if (secondAngle <= firstAngle) {
      secondAngle += Math.PI * 2;
    }
    let newAngle = firstAngle + point.ratio * (secondAngle - firstAngle);
    if (referenceSegment.counterclockwise) {
      newAngle =
        firstAngle - point.ratio * (2 * Math.PI - secondAngle + firstAngle);
    }
    coord = new Coordinates({
      x:
        referenceSegment.arcCenter.coordinates.x +
        referenceSegment.radius * Math.cos(newAngle),
      y:
        referenceSegment.arcCenter.coordinates.y +
        referenceSegment.radius * Math.sin(newAngle),
    });
  } else {
    const firstPoint = referenceSegment.vertexes[0];
    const secondPoint = referenceSegment.vertexes[1];
    const segLength = secondPoint.coordinates.substract(firstPoint.coordinates);
    const part = segLength.multiply(point.ratio);

    coord = firstPoint.coordinates.add(part);
  }
  return coord;
}

export function getRatioWithPosition(point, referenceSegment) {
  let ratio;
  if (referenceSegment.shape.name == 'Circle') {
    const angle = referenceSegment.arcCenter.coordinates.angleWith(
      point.coordinates,
    );
    const refAngle = referenceSegment.arcCenter.coordinates.angleWith(
      referenceSegment.vertexes[0].coordinates,
    );
    ratio = (angle - refAngle) / Math.PI / 2;
    if (ratio < 0) ratio += 1;
  } else if (referenceSegment.isArc()) {
    let angle = referenceSegment.arcCenter.coordinates.angleWith(
      point.coordinates,
    );
    let firstAngle = referenceSegment.arcCenter.coordinates.angleWith(
      referenceSegment.vertexes[0].coordinates,
    );
    let secondAngle = referenceSegment.arcCenter.coordinates.angleWith(
      referenceSegment.vertexes[1].coordinates,
    );
    if (referenceSegment.counterclockwise)
      [firstAngle, secondAngle] = [secondAngle, firstAngle];
    if (firstAngle > secondAngle) secondAngle += 2 * Math.PI;
    if (firstAngle > angle) angle += 2 * Math.PI;
    ratio = (angle - firstAngle) / (secondAngle - firstAngle);
    if (referenceSegment.counterclockwise) ratio = 1 - ratio;
  } else {
    if (
      Math.abs(
        referenceSegment.vertexes[0].coordinates.x -
          referenceSegment.vertexes[1].coordinates.x,
      ) < 0.001
    ) {
      ratio =
        (point.coordinates.y - referenceSegment.vertexes[0].coordinates.y) /
        (referenceSegment.vertexes[1].coordinates.y -
          referenceSegment.vertexes[0].coordinates.y);
    } else {
      ratio =
        (point.coordinates.x - referenceSegment.vertexes[0].coordinates.x) /
        (referenceSegment.vertexes[1].coordinates.x -
          referenceSegment.vertexes[0].coordinates.x);
    }
  }
  if (
    ratio > 1 &&
    !(
      referenceSegment.shape.name.endsWith('StraightLine') ||
      referenceSegment.shape.name == 'Strip'
    )
  )
    ratio = 1;
  else if (
    ratio < 0 &&
    !(
      (referenceSegment.shape.name.endsWith('StraightLine') &&
        !referenceSegment.shape.name.endsWith('SemiStraightLine')) ||
      referenceSegment.shape.name == 'Strip'
    )
  )
    ratio = 0;
  return ratio;
}

function computeLinkedShape(shape) {
  shape.points.forEach((pt, idx, points) => {
    if (pt.reference) {
      const reference = findObjectById(pt.reference);
      if (reference) {
        if (reference instanceof Point) {
          pt.coordinates = new Coordinates(reference.coordinates);
        } else {
          const coord = getPositionWithRatio(pt, reference);
          pt.coordinates = snapCoordinatesToGrid(coord);
        }
      }
    }
  });
}

function computeTransformShape(shape) {
  const parentShape = findObjectById(
    shape.geometryObject.geometryTransformationParentShapeId,
  );
  shape.vertexes.forEach((pt, idx) => {
    pt.coordinates = snapCoordinatesToGrid(
      parentShape.vertexes[idx].coordinates,
    );
  });
  shape.points
    .filter((pt) => pt.type === 'arcCenter')
    .forEach((pt, idx) => {
      pt.coordinates = snapCoordinatesToGrid(
        parentShape.points.filter((pt) => pt.type === 'arcCenter')[idx]
          .coordinates,
      );
    });
  shape.divisionPoints.forEach((pt, idx) => {
    if (pt.reference)
      pt.coordinates = snapCoordinatesToGrid(
        findObjectById(pt.reference).coordinates,
      );
  });
  if (parentShape.name == 'CirclePart') {
    shape.segments[1].arcCenter.coordinates = snapCoordinatesToGrid(
      parentShape.segments[1].arcCenter.coordinates,
    );
  } else if (parentShape.name == 'CircleArc') {
    shape.segments[0].arcCenter.coordinates = snapCoordinatesToGrid(
      parentShape.segments[0].arcCenter.coordinates,
    );
  }
  if (shape.geometryObject.geometryTransformationName == 'orthogonalSymetry') {
    let axis;
    if (
      shape.geometryObject.geometryTransformationCharacteristicElements.type ==
      'axis'
    ) {
      axis =
        shape.geometryObject.geometryTransformationCharacteristicElements
          .firstElement;
    } else {
      const pts =
        shape.geometryObject.geometryTransformationCharacteristicElements
          .elements;
      const axisShape = new LineShape({
        layer: 'invisible',
        path: `M ${pts[0].coordinates.x} ${pts[0].coordinates.y} L ${pts[1].coordinates.x} ${pts[1].coordinates.y}`,
        borderColor: app.settings.referenceDrawColor,
        borderSize: 2,
      });
      axis = axisShape.segments[0];
    }
    reverseShape(shape, axis);
  } else if (
    shape.geometryObject.geometryTransformationName == 'centralSymetry'
  ) {
    const center =
      shape.geometryObject.geometryTransformationCharacteristicElements
        .firstElement.coordinates;
    shape.rotate(Math.PI, center);
  } else if (shape.geometryObject.geometryTransformationName == 'translation') {
    let pts;
    if (
      shape.geometryObject.geometryTransformationCharacteristicElements.type ==
      'vector'
    ) {
      pts =
        shape.geometryObject.geometryTransformationCharacteristicElements
          .firstElement.points;
    } else {
      pts =
        shape.geometryObject.geometryTransformationCharacteristicElements
          .elements;
    }
    shape.translate(pts[1].coordinates.substract(pts[0].coordinates));
  } else if (shape.geometryObject.geometryTransformationName == 'rotation') {
    // let angle;
    let pts;

    const rotationCenter =
      shape.geometryObject.geometryTransformationCharacteristicElements
        .firstElement;
    if (
      shape.geometryObject.geometryTransformationCharacteristicElements.type ==
      'arc'
    ) {
      const arc =
        shape.geometryObject.geometryTransformationCharacteristicElements
          .secondElement;
      pts = [...arc.vertexes, arc.arcCenter];
    } else {
      pts =
        shape.geometryObject.geometryTransformationCharacteristicElements.elements.slice(
          1,
        );
    }
    const angle =
      pts[2].coordinates.angleWith(pts[1].coordinates) -
      pts[2].coordinates.angleWith(pts[0].coordinates);

    // if (shape.geometryObject.geometryTransformationCharacteristicElementIds.length == 2) {
    //   let arc = findObjectById(shape.geometryObject.geometryTransformationCharacteristicElementIds[1])
    //   pts = [findObjectById(shape.geometryObject.geometryTransformationCharacteristicElementIds[0])];
    // } else {
    //   pts = shape.geometryObject.geometryTransformationCharacteristicElementIds.map(refId =>
    //     findObjectById(refId)
    //   );
    // }
    // angle *= -1;
    shape.rotate(angle, rotationCenter.coordinates);
  }
  if (shape.name == 'PointOnLine') {
    const firstSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    firstSeg.divisionPoints.forEach((pt) => {
      computeDivisionPoint(pt);
    });
    // recomputeAllVisibilities('upper');
  } else if (shape.name.startsWith('PointOnIntersection')) {
    const firstSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    firstSeg.divisionPoints.forEach((pt) => {
      computeDivisionPoint(pt);
    });
    const secondSeg = findObjectById(
      shape.geometryObject.geometryParentObjectId2,
    );
    secondSeg.divisionPoints.forEach((pt) => {
      computeDivisionPoint(pt);
    });
    recomputeAllVisibilities('upper');
  }
  shape.divisionPoints.forEach((pt) => {
    if (!pt.reference) computeDivisionPoint(pt);
  });

  if (shape.isCenterShown) {
    shape.center.coordinates = shape.centerCoordinates;
  }
}

function computeDuplicateShape(shape) {
  let parentObject = findObjectById(
    shape.geometryObject.geometryDuplicateParentShapeId,
  );
  if (!parentObject)
    parentObject = findObjectById(
      shape.geometryObject.geometryMultipliedParentShapeId,
    );

  let parentShape = parentObject;
  if (parentObject instanceof Segment) parentShape = parentObject.shape;

  if (shape.name == 'PointOnLine') {
    shape.points[0].ratio = parentShape.points[0].ratio;

    const ref = findObjectById(shape.geometryObject.geometryParentObjectId1);
    const point = shape.points[0];

    let coord;
    if (ref.shape.name == 'Circle') {
      const refShape = ref.shape;
      const angle =
        refShape.segments[0].arcCenter.coordinates.angleWith(
          refShape.vertexes[0].coordinates,
        ) +
        shape.points[0].ratio * Math.PI * 2;
      coord = refShape.segments[0].arcCenter.coordinates.add({
        x: refShape.segments[0].radius * Math.cos(angle),
        y: refShape.segments[0].radius * Math.sin(angle),
      });
    } else if (ref.isArc()) {
      const firstAngle = ref.arcCenter.coordinates.angleWith(
        ref.vertexes[0].coordinates,
      );
      let secondAngle = ref.arcCenter.coordinates.angleWith(
        ref.vertexes[1].coordinates,
      );
      if (secondAngle <= firstAngle) {
        secondAngle += Math.PI * 2;
      }
      let newAngle = firstAngle + point.ratio * (secondAngle - firstAngle);
      if (ref.counterclockwise) {
        newAngle =
          firstAngle - point.ratio * (2 * Math.PI - secondAngle + firstAngle);
      }
      coord = new Coordinates({
        x: ref.arcCenter.coordinates.x + ref.radius * Math.cos(newAngle),
        y: ref.arcCenter.coordinates.y + ref.radius * Math.sin(newAngle),
      });
    } else {
      const firstPoint = ref.vertexes[0];
      const secondPoint = ref.vertexes[1];
      const segLength = secondPoint.coordinates.substract(
        firstPoint.coordinates,
      );
      const part = segLength.multiply(point.ratio);

      coord = firstPoint.coordinates.add(part);
    }
    shape.points[0].coordinates = snapCoordinatesToGrid(coord);
    ref.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
  } else {
    const vector =
      shape.geometryObject.geometryConstructionSpec.childFirstPointCoordinates.substract(
        shape.geometryObject.geometryConstructionSpec
          .parentFirstPointCoordinates,
      );
    let mustReverse = false,
      rotationMultiplier = -1;
    if (shape.isReversed ^ parentShape.isReversed) {
      mustReverse = true;
      rotationMultiplier = 1;
    }
    shape.points
      .filter((pt) => pt.type != 'divisionPoint')
      .forEach((pt, idx) => {
        let startCoord = parentObject.points.filter(
          (pt) => pt.type != 'divisionPoint',
        )[idx].coordinates;
        if (mustReverse) {
          startCoord = new Coordinates({
            x:
              startCoord.x +
              2 *
                (shape.geometryObject.geometryConstructionSpec
                  .parentFirstPointCoordinates.x -
                  startCoord.x),
            y: startCoord.y,
          });
        }
        let newPointCoordinates = startCoord
          .rotate(
            rotationMultiplier *
              shape.geometryObject.geometryConstructionSpec.rotationAngle,
            shape.geometryObject.geometryConstructionSpec
              .parentFirstPointCoordinates,
          )
          .add(vector);
        if (
          idx == 1 &&
          shape.geometryObject.geometryConstructionSpec.numerator
        ) {
          newPointCoordinates = shape.points[0].coordinates.add(
            newPointCoordinates
              .substract(shape.points[0].coordinates)
              .multiply(
                shape.geometryObject.geometryConstructionSpec.numerator /
                  shape.geometryObject.geometryConstructionSpec.denominator,
              ),
          );
        }
        pt.coordinates = snapCoordinatesToGrid(newPointCoordinates);
      });
    shape.divisionPoints.forEach((pt) => computeDivisionPoint(pt));
    if (shape.isCenterShown) {
      shape.center.coordinates = shape.centerCoordinates;
    }
  }
}

export function recomputeAllVisibilities(layer) {
  app[layer + 'CanvasLayer'].shapes.forEach((s) => {
    if (s.geometryObject) s.geometryObject.geometryIsVisible = true;
  });
  app[layer + 'CanvasLayer'].points.forEach(
    (pt) => (pt.geometryIsVisible = true),
  );

  const changeVisibilityRecursively = (shapeId) => {
    const shape = findObjectById(shapeId);
    if (!shape.geometryObject.geometryIsVisible) {
      return;
    }
    shape.geometryObject.geometryIsVisible = false;
    if (shape.name.startsWith('PointOnIntersection')) {
      let segment = findObjectById(
        shape.geometryObject.geometryParentObjectId1,
      );
      segment.divisionPoints.forEach((divPt) => {
        if (divPt.endpointIds?.some((endPtId) => endPtId == shape.points[0].id))
          divPt.geometryIsVisible = false;
      });
      segment = findObjectById(shape.geometryObject.geometryParentObjectId2);
      segment.divisionPoints.forEach((divPt) => {
        if (divPt.endpointIds?.some((endPtId) => endPtId == shape.points[0].id))
          divPt.geometryIsVisible = false;
      });
    }
    // if (shape.name == 'PointOnLine') {
    //   let segment = findObjectById(shape.geometryObject.geometryParentObjectId1);
    //   segment.divisionPoints.forEach(divPt => {
    //     if (divPt.endpointIds?.some(endPtId => endPtId == shape.points[0].id))
    //       divPt.geometryIsVisible = false;
    //   });
    // }
    shape.geometryObject.geometryChildShapeIds.forEach((objId) => {
      changeVisibilityRecursively(objId);
    });
    shape.geometryObject.geometryTransformationChildShapeIds.forEach(
      (objId) => {
        changeVisibilityRecursively(objId);
      },
    );
    shape.geometryObject.geometryDuplicateChildShapeIds.forEach((objId) => {
      changeVisibilityRecursively(objId);
    });
  };

  app[layer + 'CanvasLayer'].shapes.forEach((s) => {
    if (s.geometryObject?.geometryIsVisibleByChoice === false) {
      if (s.name != 'cut') changeVisibilityRecursively(s.id);
      else s.geometryObject.geometryIsVisible = false;
    }
  });
}

export function computeDivisionPoint(point) {
  if (app.environment.name != 'Geometrie') return;
  const segment = point.segments[0];
  if (point.shape.isCircle()) {
    const startAngle = segment.arcCenter.coordinates.angleWith(
      segment.vertexes[0].coordinates,
    );
    let newAngle = startAngle + point.ratio * 2 * Math.PI;
    if (point.endpointIds?.length == 2) {
      const firstPoint = findObjectById(point.endpointIds[0]);
      const secondPoint = findObjectById(point.endpointIds[1]);
      const firstAngle = segment.arcCenter.coordinates.angleWith(
        firstPoint.coordinates,
      );
      let secondAngle = segment.arcCenter.coordinates.angleWith(
        secondPoint.coordinates,
      );
      if (secondAngle <= firstAngle) {
        secondAngle += Math.PI * 2;
      }
      newAngle = firstAngle + point.ratio * (secondAngle - firstAngle);
    }
    const newCoordinates = new Coordinates({
      x: segment.arcCenter.coordinates.x + segment.radius * Math.cos(newAngle),
      y: segment.arcCenter.coordinates.y + segment.radius * Math.sin(newAngle),
    });
    point.coordinates = snapCoordinatesToGrid(newCoordinates);
  } else if (segment.isArc()) {
    const firstAngle = segment.arcCenter.coordinates.angleWith(
      segment.vertexes[0].coordinates,
    );
    let secondAngle = segment.arcCenter.coordinates.angleWith(
      segment.vertexes[1].coordinates,
    );
    if (secondAngle <= firstAngle) {
      secondAngle += Math.PI * 2;
    }
    let newAngle = firstAngle + point.ratio * (secondAngle - firstAngle);
    if (segment.counterclockwise) {
      newAngle =
        firstAngle - point.ratio * (2 * Math.PI - secondAngle + firstAngle);
    }
    const newCoordinates = new Coordinates({
      x: segment.arcCenter.coordinates.x + segment.radius * Math.cos(newAngle),
      y: segment.arcCenter.coordinates.y + segment.radius * Math.sin(newAngle),
    });
    point.coordinates = snapCoordinatesToGrid(newCoordinates);
  } else {
    let firstPoint = segment.vertexes[0];
    let secondPoint = segment.vertexes[1];
    if (point.endpointIds?.length == 2) {
      firstPoint = findObjectById(point.endpointIds[0]);
      secondPoint = findObjectById(point.endpointIds[1]);
    }

    const segLength = secondPoint.coordinates.substract(firstPoint.coordinates);
    const part = segLength.multiply(point.ratio);

    point.coordinates = snapCoordinatesToGrid(firstPoint.coordinates.add(part));
  }
}

export function computeConstructionSpec(shape, maxIndex = 100) {
  if (shape.familyName == 'duplicate') {
    if (shape.name == 'PointOnLine') {
      return;
    }
    const refObject = findObjectById(
      shape.geometryObject.geometryDuplicateParentShapeId,
    );
    let refShape = refObject;
    if (refShape instanceof Segment) refShape = refShape.shape;
    shape.geometryObject.geometryConstructionSpec.parentFirstPointCoordinates =
      refObject.vertexes[0].coordinates;
    shape.geometryObject.geometryConstructionSpec.childFirstPointCoordinates =
      shape.vertexes[0].coordinates;
    const refShapeAngle = refObject.vertexes[0].coordinates.angleWith(
      refObject.centerCoordinates
        ? refObject.centerCoordinates
        : refObject.vertexes[1].coordinates,
    );
    let centerCoordinates = shape.centerCoordinates;
    // let firstPointCoordinates = shape.points[0].coordinates;
    if (refShape.isReversed ^ shape.isReversed) {
      centerCoordinates = new Coordinates({
        x:
          centerCoordinates.x +
          2 * (shape.points[0].coordinates.x - centerCoordinates.x),
        y: centerCoordinates.y,
      });
      // firstPointCoordinates = new Coordinates({
      //   x: shape.points[0].coordinates.x + 2 * (shape.centerCoordinates.x - shape.points[0].coordinates.x),
      //   y: shape.points[0].coordinates.y,
      // });
    }
    const shapeAngle =
      shape.vertexes[0].coordinates.angleWith(centerCoordinates);
    if (shape.segments[0].length > 0.01) {
      shape.geometryObject.geometryConstructionSpec.rotationAngle =
        refShapeAngle - shapeAngle;
    }
  } else if (shape.familyName == 'multipliedVector') {
    const refShape = findObjectById(
      shape.geometryObject.geometryMultipliedParentShapeId,
    );
    shape.geometryObject.geometryConstructionSpec.parentFirstPointCoordinates =
      refShape.points[0].coordinates;
    shape.geometryObject.geometryConstructionSpec.childFirstPointCoordinates =
      shape.points[0].coordinates;
    shape.geometryObject.geometryConstructionSpec.rotationAngle = 0;
  } else if (shape.name == 'Rectangle') {
    // let angle = shape.vertexes[1].getVertexAngle();
    // shape.geometryObject.geometryConstructionSpec.height = shape.vertexes[2].coordinates.dist(shape.vertexes[1]);
    // if (angle < Math.PI / 2 + .1 && angle > Math.PI / 2 - .1)
    //   shape.geometryObject.geometryConstructionSpec.height *= -1;
  } else if (shape.name == 'Losange') {
    shape.geometryObject.geometryConstructionSpec.angle =
      shape.vertexes[1].getVertexAngle();
  } else if (shape.name == 'Parallelogram') {
  } else if (shape.name == 'RightAngleTrapeze') {
    // let angle = shape.vertexes[1].getVertexAngle();
    // shape.geometryObject.geometryConstructionSpec.height = shape.vertexes[2].coordinates.dist(shape.vertexes[1]);
    // if (Math.abs(angle - Math.PI / 2) < .1) {
    //   shape.geometryObject.geometryConstructionSpec.height *= -1;
    // }
    // if (maxIndex > 2) {
    //   angle = shape.vertexes[2].getVertexAngle();
    //   shape.geometryObject.geometryConstructionSpec.smallBaseLength = shape.vertexes[3].coordinates.dist(shape.vertexes[2]);
    //   if (shape.geometryObject.geometryConstructionSpec.height > 0 ^ Math.abs(angle - Math.PI / 2) < .1) {
    //     shape.geometryObject.geometryConstructionSpec.smallBaseLength *= -1;
    //   }
    // }
  } else if (shape.name == 'IsoscelesTrapeze') {
    // shape.constructionSpec.angle = shape.vertexes[1].getVertexAngle();
    // shape.constructionSpec.firstSegmentLength = shape.segments[0].length;
    // shape.constructionSpec.secondSegmentLength = shape.segments[1].length;
  } else if (shape.name == 'Trapeze') {
    shape.geometryObject.geometryConstructionSpec.angle =
      shape.vertexes[1].getVertexAngle();
    shape.geometryObject.geometryConstructionSpec.firstSegmentLength =
      shape.segments[0].length;
    shape.geometryObject.geometryConstructionSpec.secondSegmentLength =
      shape.segments[1].length;
    shape.geometryObject.geometryConstructionSpec.thirdSegmentLength =
      shape.segments[2].length;
    if (
      Math.abs(
        shape.segments[0].getAngleWithHorizontal() -
          shape.segments[2].getAngleWithHorizontal(),
      ) > 0.1
    )
      shape.geometryObject.geometryConstructionSpec.thirdSegmentLength *= -1;
  } else if (shape.name == 'RightAngleIsoscelesTriangle') {
    shape.geometryObject.geometryConstructionSpec.angle =
      shape.vertexes[1].getVertexAngle();
  } else if (shape.name == 'RightAngleTriangle') {
    shape.geometryObject.geometryConstructionSpec.angle =
      shape.vertexes[1].getVertexAngle();
    shape.geometryObject.geometryConstructionSpec.secondSegmentLength =
      shape.segments[1].length;
  } else if (shape.name == 'IsoscelesTriangle') {
    shape.geometryObject.geometryConstructionSpec.height =
      shape.segments[0].middle.dist(shape.vertexes[2].coordinates);
    if (shape.vertexes[1].getVertexAngle() > Math.PI)
      shape.geometryObject.geometryConstructionSpec.height *= -1;
  } else if (shape.name == 'CirclePart') {
    const angle2 = shape.segments[1].arcCenter.coordinates.angleWith(
      shape.vertexes[1].coordinates,
    );
    const angle1 = shape.segments[1].arcCenter.coordinates.angleWith(
      shape.vertexes[2].coordinates,
    );
    const angle = mod(angle1 - angle2, 2 * Math.PI);
    shape.geometryObject.geometryConstructionSpec.angle = angle;
  } else if (shape.name == 'CircleArc') {
    const angle2 = shape.segments[0].arcCenter.coordinates.angleWith(
      shape.vertexes[0].coordinates,
    );
    const angle1 = shape.segments[0].arcCenter.coordinates.angleWith(
      shape.vertexes[1].coordinates,
    );
    const angle = mod(angle1 - angle2, 2 * Math.PI);
    shape.geometryObject.geometryConstructionSpec.angle = angle;
  } else if (
    shape.name == 'ParalleleSemiStraightLine' ||
    shape.name == 'ParalleleSegment'
  ) {
    shape.geometryObject.geometryConstructionSpec.segmentLength =
      shape.segments[0].length;
    const reference = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    if (
      Math.abs(
        reference.getAngleWithHorizontal() -
          shape.segments[0].getAngleWithHorizontal(),
      ) > 0.1
    )
      shape.geometryObject.geometryConstructionSpec.segmentLength *= -1;
  } else if (
    shape.name == 'PerpendicularSemiStraightLine' ||
    shape.name == 'PerpendicularSegment'
  ) {
    shape.geometryObject.geometryConstructionSpec.segmentLength =
      shape.segments[0].length;
    const reference = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    if (
      Math.abs(
        reference.getAngleWithHorizontal() -
          shape.segments[0].getAngleWithHorizontal() +
          Math.PI / 2,
      ) > 0.1 &&
      Math.abs(
        reference.getAngleWithHorizontal() -
          shape.segments[0].getAngleWithHorizontal() +
          Math.PI / 2 -
          2 * Math.PI,
      ) > 0.1
    )
      shape.geometryObject.geometryConstructionSpec.segmentLength *= -1;
  } else if (shape.name == 'PointOnLine') {
    const reference = findObjectById(
      shape.geometryObject.geometryParentObjectId1,
    );
    const ratio = getRatioWithPosition(shape.points[0], reference);
    shape.points[0].ratio = ratio;
  }
}

export function projectionOnConstraints(coordinates, constraints) {
  if (constraints.isFree) return coordinates;
  const projectionsOnContraints = constraints.lines
    .map((line) => {
      const projection = line.segment.projectionOnSegment(coordinates);
      const dist = projection.dist(coordinates);
      return { projection: projection, dist: dist };
    })
    .concat(
      constraints.points.map((pt) => {
        const dist = pt.dist(coordinates);
        return { projection: pt, dist: dist };
      }),
    );
  projectionsOnContraints.sort((p1, p2) => (p1.dist > p2.dist ? 1 : -1));
  return snapCoordinatesToGrid(projectionsOnContraints[0].projection);
}
