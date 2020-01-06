import { uniqId } from '../Tools/general';

/**
 * Groupe de formes liées. Un tel groupe est créé par l'utilisateur à l'aide de
 * l'outil de création de groupes (Grouper/Dégrouper).
 */
export class ShapeGroup {
  /**
   * Constructeur
   * @param {Shape} shapeId1   La première forme du groupe
   * @param {Shape} shapeId2   La seconde forme du groupe
   */
  constructor(shapeId1, shapeId2) {
    if (shapeId1 === shapeId2) {
      throw new Error('Une même forme ne peut pas être ajoutée 2 fois à un groupe');
    }
    //La liste des formes contenues dans le groupe
    this.shapesIds = [shapeId1, shapeId2];

    //Identifiant unique du groupe
    this.id = uniqId();
  }

  saveToObject() {
    let save = {
      id: this.id,
      shapesIds: this.shapesIds,
    };
    return save;
  }

  initFromObject(save) {
    this.id = save.id;
    this.shapesIds = [...save.shapesIds];
  }

  /**
   * Ajouter une forme au groupe
   * @param {number} shapeId    La forme que l'on ajoute
   */
  addShape(shapeId) {
    if (this.contains(shapeId)) {
      console.error('This shape is already part of this user group.');
      return;
    }
    this.shapesIds.push(shapeId);
  }

  /**
   * Retirer une forme du groupe. Ne supprime pas le groupe s'il ne reste
   * qu'une ou zéro formes (cela doit être fait manuellement).
   * @param {number} shapeId    La forme que l'on retire
   */
  deleteShape(shapeId) {
    let length = this.shapesIds.length;
    this.shapesIds = this.shapesIds.filter(id => shapeId != id);
    if (length == this.shapesIds.length) console.error("Couldn't delete shape from user group.");
  }

  /**
   * Vérifier si une forme fait partie du groupe
   * @param  {number} shapeId la forme
   * @return {Boolean}       true si elle fait partie du groupe, false sinon
   */
  contains(shapeId) {
    return this.shapesIds.includes(shapeId);
  }
}
