import { app } from '../Core/App';

export function getAllInvolvedShapes(shape, involvedShapes) {
  shape.hasGeometryReferenced.forEach(ref => {
    let s = app.mainDrawingEnvironment.findObjectById(ref);
    if (!involvedShapes.find(involvedShape => involvedShape.id == s.id))
      involvedShapes.push(s);
    getAllInvolvedShapes(s, involvedShapes);
  });
}
