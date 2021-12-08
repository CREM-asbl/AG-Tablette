import { app } from '../Core/App';

export function getAllInvolvedShapes(shape, involvedShapes) {
  shape.hasGeometryReferenced.forEach(ref => {
    let s = app.mainDrawingEnvironment.findObjectById(ref);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllInvolvedShapes(s, involvedShapes);
    }
  });
  shape.geometryTransformationChildShapeIds.forEach(sId => {
    let s = app.mainDrawingEnvironment.findObjectById(sId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllInvolvedShapes(s, involvedShapes);
    }
  });
  if (shape.geometryTransformationParentShapeId) {
    let s = app.mainDrawingEnvironment.findObjectById(shape.geometryTransformationParentShapeId);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllInvolvedShapes(s, involvedShapes);
    }
  }
  shape.geometryTransformationCharacteristicElementIds.forEach(sId => {
    let objectType = 'point';
    if (shape.geometryTransformationName == 'orthogonalSymetry')
      if (shape.geometryTransformationCharacteristicElementIds.length == 1)
        objectType = 'segment';
    let s = app.mainDrawingEnvironment.findObjectById(sId, objectType).shape;
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id)) {
      involvedShapes.push(s);
      getAllInvolvedShapes(s, involvedShapes);
    }
  });
  if (shape.referenceId) {
    let seg = app.mainDrawingEnvironment.findObjectById(shape.referenceId, 'segment');
    let s;
    if (seg)
      s = seg.shape;
    else
      s = app.mainDrawingEnvironment.findObjectById(shape.referenceId, 'shape');
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
  if (shape.referenceId2) {
    let seg = app.mainDrawingEnvironment.findObjectById(shape.referenceId2, 'segment');
    let s = seg.shape;
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
  }
}
