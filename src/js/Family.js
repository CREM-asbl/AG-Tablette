/**
 * Représente une famille de formes
 */
import { Shape } from './Shape'
import { settings } from './Settings';
import { ShapeStep } from './ShapeStep'

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

		// TODO: rendre les définitions indépendantes du code
		switch (name) {
			case 'Triangle équilatéral':
				this.addShape("Triangle équilatéral", [
					new ShapeStep('line', 25 - 25, -43.3012701892 + 14.433756729733),
					new ShapeStep('line', 0 - 25, 0 + 14.433756729733),
					new ShapeStep('line', 50 - 25, 0 + 14.433756729733),
					new ShapeStep('line', 25 - 25, -43.3012701892 + 14.433756729733)
				], { "x": -25, "y": +14.433756729733 });

				this.addShape("Losange", [
					new ShapeStep('line', -25 - 12.5, -43.3012701892 + 21.650635094600),
					new ShapeStep('line', 0 - 12.5, 0 + 21.650635094600),
					new ShapeStep('line', 50 - 12.5, 0 + 21.650635094600),
					new ShapeStep('line', 25 - 12.5, -43.3012701892 + 21.650635094600),
					new ShapeStep('line', -25 - 12.5, -43.3012701892 + 21.650635094600)
				], { "x": -12.5, "y": +21.650635094600 });

				this.addShape("Trapèze isocèle", [
					new ShapeStep('line', 25 - 50, -43.3012701892 + 21.650635094600),
					new ShapeStep('line', 0 - 50, 0 + 21.650635094600),
					new ShapeStep('line', 100 - 50, 0 + 21.650635094600),
					new ShapeStep('line', 75 - 50, -43.3012701892 + 21.650635094600),
					new ShapeStep('line', 25 - 50, -43.3012701892 + 21.650635094600)
				], { "x": -50, "y": +21.650635094600 });

				this.addShape("Hexagone régulier", [
					new ShapeStep('line', 0 - 25, -86.6025403784 + 43.3012701892),
					new ShapeStep('line', -25 - 25, -43.3012701892 + 43.3012701892),
					new ShapeStep('line', 0 - 25, 0 + 43.3012701892),
					new ShapeStep('line', 50 - 25, 0 + 43.3012701892),
					new ShapeStep('line', 75 - 25, -43.3012701892 + 43.3012701892),
					new ShapeStep('line', 50 - 25, -86.6025403784 + 43.3012701892),
					new ShapeStep('line', 0 - 25, -86.6025403784 + 43.3012701892)
				], { "x": -25, "y": +43.3012701892 });

				this.addShape("Triangle isocèle", [
					new ShapeStep('line', 25 - 25, -14.433756729747 + 4.811252243249),
					new ShapeStep('line', 0 - 25, 0 + 4.811252243249),
					new ShapeStep('line', 50 - 25, 0 + 4.811252243249),
					new ShapeStep('line', 25 - 25, -14.433756729747 + 4.811252243249)
				], { "x": -25, "y": +4.811252243249 });

				this.addShape("Triangle rectangle", [
					new ShapeStep('line', 0 - 8.3333333333333, -43.3012701892 + 14.433756729733),
					new ShapeStep('line', 0 - 8.3333333333333, 0 + 14.433756729733),
					new ShapeStep('line', 25 - 8.3333333333333, 0 + 14.433756729733),
					new ShapeStep('line', 0 - 8.3333333333333, -43.3012701892 + 14.433756729733)
				], { "x": -8.3333333333333, "y": +14.433756729733 });

				this.addShape("Trapèze rectangle", [
					new ShapeStep('line', 25 - 18.75, -43.3012701892 + 21.650635094600),
					new ShapeStep('line', 0 - 18.75, -43.3012701892 + 21.650635094600),
					new ShapeStep('line', 0 - 18.75, 0 + 21.650635094600),
					new ShapeStep('line', 50 - 18.75, 0 + 21.650635094600),
					new ShapeStep('line', 25 - 18.75, -43.3012701892 + 21.650635094600)
				], { "x": -18.75, "y": +21.650635094600 });

				this.addShape("Dodécagone régulier", [
					new ShapeStep('line', 0 - 25, 0 + 93.301270189200),
					new ShapeStep('line', 50 - 25, 0 + 93.301270189200),
					new ShapeStep('line', 93.301270189200 - 25, -25 + 93.301270189200),
					new ShapeStep('line', 118.301270189200 - 25, -68.301270189200 + 93.301270189200),
					new ShapeStep('line', 118.301270189200 - 25, -118.301270189200 + 93.301270189200),
					new ShapeStep('line', 93.301270189200 - 25, -161.602540378400 + 93.301270189200),
					new ShapeStep('line', 50 - 25, -186.602540378400 + 93.301270189200),
					new ShapeStep('line', 0 - 25, -186.602540378400 + 93.301270189200),
					new ShapeStep('line', -43.301270189200 - 25, -161.602540378400 + 93.301270189200),
					new ShapeStep('line', -68.301270189200 - 25, -118.301270189200 + 93.301270189200),
					new ShapeStep('line', -68.301270189200 - 25, -68.301270189200 + 93.301270189200),
					new ShapeStep('line', -43.301270189200 - 25, -25 + 93.301270189200),
					new ShapeStep('line', 0 - 25, 0 + 93.301270189200)
				], { "x": -25, "y": +93.301270189200 });

				this.addShape("Grand triangle isocèle", [
					new ShapeStep('line', 0 - 25, 0 + 31.100423396400),
					new ShapeStep('line', 50 - 25, 0 + 31.100423396400),
					new ShapeStep('line', 25 - 25, -93.301270189200 + 31.100423396400),
					new ShapeStep('line', 0 - 25, 0 + 31.100423396400)
				], { "x": -25, "y": +31.100423396400 });

				this.addShape("Petit losange", [
					new ShapeStep('line', 0 - 46.650635094600, 0 + 12.5),
					new ShapeStep('line', 50 - 46.650635094600, 0 + 12.5),
					new ShapeStep('line', 93.301270189200 - 46.650635094600, -25 + 12.5),
					new ShapeStep('line', 43.301270189200 - 46.650635094600, -25 + 12.5),
					new ShapeStep('line', 0 - 46.650635094600, 0 + 12.5)
				], { "x": -46.650635094600, "y": +12.5 });

				this.addShape("Petit disque", [
					new ShapeStep('line', 0, -28.867513459466),
					new ShapeStep('arc', 0, 0, 2 * Math.PI, false)
				], { "x": 0, "y": 0 });

				this.addShape("Grand disque", [
					new ShapeStep('line', 0, -50),
					new ShapeStep('arc', 0, 0, 2 * Math.PI, false)
				], { "x": 0, "y": 0 });

				break

			case 'Carré':
				this.addShape("Carré", [
					new ShapeStep('line', 0 - 25, 0 + 25),
					new ShapeStep('line', 50 - 25, 0 + 25),
					new ShapeStep('line', 50 - 25, -50 + 25),
					new ShapeStep('line', 0 - 25, -50 + 25),
					new ShapeStep('line', 0 - 25, 0 + 25)
				], { "x": -25, "y": +25 });

				this.addShape("Triangle isocèle", [
					new ShapeStep('line', 0 - 25, 0 + 20.118446353109),
					new ShapeStep('line', 50 - 25, 0 + 20.118446353109),
					new ShapeStep('line', 25 - 25, -60.355339059329 + 20.118446353109),
					new ShapeStep('line', 0 - 25, 0 + 20.118446353109)
				], { "x": -25, "y": +20.118446353109 });

				this.addShape("Petit triangle rectangle isocèle", [
					new ShapeStep('line', 0 - 25, 0 + 12.5),
					new ShapeStep('line', 50 - 25, 0 + 12.5),
					new ShapeStep('line', 25 - 25, -25 + 12.5),
					new ShapeStep('line', 0 - 25, 0 + 12.5)
				], { "x": -25, "y": +12.5 });

				this.addShape("Triangle rectangle isocèle", [
					new ShapeStep('line', 0 - 16.666666666666, 0 + 16.666666666666),
					new ShapeStep('line', 50 - 16.666666666666, 0 + 16.666666666666),
					new ShapeStep('line', 0 - 16.666666666666, -50 + 16.666666666666),
					new ShapeStep('line', 0 - 16.666666666666, 0 + 16.666666666666)
				], { "x": -16.666666666666, "y": +16.666666666666 });

				this.addShape("Petit triangle rectangle", [
					new ShapeStep('line', 0 - 16.666666666666, 0 + 16.666666666666),
					new ShapeStep('line', 25 - 16.666666666666, 0 + 16.666666666666),
					new ShapeStep('line', 25 - 16.666666666666, -50 + 16.666666666666),
					new ShapeStep('line', 0 - 16.666666666666, 0 + 16.666666666666)
				], { "x": -16.666666666666, "y": +16.666666666666 });

				this.addShape("Parallélogramme", [
					new ShapeStep('line', 0, 0 + 25),
					new ShapeStep('line', 50, 0 + 25),
					new ShapeStep('line', 0, -50 + 25),
					new ShapeStep('line', -50, -50 + 25),
					new ShapeStep('line', 0, 0 + 25)
				], { "x": 0, "y": +25 });

				this.addShape("Petit losange", [
					new ShapeStep('line', 0 - 42.677669529664, 0 + 17.677669529664),
					new ShapeStep('line', 50 - 42.677669529664, 0 + 17.677669529664),
					new ShapeStep('line', 85.355339059329 - 42.677669529664, -35.355339059329 + 17.677669529664),
					new ShapeStep('line', 35.355339059329 - 42.677669529664, -35.355339059329 + 17.677669529664),
					new ShapeStep('line', 0 - 42.677669529664, 0 + 17.677669529664)
				], { "x": -17.677669529664, "y": +17.677669529664 });

				this.addShape("Octogone régulier", [
					new ShapeStep('line', 0 - 25, 0 + 60.355339059329),
					new ShapeStep('line', 50 - 25, 0 + 60.355339059329),
					new ShapeStep('line', 85.355339059329 - 25, -35.355339059329 + 60.355339059329),
					new ShapeStep('line', 85.355339059329 - 25, -85.355339059329 + 60.355339059329),
					new ShapeStep('line', 50 - 25, -120.710678118658 + 60.355339059329),
					new ShapeStep('line', 0 - 25, -120.710678118658 + 60.355339059329),
					new ShapeStep('line', -35.355339059329 - 25, -85.355339059329 + 60.355339059329),
					new ShapeStep('line', -35.355339059329 - 25, -35.355339059329 + 60.355339059329),
					new ShapeStep('line', 0 - 25, 0 + 60.355339059329)
				], { "x": -25, "y": +60.355339059329 });

				this.addShape("Disque", [
					new ShapeStep('line', 0, -35.355339059327),
					new ShapeStep('arc', 0, 0, 2 * Math.PI, false)
				], { "x": 0, "y": 0 });
				break

			case 'Pentagone régulier':
				this.addShape("Pentagone régulier", [
					new ShapeStep('line', 0 - 25, 0 + 34.409548011750),
					new ShapeStep('line', 50 - 25, 0 + 34.409548011750),
					new ShapeStep('line', 65.450849718737 - 25, -47.552825814750 + 34.409548011750),
					new ShapeStep('line', 25 - 25, -76.942088429350 + 34.409548011750),
					new ShapeStep('line', -15.450849718737 - 25, -47.552825814750 + 34.409548011750),
					new ShapeStep('line', 0 - 25, 0 + 34.409548011750)
				], { "x": -25, "y": +34.409548011750 });

				this.addShape("Petit triangle isocèle", [
					new ShapeStep('line', 0 - 25, 0 + 11.469849337250),
					new ShapeStep('line', 50 - 25, 0 + 11.469849337250),
					new ShapeStep('line', 25 - 25, -34.409548011750 + 11.469849337250),
					new ShapeStep('line', 0 - 25, 0 + 11.469849337250)
				], { "x": -25, "y": +11.469849337250 });

				this.addShape("Grand triangle isocèle", [
					new ShapeStep('line', 0 - 25, 0 + 25.647362809800),
					new ShapeStep('line', 50 - 25, 0 + 25.647362809800),
					new ShapeStep('line', 25 - 25, -76.942088429400 + 25.647362809800),
					new ShapeStep('line', 0 - 25, 0 + 25.647362809800)
				], { "x": -25, "y": +25.647362809800 });

				this.addShape("Triangle obtusangle", [
					new ShapeStep('line', 0 - 43.63389981246667, 0 + 51.2947256196),
					new ShapeStep('line', 105.9016994374 - 43.63389981246667, -76.9420884294 + 51.2947256196),
					new ShapeStep('line', 25 - 43.63389981246667, -76.9420884294 + 51.2947256196),
					new ShapeStep('line', 0 - 43.63389981246667, 0 + 51.2947256196)
				], { "x": -43.63389981246667, "y": +51.2947256196 });

				this.addShape("Petit losange", [
					new ShapeStep('line', 0 - 45.225424859350, 0 + 14.694631307300),
					new ShapeStep('line', 50 - 45.225424859350, 0 + 14.694631307300),
					new ShapeStep('line', 90.4508497187 - 45.225424859350, -29.3892626146 + 14.694631307300),
					new ShapeStep('line', 40.4508497187 - 45.225424859350, -29.3892626146 + 14.694631307300),
					new ShapeStep('line', 0 - 45.225424859350, 0 + 14.694631307300)
				], { "x": -45.225424859350, "y": +14.694631307300 });

				this.addShape("Décagone régulier", [
					new ShapeStep('line', 0 - 25, 0 + 76.942088429400),
					new ShapeStep('line', 50 - 25, 0 + 76.942088429400),
					new ShapeStep('line', 90.4508497187 - 25, -29.3892626146 + 76.942088429400),
					new ShapeStep('line', 105.9016994374 - 25, -76.9420884294 + 76.942088429400),
					new ShapeStep('line', 90.4508497187 - 25, -124.4949142442 + 76.942088429400),
					new ShapeStep('line', 50 - 25, -153.8841768588 + 76.942088429400),
					new ShapeStep('line', 0 - 25, -153.8841768588 + 76.942088429400),
					new ShapeStep('line', -40.4508497187 - 25, -124.4949142442 + 76.942088429400),
					new ShapeStep('line', -55.9016994374 - 25, -76.9420884294 + 76.942088429400),
					new ShapeStep('line', -40.4508497187 - 25, -29.3892626146 + 76.942088429400),
					new ShapeStep('line', 0 - 25, 0 + 76.942088429400)
				], { "x": -25, "y": +76.942088429400 });

				this.addShape("Disque", [
					new ShapeStep('line', 0, -42.5325404176),
					new ShapeStep('arc', 0, 0, 2 * Math.PI, false)
				], { "x": 0, "y": 0 });
		}
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
