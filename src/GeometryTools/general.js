import { app } from '../Core/App';

export function getAllLinkedShapesInGeometry(shape, involvedShapes) {
  if (app.environment.name != 'Geometrie')
    return;
  shape.geometryObject.geometryChildShapeIds.forEach(ref => {
    let s = app.mainCanvasLayer.findObjectById(ref);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryTransformationChildShapeIds.forEach(sId => {
    let s = app.mainCanvasLayer.findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  if (shape.geometryObject.geometryTransformationParentShapeId) {
    let s = app.mainCanvasLayer.findObjectById(shape.geometryObject.geometryTransformationParentShapeId);
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
        s = app.mainCanvasLayer.findObjectById(sId, 'shape');
    } else {
      s = app.mainCanvasLayer.findObjectById(sId, objectType).shape;
    }
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllLinkedShapesInGeometry(s, involvedShapes);
    }
  });
  if (shape.geometryObject.geometryParentObjectId1) {
    let seg = app.mainCanvasLayer.findObjectById(shape.geometryObject.geometryParentObjectId1, 'segment');
    let s;
    if (seg)
      s = seg.shape;
    else
      s = app.mainCanvasLayer.findObjectById(shape.geometryObject.geometryParentObjectId1, 'shape');
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
  if (shape.geometryObject.geometryParentObjectId2) {
    let seg = app.mainCanvasLayer.findObjectById(shape.geometryObject.geometryParentObjectId2, 'segment');
    let s = seg.shape;
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
}

export function getAllChildrenInGeometry(shape, involvedShapes) {
  shape.geometryObject.geometryTransformationChildShapeIds.forEach(sId => {
    let s = app.mainCanvasLayer.findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllChildrenInGeometry(s, involvedShapes);
    }
  });
  shape.geometryObject.geometryChildShapeIds.forEach(sId => {
    let s = app.mainCanvasLayer.findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllChildrenInGeometry(s, involvedShapes);
    }
  });
}
