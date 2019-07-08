import { uniqId } from '../Tools/general'
import { ShapeBuildStep } from '../Objects/ShapeBuildStep'
import { Shape } from './Shape'

/**
 * Une famille de formes.
 */
export class Family {
	/**
     * Constructeur
     * @param {String} name         Nom de la famille
     * @param {String} defaultColor Couleur par défaut des formes ("#xxxxxx")
     */
	constructor(name, defaultColor) {
		this.name = name;
		this.shapes = [];
		this.defaultColor = defaultColor;
		this.id = uniqId();
	}

    /**
     * Ajouter une forme à la famille
     * @param {String} name       Nom de la forme
     * @param {[ShapeBuildStep]} buildSteps étapes de construction de la forme
     */
	addShape(name, buildSteps, refPoint) {
		 if (buildSteps.length < 1) {
			console.error("Family.addShape error: buildSteps.length is 0");
			return;
		}
		if(!buildSteps.every(bs => bs instanceof ShapeBuildStep)) {
		    console.error("Family.addShape error: buildSteps not valid");
			return;
		}
		if(!refPoint) {
			console.error("Family.addShape error: refPoint not valid");
			return;
		}

		let shape = new Shape({x: 0, y: 0}, buildSteps, name, this.name, refPoint);
		shape.color = this.defaultColor;

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
		for (var i = 0; i < this.shapes.length; i++) {
			if (this.shapes[i].name == name) {
				return this.shapes[i];
			}
		}
		console.error("Family.getShape: shape not found");
		return null;
	}
}
