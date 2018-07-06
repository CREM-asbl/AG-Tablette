/**
 * Represent a family of shapes
 */

/**
 * Constructor
 * @param name: the family name (String)
 * @param defaultColor: the color of the shapes (if the shape has not a specific color)
 */
function Family(name, defaultColor) {
	this.name = name;
	this.shapesList = [];
	this.defaultColor = defaultColor;
	this.id = null;
}

/**
 * add a shape to the family
 * @param name: the shape's name (String)
 * @param buildSteps: the shape's builds steps ([ShapeStep])
 * @param color: the shape color ("#AABBCC"). Can be null (in this case, the family default color will be used)
 */
Family.prototype.addShape = function(name, buildSteps, color){
	//Check arguments
	if(buildSteps.length<1) {
		console.log("Family.addShape error: buildSteps.length is 0");
		return;
	}
	if(color===undefined)
		color = this.defaultColor;


	this.shapesList.push({
		"name": name,
		"buildSteps": buildSteps,
		"color": color
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

			var shape = new Shape(
				this.name, name, //nom de la famille et de la forme
				null, null, //coordonnées
				buildSteps, this.shapesList[i].color);
			return shape;
		}
	}
	console.log("Family.getShape: shape not found");
	return null;
}

/**
 * set the id of the family
 * @param id: the id (int)
 */
Family.prototype.setId = function(id) {
	this.id = id;
};

/**
 * get the list of the shape's names
 * @return the list in question
 */
Family.prototype.getShapesNames = function() {
	var names = [];
	for (var i = 0; i < this.shapesList.length; i++) {
		names.push(this.shapesList[i].name);
	}
	return names;
};
