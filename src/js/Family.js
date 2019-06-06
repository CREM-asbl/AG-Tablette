/**
 * Représente une famille de formes
 */
import { Shape } from './Shape'
import { settings } from './Settings';
import { ShapeStep } from './ShapeStep'
import { standardShapes } from './StandardShapes';

export class Family {
	/**
	 * Constructeur
	 * @param name: le nom de la famille (String)
	 * @param defaultColor: la couleur par défaut des formes
	 */
	constructor(name, defaultColor) {
		this.name = name;
		this.shapesList = [];
		this.defaultColor = defaultColor;
		this.id = null;

		// Todo: remplacer le code en fonction du pack chargé
		standardShapes[name].forEach(shape => {
			const buildSteps = shape.steps.map(step => {
				const { type, x, y, angle = null } = step
				return new ShapeStep(type, x, y, angle)
			})
			this.addShape(shape.name, buildSteps, shape.refPoint)
		})
	}

	/**
	 * Ajouter une forme à la famille
	 * @param name: nom de la forme (String)
	 * @param buildSteps: étapes de construction de la forme ([ShapeStep])
	 * @param color: la couleur de la forme ("#AABBCC"). Peut être nulle (la couleur par défaut sera alors utilisée)
	 */
	addShape(name, buildSteps, refPoint, color) {
		//Vérifier les arguments
		if (buildSteps.length < 1) {
			console.log("Family.addShape error: buildSteps.length is 0");
			return;
		}
		if (color === undefined)
			color = this.defaultColor;

		this.shapesList.push({
			"name": name,
			"buildSteps": buildSteps,
			"color": color,
			"refPoint": refPoint
		});
	};

	// Est-ce utile ?
	/**
	 * Renvoie une forme d'une famille à partir de son nom
	 * @param name: le nom de la forme
	 * @return Objet de type Shape (sans coordonnées)
	 */
	getShape(name) {
		for (var i = 0; i < this.shapesList.length; i++) {
			if (this.shapesList[i].name == name) {
				var buildSteps = [];

				for (var j = 0; j < this.shapesList[i].buildSteps.length; j++) {
					var p = this.shapesList[i].buildSteps[j];
					buildSteps.push(p.getCopy());
				}

				var refPoint = this.shapesList[i].refPoint;
				var shape = new Shape(
					this.name, name, //nom de la famille et de la forme
					null, null, //coordonnées
					buildSteps, this.shapesList[i].color, "#000",
					{ "x": refPoint.x, "y": refPoint.y },
					settings.get('areShapesPointed'),
					settings.get('areShapesSided'),
					settings.get('shapesOpacity'));
				return shape;
			}
		}
		console.log("Family.getShape: shape not found");
		return null;
	}

	/**
	 * Défini l'id de la famille
	 * @param id: l'id (int)
	 */
	setId(id) {
		this.id = id;
	}

	/**
	 * récupérer la liste des noms des formes de la famille
	 * @return liste ([String])
	 */
	getShapesNames() {
		return this.shapesList.map(shape => shape.name);
	}
}
