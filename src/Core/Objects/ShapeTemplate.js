import { app } from '../App';

/**
 * Représente un modèle de forme
 */
export class ShapeTemplate {
  /**
   * Constructeur
   * @param {String} name          nom de la forme
   * @param {String} familyName    nom de la famille de la forme
   */
  constructor({
    path = undefined,
    name = 'Custom',
    familyName = 'Custom',
    color = '#aaa',
    opacity = 0.7,
  }) {
    this.path = path;
    this.name = name;
    this.familyName = familyName;
    this.color = color;
    this.opacity = opacity;
  }
}
