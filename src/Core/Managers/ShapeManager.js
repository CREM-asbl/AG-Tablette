import { app } from '../App';
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
    let newIndexes = new Array(indexes.length);
    for (let i = max; i >= 0; i--) {
      let idx = indexes.findIndex((idx) => idx == i);
      if (idx != -1) {
        let shape = app.workspace.shapes[i];
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
      let idx = indexes.findIndex((idx) => idx == i);
      if (idx != -1) {
        let shape = app.workspace.shapes[i];
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
    let lower = app.workspace.shapes.slice(0, -nbr),
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
    return app.mainDrawingEnvironment.shapes.findIndex((s) => s.id == shape.id);
  }

  /**
   * Renvoie la figure ayant un certain id
   * @param  {int} id l'id de la figure
   * @return {Shape}         l'objet figure, ou null si la figure n'existe pas
   */
  static getShapeById(id) {
    let shape = app.mainDrawingEnvironment.shapes.find((s) => s.id == id);
    return shape ? shape : null;
  }

  /**
   * Renvoie la liste des figures contenant une certaine coordonnée.
   * Le tableau renvoyé est trié de la figure la plus en avant à la figure la
   * plus en arrière.
   * @param {Coordinates} coord
   */
  static shapesThatContainsCoordinates(coord, constraints = {}) {
    let allShapes = [...app.mainDrawingEnvironment.shapes];
    if (constraints.canSelectFromUpper)
      allShapes.push(...app.upperDrawingEnvironment.shapes);
    let list = allShapes.filter((shape) => {
      if (shape.isSegment()) {
        const seg = shape.segments[0];
        const projection = seg.projectionOnSegment(coord);
        return (
          seg.isCoordinatesOnSegment(projection) &&
          SelectManager.areCoordinatesInSelectionDistance(projection, coord)
        );
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

    let getParents = (currentShape) => {
      let parents = [];
      currentShape.points.forEach(vx => {
        if (vx.reference != null) {
          parents.push(app.mainDrawingEnvironment.findObjectById(vx.reference, 'point').shape);
        }
      });
      if (currentShape.geometryObject.geometryParentObjectId1) {
        let seg = app.mainDrawingEnvironment.findObjectById(currentShape.geometryObject.geometryParentObjectId1, 'segment');
        let s = seg ? seg.shape : app.mainDrawingEnvironment.findObjectById(currentShape.geometryObject.geometryParentObjectId1, 'shape');
        parents.push(s);
      }
      if (currentShape.geometryObject.geometryParentObjectId2)
        parents.push(app.mainDrawingEnvironment.findObjectById(currentShape.geometryObject.geometryParentObjectId2, 'segment').shape);
      return parents;
    }
    let getChildren = (currentShape) => {
      let children = currentShape.geometryObject.geometryChildShapeIds.map(sId =>
        app.mainDrawingEnvironment.findObjectById(sId)
      );
      return children;
    }

    let getParentAndChildren = (shape, currentShapeArray) => {
      let parents = getParents(shape);
      let children = getChildren(shape);
      console.log(shape, parents, children);
      [...parents, ...children].forEach(s => {
        if (allLinkedShapes.every(linkedShape => linkedShape.id != s.id) && currentShapeArray.every(linkedShape => linkedShape.id != s.id)) {
          currentShapeArray.push(s);
          getParentAndChildren(s, currentShapeArray);
        }
      })
    }
    getParentAndChildren(shape, allLinkedShapes);

    let allGroups = [];
    let getGroups = (shapes, currentGroupArray) => {
      shapes.forEach(s => {
        let group = GroupManager.getShapeGroup(s);
        if (!group)
          return;
        if (allGroups.every(groupFound => groupFound.id != group.id) && currentGroupArray.every(groupFound => groupFound.id != group.id)) {
          currentGroupArray.push(group);
        }
      });
    };
    let iterateWithGroups = (workingShapes, workingGroups) => {
      getGroups(workingShapes, workingGroups);
      if (workingGroups.length == 0)
        return

      let newLinkedShapes = [];
      workingGroups.forEach(group => {
        group.shapesIds.forEach((id) => {
          let shape = app.mainDrawingEnvironment.findObjectById(id, 'shape');
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
    let shapeIndex = ShapeManager.getShapeIndex(shape);
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
