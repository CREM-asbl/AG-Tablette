import { app } from '../Core/App';
import { findObjectById } from '../Core/Tools/general';

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
  if (parent.geometryObject.geometryChildShapeIds.indexOf(child.id) === -1)
    parent.geometryObject.geometryChildShapeIds.push(child.id);
}

export function linkNewlyCreatedPoint(shape, point) {
  let ref;
  if (ref = app.mainCanvasLayer.points.filter(pt => pt.shape.id != shape.id).find(pt => pt.coordinates.equal(point.coordinates))) {
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
  }
}
