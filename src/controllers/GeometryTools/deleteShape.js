import { app } from "../Core/App";
import { findObjectById, removeObjectById } from "../Core/Tools/general";

export function deleteSubDivisionPoints(segment, point) {
  segment.divisionPoints.forEach(divPt => {
    if (divPt.endpointIds && divPt.endpointIds.some(endPtId => endPtId == point.id)) {
      deleteSubDivisionPoints(segment, divPt);
      if (app.environment.name == 'Geometrie')
        deleteChildrenOfDivisionPoint(divPt);
      segment.deletePoint(divPt);
    }
  });
}

export function deleteChildren(shape) {
  if (shape.name == 'PointOnLine' || shape.name.startsWith('PointOnIntersection')) {
    const segment = findObjectById(shape.geometryObject.geometryParentObjectId1);
    if (segment) {
      // if segment not deleted yet
      const point = shape.points[0];
      deleteSubDivisionPoints(segment, point);
    }
  }
  if (shape.name.startsWith('PointOnIntersection')) {
    const segment = findObjectById(shape.geometryObject.geometryParentObjectId2);
    if (segment) {
      // if segment not deleted yet
      const point = shape.points[0];
      deleteSubDivisionPoints(segment, point);
    }
  }
  app.mainCanvasLayer.shapes.forEach(s => {
    s.geometryObject.geometryChildShapeIds = s.geometryObject.geometryChildShapeIds.filter(id => id != shape.id);
  });
  app.mainCanvasLayer.shapes.forEach(s => {
    s.geometryObject.geometryTransformationChildShapeIds = s.geometryObject.geometryTransformationChildShapeIds.filter(id => id != shape.id);
  });
  app.mainCanvasLayer.shapes.forEach(s => {
    s.geometryObject.geometryDuplicateChildShapeIds = s.geometryObject.geometryDuplicateChildShapeIds.filter(id => id != shape.id);
  });
  shape.geometryObject.geometryTransformationChildShapeIds.forEach(childId => {
    const child = findObjectById(childId);
    if (child) {
      deleteChildren(child);
    }
  });
  shape.geometryObject.geometryChildShapeIds.forEach(childId => {
    const child = findObjectById(childId);
    if (child) {
      deleteChildren(child);
    }
  });
  shape.geometryObject.geometryDuplicateChildShapeIds.forEach(childId => {
    const child = findObjectById(childId);
    if (child) {
      deleteChildren(child);
    }
  });
  removeObjectById(shape.id);
}

export function deleteChildrenOfDivisionPoint(point) {
  const shape = point.shape;
  shape.geometryObject.geometryChildShapeIds.forEach(childId => {
    const child = findObjectById(childId);
    if (!child)
      return;
    if (child.vertexes.some(vx => vx.reference == point.id)) {
      if (app.environment.name == 'Geometrie')
        deleteChildren(child);
      removeObjectById(child.id);
    }
  });
  shape.geometryObject.geometryTransformationChildShapeIds.forEach(childId => {
    const child = findObjectById(childId);
    if (!child)
      return;
    child.divisionPoints.forEach(divPt => {
      if (divPt.reference == point.id) {
        const segment = divPt.segments[0];
        if (segment) {
          // if segment not deleted yet
          deleteSubDivisionPoints(segment, divPt);
          if (app.environment.name == 'Geometrie')
            deleteChildrenOfDivisionPoint(divPt);
          segment.deletePoint(divPt);
        }
      }
    });
  });
}
