/**
 * Représente un modèle de figure
 */
export class ShapeTemplate {
  /**
   * Constructeur
   * @param {String} name          nom de la figure
   * @param {String} familyName    nom de la famille de la figure
   */
  constructor({
    path = undefined,
    name = 'Custom',
    familyName = 'Custom',
    fillColor = '#aaa',
    fillOpacity = 0.7,
  }) {
    this.path = path;
    this.name = name;
    this.familyName = familyName;
    this.fillColor = fillColor;
    this.fillOpacity = fillOpacity;
  }
}
