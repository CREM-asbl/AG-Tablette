import { app } from '../Core/App';
import { Coordinates } from '../Core/Objects/Coordinates';
import { Point } from '../Core/Objects/Point';
import { Segment } from '../Core/Objects/Segment';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { findObjectById } from '../Core/Tools/general';
import { computeConstructionSpec } from './recomputeShape';

export function getAllLinkedShapesInGeometry(shape, involvedShapes) {
  if (app.environment.name != 'Geometrie')
    return;
  shape.geometryObject.geometryChildShapeIds.forEach(ref => {
    let s = findObjectById(ref);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryTransformationChildShapeIds.forEach(sId => {
    let s = findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryDuplicateChildShapeIds.forEach(sId => {
    let s = findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  if (shape.geometryObject.geometryTransformationParentShapeId) {
    let s = findObjectById(shape.geometryObject.geometryTransformationParentShapeId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  }
  shape.geometryObject.geometryMultipliedChildShapeIds.forEach(sId => {
    let s = findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryTransformationCharacteristicElementIds.forEach((sId, idx) => {
    let objectType = 'point';
    if (shape.geometryObject.geometryTransformationName == 'orthogonalSymetry' &&
      shape.geometryObject.geometryTransformationCharacteristicElementIds.length == 1)
        objectType = 'segment';

    let s;
    if ((shape.geometryObject.geometryTransformationName == 'translation' &&
      shape.geometryObject.geometryTransformationCharacteristicElementIds.length == 1) ||
      (shape.geometryObject.geometryTransformationName == 'rotation' &&
      idx == 1 &&
      shape.geometryObject.geometryTransformationCharacteristicElementIds.length == 2) ) {
        s = findObjectById(sId);
    } else {
      s = findObjectById(sId).shape;
    }
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  if (shape.geometryObject.geometryParentObjectId1) {
    let seg = findObjectById(shape.geometryObject.geometryParentObjectId1);
    let s = seg.shape;
    // if (seg)
      // s = seg.shape;
    // else
    //   s = findObjectById(shape.geometryObject.geometryParentObjectId1);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
  if (shape.geometryObject.geometryParentObjectId2) {
    let seg = findObjectById(shape.geometryObject.geometryParentObjectId2);
    let s = seg.shape;
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
}

export function getAllChildrenInGeometry(shape, involvedShapes) {
  shape.geometryObject.geometryTransformationChildShapeIds.forEach(sId => {
    let s = findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllChildrenInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryChildShapeIds.forEach(sId => {
    let s = findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllChildrenInGeometry(s, involvedShapes);
    }
  });
}

function addShapeToChildren(parent, child) {
  if (parent.id == child.id)
    return;
  if (parent.geometryObject.geometryChildShapeIds.indexOf(child.id) != -1)
    return;
  parent.geometryObject.geometryChildShapeIds.push(child.id);
}

export function linkNewlyCreatedPoint(shape, point) {
  let ref = point.adjustedOn;
  if (ref?.type == 'grid')
    return;
  if (
    (point.idx == 1
      && (shape.name == 'CircleArc' || shape.name.startsWith('Parallele') || shape.name.startsWith('Perpendicular'))
    )
    ||
    (point.idx == 2
      && (shape.name == 'Rectangle' || shape.name == 'Losange' || shape.name == 'RightAngleTriangle' || shape.name == 'RightAngleTrapeze' || shape.name == 'IsoscelesTriangle' || shape.name == 'CirclePart')
    )
    ||
    (point.idx == 3
      && (shape.name == 'Trapeze' || shape.name == 'RightAngleTrapeze')
    )
  ) {
    let constraintShape;
    if (shape.name == 'Rectangle' || shape.name == 'RightAngleTriangle' || (shape.name == 'RightAngleTrapeze' && point.idx == 2)) {
      let referenceSegment = shape.segments[0];
      let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      let newCoordinates = shape.vertexes[1].coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));

      let path = [
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
      constraintShape.geometryObject.geometryParentObjectId1 = referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(constraintShape.id);

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[1].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    } else if (shape.name == 'Losange') {
      let referenceSegment = shape.segments[0];
      let oppositeCoordinates = referenceSegment.vertexes[1].coordinates.multiply(2).substract(referenceSegment.vertexes[0].coordinates),
          radius = referenceSegment.vertexes[0].coordinates.dist(referenceSegment.vertexes[1].coordinates);
      let path = ['M', referenceSegment.vertexes[0].coordinates.x, referenceSegment.vertexes[0].coordinates.y]
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
        .concat(['A', radius, radius, 0, 1, 0, referenceSegment.vertexes[0].coordinates.x, referenceSegment.vertexes[0].coordinates.y])
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
      let referenceSegment = shape.segments[0];
      let oppositeCoordinates = referenceSegment.arcCenter.coordinates.multiply(2).substract(referenceSegment.vertexes[0].coordinates),
          radius = referenceSegment.vertexes[0].coordinates.dist(referenceSegment.arcCenter.coordinates);
      let path = ['M', referenceSegment.vertexes[0].coordinates.x, referenceSegment.vertexes[0].coordinates.y]
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
        .concat(['A', radius, radius, 0, 1, 0, referenceSegment.vertexes[0].coordinates.x, referenceSegment.vertexes[0].coordinates.y])
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
      constraintShape.segments[0].arcCenter.reference = shape.segments[0].arcCenter.id;

      constraintShape.vertexes[0].visible = false;
      constraintShape.segments[0].arcCenter.visible = false;
    } else if (shape.name == 'CirclePart') {
      let referenceSegment = shape.segments[1];
      let oppositeCoordinates = referenceSegment.arcCenter.coordinates.multiply(2).substract(referenceSegment.vertexes[0].coordinates),
          radius = referenceSegment.vertexes[0].coordinates.dist(referenceSegment.arcCenter.coordinates);
      let path = ['M', referenceSegment.vertexes[0].coordinates.x, referenceSegment.vertexes[0].coordinates.y]
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
        .concat(['A', radius, radius, 0, 1, 0, referenceSegment.vertexes[0].coordinates.x, referenceSegment.vertexes[0].coordinates.y])
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
      let referenceSegment = shape.segments[0];
      let angle = referenceSegment.getAngleWithHorizontal();
      let newCoordinates = shape.vertexes[2].coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));

      let path = [
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
      constraintShape.geometryObject.geometryParentObjectId1 = referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(constraintShape.id);

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[2].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    } else if (shape.name == 'IsoscelesTriangle') {
      let referenceSegment = shape.segments[0];
      let referenceSegmentMiddle = referenceSegment.addPoint(referenceSegment.middle, 0.5, referenceSegment.vertexIds[0], referenceSegment.vertexIds[1], false);
      let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      let newCoordinates = referenceSegmentMiddle.coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));

      let path = [
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
      constraintShape.geometryObject.geometryParentObjectId1 = referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(constraintShape.id);

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = referenceSegmentMiddle.id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
      referenceSegmentMiddle.visible = false;
    } else if (shape.name.startsWith('Parallele')) {
      let referenceSegment = findObjectById(shape.geometryObject.geometryParentObjectId1);
      let angle = referenceSegment.getAngleWithHorizontal();
      let newCoordinates = shape.vertexes[0].coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));

      let path = [
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
      constraintShape.geometryObject.geometryParentObjectId1 = referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(constraintShape.id);

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[0].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    } else if (shape.name.startsWith('Perpendicular')) {
      let referenceSegment = findObjectById(shape.geometryObject.geometryParentObjectId1);
      let angle = referenceSegment.getAngleWithHorizontal() + Math.PI / 2;
      let newCoordinates = shape.vertexes[0].coordinates.add(new Coordinates({
        x: 100 * Math.cos(angle),
        y: 100 * Math.sin(angle),
      }));

      let path = [
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
      constraintShape.geometryObject.geometryParentObjectId1 = referenceSegment.id;
      referenceSegment.shape.geometryObject.geometryChildShapeIds.push(constraintShape.id);

      addShapeToChildren(shape, constraintShape);
      constraintShape.vertexes[0].reference = shape.vertexes[0].id;

      constraintShape.segments[0].isInfinite = true;
      constraintShape.vertexes[0].visible = false;
      constraintShape.vertexes[1].visible = false;
    }

    let newSinglePointShape = new SinglePointShape({
      layer: 'main',
      path: `M ${point.coordinates.x} ${point.coordinates.y}`,
      name: 'PointOnLine',
      familyName: 'Point',
      geometryObject: new GeometryObject({
        geometryPointOnTheFlyChildId: shape.id,
      }),
    });
    newSinglePointShape.geometryObject.geometryParentObjectId1 = constraintShape.segments[0].id;
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
      ref.endpointIds?.forEach(endPointId => {
        let endPoint = findObjectById(endPointId);
        let endPointShape = endPoint.shape;
        if (endPointShape.name == 'PointOnLine' || endPointShape.name.startsWith('PointOnIntersection'))
          addShapeToChildren(endPointShape, shape);
      })
    }
    addShapeToChildren(ref.shape, shape);
    point.reference = ref.id;
  } else {
    let newSinglePointShape = new SinglePointShape({
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
  // if (ref) {// = app.mainCanvasLayer.points.filter(pt => pt.shape.id != shape.id).find(pt => pt.coordinates.equal(point.coordinates))) {


  //   if (ref instanceof Segment) {

  //     shape.geometryObject.geometryParentObjectId1 = ref;

  //     computeConstructionSpec(shape);

  //     let reference = findObjectById(ref);
  //     reference.shape.geometryObject.geometryChildShapeIds.push(shape.id);
  //     point.ratio = getRatioWithPosition(point, ref);
  //   }
  //   addShapeToChildren(ref.shape, shape);
  //   point.reference = ref.id;
  // }
}
