import { app } from './App';
import { Point } from './Objects/Point';
import { GroupManager } from './GroupManager';

export class ShapeManager {
  static init() {}

  /**
   * Ajoute une forme au workspace
   * @param {Shape} shape la forme à ajouter
   */
  static addShape(shape, index = null) {
    if (index !== null) {
      app.workspace.shapes.splice(index, 0, shape);
    } else {
      app.workspace.shapes.push(shape);
    }
  }

  /**
   * Renvoie l'index d'une forme (index dans le tableau de formes du
   * Workspace actuel), ou -1 si la forme n'a pas été trouvée.
   * @param  {Shape} shape la forme
   * @return {int}       l'index de cette forme dans le tableau des formes
   */
  static getShapeIndex(shape) {
    return app.workspace.shapes.findIndex(s => s.id == shape.id);
  }

  /**
   * Renvoie la forme ayant un certain id
   * @param  {int} id l'id de la forme
   * @return {Shape}         l'objet forme, ou null si la forme n'existe pas
   */
  static getShapeById(id) {
    let shape = app.workspace.shapes.find(s => s.id == id);
    return shape ? shape : null;
  }

  /**
   * Renvoie la liste des formes contenant un certain point.
   * Le tableau renvoyé est trié de la forme la plus en avant à la forme la
   * plus en arrière.
   * @param point: le point (Point)
   * @return la liste des formes ([Shape])
   */
  static shapesOnPoint(point) {
    let list = app.workspace.shapes.filter(
      shape => shape.isPointInPath(point) || shape.isPointOnSegment(new Point(point)),
    );
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
      shapes = group.shapesIds.map(id => ShapeManager.getShapeById(id));
    }

    if (!includeReceivedShape) {
      shapes = shapes.filter(s => s.id != shape.id);
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
}
