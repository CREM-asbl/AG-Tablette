import { app } from "../App";
import { GeometryObject } from "../Objects/Shapes/GeometryObject";
import { addInfoToId } from "./general";

export function duplicateShape(s, layer = 'upper') {
  let newShape = new s.constructor({
    ...s,
    layer,
    path: s.getSVGPath('no scale', false, false),
    divisionPointInfos: s.divisionPoints.map((dp) => {
      return { coordinates: dp.coordinates, ratio: dp.ratio, segmentIdx: dp.segments[0].idx, id: addInfoToId(dp.id, layer), color: dp.color };
    }),
    segmentsColor: s.segments.map((seg) => {
      return seg.color;
    }),
    pointsColor: s.points.map((pt) => {
      return pt.color;
    }),
  });
  let segIds = newShape.segments.map((seg, idx) => seg.id = addInfoToId(s.segments[idx].id, layer));
  let ptIds = newShape.points.map((pt, idx) => pt.id = addInfoToId(s.points[idx].id, layer));
  newShape.segmentIds = [...segIds];
  newShape.pointIds = [...ptIds];
  newShape.segments.forEach((seg, idx) => {
    seg.isInfinite = s.segments[idx].isInfinite;
    seg.isSemiInfinite = s.segments[idx].isSemiInfinite;
    seg.vertexIds = s.segments[idx].vertexIds.map(id => addInfoToId(id, layer));
    seg.divisionPointIds = s.segments[idx].divisionPointIds.map(id => addInfoToId(id, layer));
    seg.arcCenterId = addInfoToId(s.segments[idx].arcCenterId, layer);
  });
  newShape.points.forEach((pt, idx) => {
    pt.segmentIds = s.points[idx].segmentIds.map(id => addInfoToId(id, layer));
    // pt.coordinates = new Coordinates(s.points[idx].coordinates);
    pt.reference = addInfoToId(s.points[idx].reference, layer);
    pt.type = s.points[idx].type;
    pt.ratio = s.points[idx].ratio;
    pt.visible = s.points[idx].visible;
    pt.transformConstraints = s.points[idx].transformConstraints;
    pt.endpointIds = s.points[idx].endpointIds?.map(id => addInfoToId(id, layer));
    pt.geometryIsVisible = s.points[idx].geometryIsVisible;
  });
  if (app.environment.name == 'Geometrie') {
    newShape.geometryObject = new GeometryObject({
      ...s.geometryObject,
      geometryChildShapeIds: s.geometryObject.geometryChildShapeIds.map(id => addInfoToId(id, layer)),
      geometryParentObjectId1: addInfoToId(s.geometryObject.geometryParentObjectId1, layer),
      geometryParentObjectId2: addInfoToId(s.geometryObject.geometryParentObjectId2, layer),
      geometryTransformationChildShapeIds: s.geometryObject.geometryTransformationChildShapeIds.map(id => addInfoToId(id, layer)),
      geometryTransformationParentShapeId: addInfoToId(s.geometryObject.geometryTransformationParentShapeId, layer),
      geometryTransformationCharacteristicElementIds: s.geometryObject.geometryTransformationCharacteristicElementIds.map(id => addInfoToId(id, layer)),
      geometryDuplicateChildShapeIds: s.geometryObject.geometryDuplicateChildShapeIds.map(id => addInfoToId(id, layer)),
      geometryDuplicateParentShapeId: addInfoToId(s.geometryObject.geometryDuplicateParentShapeId, layer),
    });
  }
  return newShape;
}

export function compareIdBetweenLayers(id1, id2) {
  id1 = id1.substring(0, 8);
  id2 = id2.substring(0, 8);
  return id1 == id2;
}
