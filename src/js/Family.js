/**
 * Représente une famille de formes
 */

/**
 * Constructeur
 * @param name: le nom de la famille (String)
 * @param defaultColor: la couleur par défaut des formes
 */
function Family(app, name, defaultColor) {
	this.app = app;
	this.name = name;
	this.shapesList = [];
	this.defaultColor = defaultColor;
	this.id = null;
}

/**
 * Ajouter une forme à la famille
 * @param name: nom de la forme (String)
 * @param buildSteps: étapes de construction de la forme ([ShapeStep])
 * @param color: la couleur de la forme ("#AABBCC"). Peut être nulle (la couleur par défaut sera alors utilisée)
 */
Family.prototype.addShape = function(name, buildSteps, refPoint, color){
	//Vérifier les arguments
	if(buildSteps.length<1) {
		console.log("Family.addShape error: buildSteps.length is 0");
		return;
	}
	if(color===undefined)
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
Family.prototype.getShape = function(name){
	for (var i = 0; i < this.shapesList.length; i++) {
		if(this.shapesList[i].name==name) {
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
				{"x": refPoint.x, "y": refPoint.y},
				this.app.settings.get('areShapesPointed'),
				this.app.settings.get('areShapesSided'),
				this.app.settings.get('shapesOpacity'));
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
Family.prototype.setId = function(id) {
	this.id = id;
};

/**
 * récupérer la liste des noms des formes de la famille
 * @return liste ([String])
 */
Family.prototype.getShapesNames = function() {
	var names = [];
	for (var i = 0; i < this.shapesList.length; i++) {
		names.push(this.shapesList[i].name);
	}
	return names;
};
