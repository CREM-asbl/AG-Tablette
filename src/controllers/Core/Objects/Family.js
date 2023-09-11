import { uniqId } from '../Tools/general';
import { ShapeTemplate } from './ShapeTemplate';

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
    this.shapeTemplates = [];
    shapeTemplates.forEach((shapeTemplate) => {
      this.addTemplate(shapeTemplate);
    });
  }

  /**
   * Ajouter un modèle venant d'un kit à la famille
   */
  addTemplate({ name, fillColor, path, fillOpacity }) {
    if (!path) {
      console.error('Family.addTemplate error: no path');
      return;
    }

    let shapeTemplate = new ShapeTemplate({
      path: path,
      name: name,
      familyName: this.name,
      fillColor: fillColor ? fillColor : this.defaultFillColor,
      fillOpacity: fillOpacity ? fillOpacity : this.defaultFillOpacity,
    });

    this.shapeTemplates.push(shapeTemplate);
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
    let template = this.shapeTemplates.find(
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
