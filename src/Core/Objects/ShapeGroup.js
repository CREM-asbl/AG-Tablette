import { app, setState } from '../App';
import { uniqId } from '../Tools/general';

/**
 * Groupe de figures liées. Un tel groupe est créé par l'utilisateur à l'aide de
 * l'outil de création de groupes (Grouper/Dégrouper).
 */
export class ShapeGroup {
  /**
   * Constructeur
   * @param {Shape} shapeId1   La première figure du groupe
   * @param {Shape} shapeId2   La seconde figure du groupe
   */
  constructor(shapeId1, shapeId2) {
    if (shapeId1 === shapeId2) {
      throw new Error(
        'Une même figure ne peut pas être ajoutée 2 fois à un groupe',
      );
    }
    //La liste des figures contenues dans le groupe
    this.shapesIds = [shapeId1, shapeId2];

    //Identifiant unique du groupe
    this.id = uniqId();

    this.color = ['#77b5fe', '#ff8400', '#096a09', '#f00020', '#03224c', '#34c924', '#d473d4', '#fd3f92'][app.nextGroupColorIdx];
    setState({ nextGroupColorIdx: (app.nextGroupColorIdx + 1) % 8 });
  }

  saveToObject() {
    let save = {
      id: this.id,
      shapesIds: [...this.shapesIds],
    };
    return save;
  }

  initFromObject(save) {
    this.id = save.id;
    this.shapesIds = [...save.shapesIds];
  }

  /**
   * copy a shapeGroup
   * @param {Boolean} full si copie id aussi
   */
  copy(full = false) {
    let copy = new ShapeGroup(0, 1);
    copy.shapesIds = [...this.shapesIds];
    if (full) copy.id = this.id;
    return copy;
  }

  /**
   * Ajouter une figure au groupe
   * @param {number} shapeId    La figure que l'on ajoute
   */
  addShape(shapeId) {
    if (this.contains(shapeId)) {
      console.error('This shape is already part of this user group.');
      return;
    }
    this.shapesIds.push(shapeId);
  }

  /**
   * Retirer une figure du groupe. Ne supprime pas le groupe s'il ne reste
   * qu'une ou zéro figures (cela doit être fait manuellement).
   * @param {number} shapeId    La figure que l'on retire
   */
  deleteShape(shapeId) {
    let length = this.shapesIds.length;
    this.shapesIds = this.shapesIds.filter((id) => shapeId != id);
    if (length == this.shapesIds.length)
      console.error("Couldn't delete shape from user group.");
  }

  /**
   * Vérifier si une figure fait partie du groupe
   * @param  {number} shapeId la figure
   * @return {Boolean}       true si elle fait partie du groupe, false sinon
   */
  contains(shapeId) {
    return this.shapesIds.includes(shapeId);
  }
}
