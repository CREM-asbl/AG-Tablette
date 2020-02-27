import { app } from '../App';

export class GroupManager {
  /**
   * Ajouter un groupe à l'espace de travail
   * @param {Group} group         Le groupe
   * @param {int}	index			L'index où placer le groupe. Par défaut: à la fin
   */
  static addGroup(group, index = null) {
    if (Number.isFinite(index)) {
      app.workspace.shapeGroups.splice(index, 0, group);
    } else {
      app.workspace.shapeGroups.push(group);
    }
  }

  /**
   * Récupérer l'index d'un groupe dans le tableau de groupes
   * @param  {Group} group         Le groupe
   * @return {int}               L'index (peut varier dans le temps!)
   */
  static getGroupIndex(group) {
    return app.workspace.shapeGroups.findIndex(gr => gr.id == group.id);
  }

  /**
   * Réupérer le groupe d'une forme
   * @param  {Shape} shape         la forme
   * @return {Group}               le groupe, ou null s'il n'y en a pas.
   */
  static getShapeGroup(shape) {
    let group = app.workspace.shapeGroups.find(gr => gr.contains(shape.id));
    return group ? group : null;
  }

  /**
   * Récupérer un groupe à partir de son id
   * @param  {String} id            L'id du groupe
   * @return {Group}               Le groupe, ou null s'il n'existe pas
   */
  static getGroup(id) {
    for (let i = 0; i < app.workspace.shapeGroups.length; i++) {
      if (app.workspace.shapeGroups[i].id == id) return app.workspace.shapeGroups[i];
    }
    return null;
  }

  /**
   * Supprimer un groupe
   * @param  {Group} group         Le groupe
   */
  static deleteGroup(group) {
    let idx = GroupManager.getGroupIndex(group);
    if (idx != -1) app.workspace.shapeGroups.splice(idx, 1);
    else console.error("Couldn't delete group: ", group);
  }
}