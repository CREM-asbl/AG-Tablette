import { uniqId } from '../Tools/general';

/**
 * Une famille de figures.
 */
export class Family {
  /**
   * Constructeur
   * @param {String} name         Nom de la famille
   * @param {String} fillColor Couleur par défaut des figures ("#rrggbb")
   */
  constructor({ name, fillColor, shapeTemplates, fillOpacity = 0.7 }) {
    this.name = name;
    this.defaultFillColor = fillColor;
    this.defaultFillOpacity = fillOpacity;
    this.id = uniqId();
    this.isVisible = true;
    this.shapeTemplates = shapeTemplates.map(template => {
      return {
        name: 'Custom',
        familyName: 'Custom',
        fillColor: fillColor || '#aaa',
        fillOpacity: fillOpacity || 0.7,
        ...template
      }
    });
  }

  /**
   * récupérer la liste des noms des modèles de la famille
   * @return [String]
   */
  get templateNames() {
    return this.shapeTemplates.map((template) => template.name);
  }

  /**
   * Renvoie un modèle d'une famille à partir de son nom
   * @param name: le nom de la figure
   * @return Objet de type Shape (sans coordonnées)
   */
  getTemplate(name) {
    const template = this.shapeTemplates.find(
      (shapeTemplate) => shapeTemplate.name === name,
    );
    if (template !== undefined) {
      return template;
    } else {
      console.error(
        "Family.getTemplate: '" + name + "' not found in",
        this.templateNames,
      );
      return null;
    }
  }
}
