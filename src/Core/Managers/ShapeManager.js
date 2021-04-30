import { app } from '../App';
import { GroupManager } from './GroupManager';
import { SelectManager } from './SelectManager';

export class ShapeManager {
  /**
   * Ajoute une forme au workspace
   * @param {Shape} shape   La forme à ajouter
   * @param {Numbre} index  L'index qu'elle doit avoir dans le tableau des formes
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
   * Renvoie l'index d'une forme (index dans le tableau de formes du
   * Workspace actuel), ou -1 si la forme n'a pas été trouvée.
   * @param  {Shape} shape la forme
   * @return {int}       l'index de cette forme dans le tableau des formes
   */
  static getShapeIndex(shape) {
    return app.mainDrawingEnvironment.shapes.findIndex((s) => s.id == shape.id);
  }

  /**
   * Renvoie la forme ayant un certain id
   * @param  {int} id l'id de la forme
   * @return {Shape}         l'objet forme, ou null si la forme n'existe pas
   */
  static getShapeById(id) {
    let shape = app.mainDrawingEnvironment.shapes.find((s) => s.id == id);
    return shape ? shape : null;
  }

  /**
   * Renvoie la liste des formes contenant une certaine coordonnée.
   * Le tableau renvoyé est trié de la forme la plus en avant à la forme la
   * plus en arrière.
   * @param {Coordinates} coord
   */
  static shapesThatContainsCoordinates(coord, constraints) {
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
      } else
        return (
          shape.isCoordinatesInPath(coord) || shape.isCoordinatesOnBorder(coord)
        );
    });
    list.reverse();
    return list;
  }

  /**
   * Renvoie la liste des formes solidaires à la forme donnée (c'est-à-dire
   * faisant partie du même groupe).
   * @param  {Shape} shape Une forme
   * @param  {Boolean} [includeReceivedShape=false] true: inclus la forme
   * 												   reçue dans les résultats
   * @return {[Shape]}     Les formes liées
   */
  static getAllBindedShapes(shape, includeReceivedShape = false) {
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

  /**
   * Supprime une forme. Ne la supprime pas des groupes (à faire manuellement)
   * @param  {Shape} shape La forme à supprimer
   */
  static deleteShape(shape) {
    let shapeIndex = ShapeManager.getShapeIndex(shape);
    if (shapeIndex == -1) {
      console.error("Workspace.deleteShape: couldn't delete the shape");
      return;
    }
    //supprime la forme
    app.workspace.shapes.splice(shapeIndex, 1);
  }

  static updateReferencedShapes(mustDraw = false) {
    app.workspace.shapes.forEach((s) => {
      s.updateReferenced(mustDraw);
    });
  }
}
