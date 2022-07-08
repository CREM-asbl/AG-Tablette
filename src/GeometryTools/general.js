import { app } from '../Core/App';
import { findObjectById } from '../Core/Tools/general';
import { Segment } from '../Core/Objects/Segment';
import { getRatioWithPosition, computeConstructionSpec } from './recomputeShape';
import { SinglePointShape } from '../Core/Objects/Shapes/SinglePointShape';
import { GeometryObject } from '../Core/Objects/Shapes/GeometryObject';
import { Point } from '../Core/Objects/Point';
import { LineShape } from '../Core/Objects/Shapes/LineShape';
import { Coordinates } from '../Core/Objects/Coordinates';

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
  if (shape.geometryObject.geometryTransformationParentShapeId) {
    let s = findObjectById(shape.geometryObject.geometryTransformationParentShapeId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  }
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
    let s;
    if (seg)
      s = seg.shape;
    else
      s = findObjectById(shape.geometryObject.geometryParentObjectId1);
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
  console.log(parent)
  if (parent.geometryObject.geometryChildShapeIds.indexOf(child.id) === -1)
    parent.geometryObject.geometryChildShapeIds.push(child.id);
}

export function linkNewlyCreatedPoint(shape, point) {
  let ref = point.adjustedOn;
  if (point.idx == 2) {
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

    let constraintShape = new LineShape({
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
    constraintShape.segments[0].isInfinite = true;
    constraintShape.points[1].visible = false;

    constraintShape.geometryObject.geometryParentObjectId1 = referenceSegment.id;
    referenceSegment.shape.geometryObject.geometryChildShapeIds.push(constraintShape.id);

    addShapeToChildren(shape, constraintShape);
    constraintShape.vertexes[0].reference = shape.vertexes[1].id;

    let newSinglePointShape = new SinglePointShape({
      layer: 'main',
      path: `M ${point.coordinates.x} ${point.coordinates.y}`,
      name: 'PointOnLine',
      familyName: 'Point',
      geometryObject: new GeometryObject({}),
    });
    newSinglePointShape.geometryObject.geometryParentObjectId1 = constraintShape.segments[0].id;
    addShapeToChildren(constraintShape, newSinglePointShape);

    if (ref && ref instanceof Segment) {
      newSinglePointShape.name = 'PointOnIntersection';
      newSinglePointShape.geometryObject.geometryParentObjectId2 = ref.id;

      addShapeToChildren(ref.shape, newSinglePointShape);
    }
    computeConstructionSpec(newSinglePointShape);

    addShapeToChildren(newSinglePointShape, shape);
    point.reference = newSinglePointShape.vertexes[0].id;
    console.log(constraintShape, newSinglePointShape, shape);
  } else if (ref && ref instanceof Point) {
    if (ref.type == 'divisionPoint') {
      ref.endpointIds?.forEach(endPointId => {
        let endPoint = findObjectById(endPointId);
        let endPointShape = endPoint.shape;
        if (endPointShape.name == 'PointOnLine' || endPointShape.name == 'PointOnIntersection')
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
      geometryObject: new GeometryObject({}),
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
