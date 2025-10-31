import { app } from '../App';
import { findObjectById } from '../Tools/general';
import { GroupManager } from './GroupManager';
import { SelectManager } from './SelectManager';

export class ShapeManager {
  /**
   * Ajoute une figure au workspace
   * @param {Shape} shape   La figure à ajouter
   * @param {Numbre} index  L'index qu'elle doit avoir dans le tableau des figures
   */
  static addShape(shape, index = null) {
    if (index !== null) {
      app.workspace.shapes.splice(index, 0, shape);
    } else {
      app.workspace.shapes.push(shape);
    }
  }

  /**
   * moves the selected shapes above all other, with respect of the order
   * @param {Number[]} indexes this indexes of the shapes to move
   * @return {Number[]} the new indexes of the shapes
   */
  static moveShapesUp(indexes) {
    const max = app.workspace.shapes.length - 1;
    let shapesMoved = 0;
    const newIndexes = new Array(indexes.length);
    for (let i = max; i >= 0; i--) {
      const idx = indexes.findIndex((idx) => idx == i);
      if (idx != -1) {
        const shape = app.workspace.shapes[i];
        app.workspace.shapes.splice(i, 1);
        app.workspace.shapes.splice(max - shapesMoved, 0, shape);
        shapesMoved++;
        newIndexes[max - shapesMoved] = idx;
      }
    }
    return newIndexes;
  }

  /**
   * move the upper shapes back to their place, accordingly to indexes
   * @param {Number[]} indexes the final place of the shapes
   */
  static moveShapesBackToTheirPlace(indexes) {
    const max = app.workspace.shapes.length - 1;
    for (let i = 0; i < max; i++) {
      const idx = indexes.findIndex((idx) => idx == i);
      if (idx != -1) {
        const shape = app.workspace.shapes[i];
        app.workspace.shapes.splice(i, 1);
        app.workspace.shapes.splice(indexes[idx], 0, shape);
      }
    }
  }

  /**
   * reverse the order of the <nbr> upper shapes
   * @param {Number} nbr number of shapes to reverse
   */
  static reverseUpperShapes(nbr) {
    const lower = app.workspace.shapes.slice(0, -nbr),
      upper = app.workspace.shapes.slice(-nbr);
    app.workspace.shapes = [...lower, ...upper.reverse()];
  }

  /**
   * Renvoie l'index d'une figure (index dans le tableau de figures du
   * Workspace actuel), ou -1 si la figure n'a pas été trouvée.
   * @param  {Shape} shape la figure
   * @return {int}       l'index de cette figure dans le tableau des figures
   */
  static getShapeIndex(shape) {
    return app.mainCanvasLayer.shapes.findIndex((s) => s.id == shape.id);
  }

  /**
   * Renvoie la figure ayant un certain id
   * @param  {int} id l'id de la figure
   * @return {Shape}         l'objet figure, ou null si la figure n'existe pas
   */
  static getShapeById(id) {
    const shape = app.mainCanvasLayer.shapes.find((s) => s.id == id);
    return shape ? shape : null;
  }

  /**
   * Renvoie la liste des figures contenant une certaine coordonnée.
   * Le tableau renvoyé est trié de la figure la plus en avant à la figure la
   * plus en arrière.
   * @param {Coordinates} coord
   */
  static shapesThatContainsCoordinates(coord, constraints = {}) {
    const allShapes = [...app.mainCanvasLayer.shapes];
    if (constraints.canSelectFromUpper) {
      allShapes.push(...app.upperCanvasLayer.shapes);
    }
    const list = allShapes.filter((shape) => {
      if (shape.isSegment() && !shape.segments[0].isArc()) {
        const seg = shape.segments[0];
        const projection = seg.projectionOnSegment(coord);
        if (seg.isCoordinatesOnSegment(projection) && SelectManager.areCoordinatesInSelectionDistance(projection, coord)) {
          return true;
        }
        if (SelectManager.areCoordinatesInSelectionDistance(seg.vertexes[0].coordinates, coord) || SelectManager.areCoordinatesInSelectionDistance(seg.vertexes[1].coordinates, coord)) {
          return true;
        }
        return false;
      } else if (shape.isPoint()) {
        return SelectManager.areCoordinatesInSelectionDistance(coord, shape.points[0].coordinates);
      } else {
        return (
          shape.isCoordinatesInPath(coord) || shape.isCoordinatesOnBorder(coord)
        );
      }
    });
    list.reverse();
    return list;
  }

  /**
   * Renvoie la liste des figures solidaires à la figure donnée (c'est-à-dire
   * faisant partie du même groupe).
   * @param  {Shape} shape Une figure
   * @param  {Boolean} [includeReceivedShape=false] true: inclus la figure
   * 												   reçue dans les résultats
   * @return {[Shape]}     Les figures liées
   */
  static getAllBindedShapes(shape, includeReceivedShape = true) {
    let shapes = [shape],
      group = GroupManager.getShapeGroup(shape);
    if (group) {
      shapes = group.shapesIds.map((id) => ShapeManager.getShapeById(id));
    }

    if (!includeReceivedShape) {
      shapes = shapes.filter((s) => s.id != shape.id);
    }
    return shapes;
  }

  static getAllBindedShapesInGeometry(shape) {
    let allLinkedShapes = [shape];

    const getParents = (currentShape) => {
      const parents = [];
      currentShape.points.filter(pt => pt.type != 'divisionPoint').forEach(vx => {
        if (vx.reference != null) {
          parents.push(findObjectById(vx.reference).shape);
        }
      });
      if (currentShape.geometryObject.geometryParentObjectId1) {
        const seg = findObjectById(currentShape.geometryObject.geometryParentObjectId1);
        const s = seg ? seg.shape : findObjectById(currentShape.geometryObject.geometryParentObjectId1);
        parents.push(s);
      }
      if (currentShape.geometryObject.geometryParentObjectId2)
        parents.push(findObjectById(currentShape.geometryObject.geometryParentObjectId2).shape);
      return parents;
    }
    const getChildren = (currentShape) => {
      const children = currentShape.geometryObject.geometryChildShapeIds.map(sId =>
        findObjectById(sId)
      ).filter(child => child.name != 'PointOnIntersection');//&& child.name != 'cut');
      return children;
    }

    const getParentAndChildren = (shape, currentShapeArray) => {
      const parents = getParents(shape);
      const children = getChildren(shape);
      [...parents, ...children].forEach(s => {
        if (allLinkedShapes.every(linkedShape => linkedShape.id != s.id) && currentShapeArray.every(linkedShape => linkedShape.id != s.id)) {
          currentShapeArray.push(s);
          getParentAndChildren(s, currentShapeArray);
        }
      })
    }
    getParentAndChildren(shape, allLinkedShapes);

    let allGroups = [];
    const getGroups = (shapes, currentGroupArray) => {
      shapes.forEach(s => {
        const group = GroupManager.getShapeGroup(s);
        if (!group)
          return;
        if (allGroups.every(groupFound => groupFound.id != group.id) && currentGroupArray.every(groupFound => groupFound.id != group.id)) {
          currentGroupArray.push(group);
        }
      });
    };
    const iterateWithGroups = (workingShapes, workingGroups) => {
      getGroups(workingShapes, workingGroups);
      if (workingGroups.length == 0)
        return

      const newLinkedShapes = [];
      workingGroups.forEach(group => {
        group.shapesIds.forEach((id) => {
          const shape = findObjectById(id);
          if (allLinkedShapes.every(linkedShape => linkedShape.id != shape.id)) {
            newLinkedShapes.push(shape);
          }
        })
      });
      newLinkedShapes.forEach(currentShape => {
        getParentAndChildren(currentShape, newLinkedShapes);
      });

      allLinkedShapes = [...allLinkedShapes, ...newLinkedShapes];
      allGroups = [...allGroups, ...workingGroups];
      iterateWithGroups(newLinkedShapes, []);
    }
    iterateWithGroups(allLinkedShapes, allGroups);

    return allLinkedShapes;
  }

  /**
   * Supprime une figure. Ne la supprime pas des groupes (à faire manuellement)
   * @param  {Shape} shape La figure à supprimer
   */
  static deleteShape(shape) {
    const shapeIndex = ShapeManager.getShapeIndex(shape);
    if (shapeIndex == -1) {
      console.error("Workspace.deleteShape: couldn't delete the shape");
      return;
    }
    //supprime la figure
    app.workspace.shapes.splice(shapeIndex, 1);
  }

  static updateReferencedShapes(mustDraw = false) {
    app.workspace.shapes.forEach((s) => {
      s.updateReferenced(mustDraw);
    });
  }
}
