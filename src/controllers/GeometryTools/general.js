import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { findObjectById } from '../Core/Tools/general';
import { computeConstructionSpec } from './recomputeShape';

export function getAllLinkedShapesInGeometry(
  shape,
  involvedShapes,
  includeDuplicate = true,
) {
  if (app.environment.name != 'Geometrie') return;
  shape.geometryObject.geometryChildShapeIds.forEach((ref) => {
    const s = findObjectById(ref);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
    }
  });
  shape.geometryObject.geometryTransformationChildShapeIds.forEach((sId) => {
    const s = findObjectById(sId);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
    }
  });
  shape.geometryObject.geometryDuplicateChildShapeIds.forEach((sId) => {
    const s = findObjectById(sId);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
    }
  });
  if (shape.geometryObject.geometryTransformationParentShapeId) {
    const s = findObjectById(
      shape.geometryObject.geometryTransformationParentShapeId,
    );
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
    }
  }
  shape.geometryObject.geometryMultipliedChildShapeIds.forEach((sId) => {
    const s = findObjectById(sId);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
    }
  });
  const characteristicElements =
    shape.geometryObject.geometryTransformationCharacteristicElements;
  if (characteristicElements) {
    characteristicElements.elements.forEach((element) => {
      const s = element.shape;
      if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
        involvedShapes.push(s);
        getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
      }
    });
  }

  // shape.geometryObject.geometryTransformationCharacteristicElementIds.forEach((sId, idx) => {
  //   let s;
  //   if ((shape.geometryObject.geometryTransformationName == 'translation' &&
  //     shape.geometryObject.geometryTransformationCharacteristicElementIds.length == 1) ||
  //     (shape.geometryObject.geometryTransformationName == 'rotation' &&
  //     idx == 1 &&
  //     shape.geometryObject.geometryTransformationCharacteristicElementIds.length == 2) ) {
  //       s = findObjectById(sId);
  //   } else {
  //     s = findObjectById(sId).shape;
  //   }
  //   if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
  //     involvedShapes.push(s);
  //     getAllLinkedShapesInGeometry(s, involvedShapes, includeDuplicate);
  //   }
  // });

  if (shape.geometryObject.geometryParentObjectId1) {
    const seg = findObjectById(shape.geometryObject.geometryParentObjectId1);
    const s = seg.shape;
    // if (seg)
    // s = seg.shape;
    // else
    //   s = findObjectById(shape.geometryObject.geometryParentObjectId1);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
  if (shape.geometryObject.geometryParentObjectId2) {
    const seg = findObjectById(shape.geometryObject.geometryParentObjectId2);
    const s = seg.shape;
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
}

export function getAllChildrenInGeometry(shape, involvedShapes) {
  shape.geometryObject.geometryTransformationChildShapeIds.forEach((sId) => {
    const s = findObjectById(sId);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllChildrenInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryChildShapeIds.forEach((sId) => {
    const s = findObjectById(sId);
    if (!involvedShapes.find((involvedShape) => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllChildrenInGeometry(s, involvedShapes);
    }
  });
}

function addShapeToChildren(parent, child) {
  if (parent.id == child.id) return;
  if (parent.geometryObject.geometryChildShapeIds.indexOf(child.id) != -1)
    return;
  parent.geometryObject.geometryChildShapeIds.push(child.id);
}

export function linkNewlyCreatedPoint(shape, point) {
  let ref = point.adjustedOn;
  if (ref?.type == 'grid') return;
  while (ref && ref instanceof Point && ref.reference)
    ref = findObjectById(ref.reference);
  if (
    (point.idx == 1 &&
      (shape.name == 'CircleArc' ||
        shape.name.startsWith('Parallele') ||
        shape.name.startsWith('Perpendicular'))) ||
    (point.idx == 2 &&
      (shape.name == 'Rectangle' ||
        shape.name == 'Losange' ||
        shape.name == 'RightAngleTriangle' ||
        shape.name == 'RightAngleTrapeze' ||
        shape.name == 'IsoscelesTriangle' ||
        shape.name == 'CirclePart')) ||
    (point.idx == 3 &&
      (shape.name == 'Trapeze' || shape.name == 'RightAngleTrapeze'))
  ) {
    let constraintShape;
    if (
      shape.name == 'Rectangle' ||
      shape.name == 'RightAngleTriangle' ||
      (shape.name == 'RightAngleTrapeze' && point.idx == 2)
    ) {
      const referenceSegment = shape.segments[0];
      const angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      const newCoordinates = shape.vertexes[1].coordinates.add(
        new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }),
      );

      const path = [
        'M',
        shape.vertexes[1].coordinates.x,
        shape.vertexes[1].coordinates.y,
        'L',
        newCoordinates.x,
        newCoordinates.y,
      ].join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'PerpendicularStraightLine',
        familyName: 'Line',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });
      constraintShape.geometryObject.geometryParentObjectId1 =
        referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(
        constraintShape.id,
      );

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[1].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    } else if (shape.name == 'Losange') {
      const referenceSegment = shape.segments[0];
      const oppositeCoordinates = referenceSegment.vertexes[1].coordinates
          .multiply(2)
          .substract(referenceSegment.vertexes[0].coordinates),
        radius = referenceSegment.vertexes[0].coordinates.dist(
          referenceSegment.vertexes[1].coordinates,
        );
      const path = [
        'M',
        referenceSegment.vertexes[0].coordinates.x,
        referenceSegment.vertexes[0].coordinates.y,
      ]
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
        .concat([
          'A',
          radius,
          radius,
          0,
          1,
          0,
          referenceSegment.vertexes[0].coordinates.x,
          referenceSegment.vertexes[0].coordinates.y,
        ])
        .join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'Circle',
        familyName: 'Circle',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[0].id;
      constraintShape.segments[0].arcCenter.reference = shape.vertexes[1].id;

      constraintShape.vertexes[0].visible = false;
      constraintShape.segments[0].arcCenter.visible = false;
    } else if (shape.name == 'CircleArc') {
      const referenceSegment = shape.segments[0];
      const oppositeCoordinates = referenceSegment.arcCenter.coordinates
          .multiply(2)
          .substract(referenceSegment.vertexes[0].coordinates),
        radius = referenceSegment.vertexes[0].coordinates.dist(
          referenceSegment.arcCenter.coordinates,
        );
      const path = [
        'M',
        referenceSegment.vertexes[0].coordinates.x,
        referenceSegment.vertexes[0].coordinates.y,
      ]
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
        .concat([
          'A',
          radius,
          radius,
          0,
          1,
          0,
          referenceSegment.vertexes[0].coordinates.x,
          referenceSegment.vertexes[0].coordinates.y,
        ])
        .join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'Circle',
        familyName: 'Circle',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[0].id;
      constraintShape.segments[0].arcCenter.reference =
        shape.segments[0].arcCenter.id;

      constraintShape.vertexes[0].visible = false;
      constraintShape.segments[0].arcCenter.visible = false;
    } else if (shape.name == 'CirclePart') {
      const referenceSegment = shape.segments[1];
      const oppositeCoordinates = referenceSegment.arcCenter.coordinates
          .multiply(2)
          .substract(referenceSegment.vertexes[0].coordinates),
        radius = referenceSegment.vertexes[0].coordinates.dist(
          referenceSegment.arcCenter.coordinates,
        );
      const path = [
        'M',
        referenceSegment.vertexes[0].coordinates.x,
        referenceSegment.vertexes[0].coordinates.y,
      ]
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
        .concat([
          'A',
          radius,
          radius,
          0,
          1,
          0,
          referenceSegment.vertexes[0].coordinates.x,
          referenceSegment.vertexes[0].coordinates.y,
        ])
        .join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'Circle',
        familyName: 'Circle',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[1].id;
      constraintShape.segments[0].arcCenter.reference = shape.vertexes[0].id;

      constraintShape.vertexes[0].visible = false;
      constraintShape.segments[0].arcCenter.visible = false;
    } else if (shape.name == 'Trapeze' || shape.name == 'RightAngleTrapeze') {
      const referenceSegment = shape.segments[0];
      const angle = referenceSegment.getAngleWithHorizontal();
      const newCoordinates = shape.vertexes[2].coordinates.add(
        new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }),
      );

      const path = [
        'M',
        shape.vertexes[2].coordinates.x,
        shape.vertexes[2].coordinates.y,
        'L',
        newCoordinates.x,
        newCoordinates.y,
      ].join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'ParalleleStraightLine',
        familyName: 'Line',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });
      constraintShape.geometryObject.geometryParentObjectId1 =
        referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(
        constraintShape.id,
      );

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[2].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    } else if (shape.name == 'IsoscelesTriangle') {
      const referenceSegment = shape.segments[0];
      const referenceSegmentMiddle = referenceSegment.addPoint(
        referenceSegment.middle,
        0.5,
        referenceSegment.vertexIds[0],
        referenceSegment.vertexIds[1],
        false,
      );
      const angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      const newCoordinates = referenceSegmentMiddle.coordinates.add(
        new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }),
      );

      const path = [
        'M',
        referenceSegmentMiddle.coordinates.x,
        referenceSegmentMiddle.coordinates.y,
        'L',
        newCoordinates.x,
        newCoordinates.y,
      ].join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'PerpendicularStraightLine',
        familyName: 'Line',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });
      constraintShape.geometryObject.geometryParentObjectId1 =
        referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(
        constraintShape.id,
      );

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = referenceSegmentMiddle.id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
      referenceSegmentMiddle.visible = false;
    } else if (shape.name.startsWith('Parallele')) {
      const referenceSegment = findObjectById(
        shape.geometryObject.geometryParentObjectId1,
      );
      const angle = referenceSegment.getAngleWithHorizontal();
      const newCoordinates = shape.vertexes[0].coordinates.add(
        new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }),
      );

      const path = [
        'M',
        shape.vertexes[0].coordinates.x,
        shape.vertexes[0].coordinates.y,
        'L',
        newCoordinates.x,
        newCoordinates.y,
      ].join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'ParalleleStraightLine',
        familyName: 'Line',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });
      constraintShape.geometryObject.geometryParentObjectId1 =
        referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(
        constraintShape.id,
      );

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[0].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    } else if (shape.name.startsWith('Perpendicular')) {
      const referenceSegment = findObjectById(
        shape.geometryObject.geometryParentObjectId1,
      );
      const angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      const newCoordinates = shape.vertexes[0].coordinates.add(
        new Coordinates({
          x: 100 * Math.cos(angle),
          y: 100 * Math.sin(angle),
        }),
      );

      const path = [
        'M',
        shape.vertexes[0].coordinates.x,
        shape.vertexes[0].coordinates.y,
        'L',
        newCoordinates.x,
        newCoordinates.y,
      ].join(' ');

      constraintShape = new LineShape({
        layer: 'main',
        path: path,
        name: 'PerpendicularStraightLine',
        familyName: 'Line',
        strokeColor: app.settings.constraintsDrawColor,
        strokeWidth: 2,
        geometryObject: new GeometryObject({
          geometryIsConstaintDraw: true,
        }),
      });
      constraintShape.geometryObject.geometryParentObjectId1 =
        referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(
        constraintShape.id,
      );

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[0].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    }

    const newSinglePointShape = new SinglePointShape({
      layer: 'main',
      path: `M ${point.coordinates.x} ${point.coordinates.y}`,
      name: 'PointOnLine',
      familyName: 'Point',
      geometryObject: new GeometryObject({
        geometryPointOnTheFlyChildId: shape.id,
      }),
    });
    newSinglePointShape.geometryObject.geometryParentObjectId1 =
      constraintShape.segments[0].id;
    addShapeToChildren(constraintShape, newSinglePointShape);

    if (ref && ref instanceof Segment) {
      newSinglePointShape.name = 'PointOnIntersection2';
      newSinglePointShape.geometryObject.geometryParentObjectId2 = ref.id;

      addShapeToChildren(ref.shape, newSinglePointShape);
    }
    computeConstructionSpec(newSinglePointShape);

    addShapeToChildren(newSinglePointShape, shape);
    point.reference = newSinglePointShape.vertexes[0].id;
  } else if (ref && ref instanceof Point) {
    if (ref.type == 'divisionPoint') {
      ref.endpointIds?.forEach((endPointId) => {
        const endPoint = findObjectById(endPointId);
        const endPointShape = endPoint.shape;
        if (
          endPointShape.name == 'PointOnLine' ||
          endPointShape.name.startsWith('PointOnIntersection')
        )
          addShapeToChildren(endPointShape, shape);
      });
    }
    addShapeToChildren(ref.shape, shape);
    point.reference = ref.id;
  } else {
    const newSinglePointShape = new SinglePointShape({
      layer: 'main',
      path: `M ${point.coordinates.x} ${point.coordinates.y}`,
      name: 'Point',
      familyName: 'Point',
      geometryObject: new GeometryObject({
        geometryPointOnTheFlyChildId: shape.id,
      }),
    });
    if (ref && ref instanceof Segment) {
      newSinglePointShape.name = 'PointOnLine';
      newSinglePointShape.geometryObject.geometryParentObjectId1 = ref.id;

      computeConstructionSpec(newSinglePointShape);
      addShapeToChildren(ref.shape, newSinglePointShape);
      // ref.shape.geometryObject.geometryChildShapeIds.push(newSinglePointShape.id);
    }
    addShapeToChildren(newSinglePointShape, shape);
    point.reference = newSinglePointShape.vertexes[0].id;
  }
}
