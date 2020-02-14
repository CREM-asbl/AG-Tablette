import { Shape } from './Shape';

/**
 * Groupe de formes liées. Un tel groupe est créé par l'utilisateur à l'aide de
 * l'outil de création de groupes (Grouper/Dégrouper).
 */
export class Silhouette {
  /**
   * Constructeur
   * @param {Shape} shapeId1   La première forme du groupe
   * @param {Shape} shapeId2   La seconde forme du groupe
   */
  constructor(shape) {
    this.shape = shape;
  }

  saveToObject() {
    let save = {
      shape: this.shape.saveToObject(),
    };
    return save;
  }

  initFromObject(save) {
    this.shape = new Shape({ x: 0, y: 0 }, null);
    this.shape.initFromObject(save.shape);
  }
}
