import { uniqId } from '../Tools/general';
import { Shape } from './Shape';

/**
 * Une famille de formes.
 */
export class Family {
  /**
   * Constructeur
   * @param {String} name         Nom de la famille
   * @param {String} defaultColor Couleur par défaut des formes ("#xxxxxx")
   */
  constructor({ name, color, shapes, opacity = 0.7 }) {
    this.name = name;
    this.defaultColor = color;
    this.opacity = opacity;
    this.id = uniqId();
    this.shapes = [];
    shapes.forEach(shape => {
      this.addShape(shape);
    });
  }

  /**
   * Ajouter une forme à la famille
   * @param {String} name       Nom de la forme
   * @param {[String]} steps étapes de construction de la forme
   */
  addShape({ name, segments, color, path, opacity }) {
    if (!path && segments.length < 1) {
      console.error('Family.addShape error: buildSteps.length is 0');
      return;
    }

    let shape = new Shape({
      x: 0,
      y: 0,
      segments: segments,
      name: name,
      familyName: this.name,
      path: path,
      color: color ? color : this.defaultColor,
      opacity: opacity ? opacity : this.opacity,
    });

    this.shapes.push(shape);
  }

  /**
   * récupérer la liste des noms des formes de la famille
   * @return [String]
   */
  getShapesNames() {
    return this.shapes.map(shape => shape.name);
  }

  /**
   * Renvoie une forme d'une famille à partir de son nom
   * @param name: le nom de la forme
   * @return Objet de type Shape (sans coordonnées)
   */
  getShape(name) {
    for (let i = 0; i < this.shapes.length; i++) {
      if (this.shapes[i].name == name) {
        return this.shapes[i];
      }
    }
    console.error('Family.getShape: shape not found');
    return null;
  }
}
