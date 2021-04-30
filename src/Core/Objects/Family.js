import { uniqId } from '../Tools/general';
import { ShapeTemplate } from './ShapeTemplate';

/**
 * Une famille de formes.
 */
export class Family {
  /**
   * Constructeur
   * @param {String} name         Nom de la famille
   * @param {String} defaultColor Couleur par défaut des formes ("#rrggbb")
   */
  constructor({ name, color, shapeTemplates, opacity = 0.7 }) {
    this.name = name;
    this.defaultColor = color;
    this.opacity = opacity;
    this.id = uniqId();
    this.shapeTemplates = [];
    shapeTemplates.forEach((shapeTemplate) => {
      this.addTemplate(shapeTemplate);
    });
  }

  /**
   * Ajouter un modèle venant d'un kit à la famille
   */
  addTemplate({ name, color, path, opacity }) {
    if (!path) {
      console.error('Family.addTemplate error: no path');
      return;
    }

    let shapeTemplate = new ShapeTemplate({
      path: path,
      name: name,
      familyName: this.name,
      color: color ? color : this.defaultColor,
      opacity: opacity ? opacity : this.opacity,
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
   * @param name: le nom de la forme
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
