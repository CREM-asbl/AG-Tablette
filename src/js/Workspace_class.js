/**
 * Represent a project: one canvas view with an object list (shapes, points, ...).
 */

/**
 * Constructor
 * @param app: app reference (App)
 */
function Workspace(app) {
	this.app = app;
	this.appVersion = this.app.getVersion();

	//the id of the next shape that will be created
	this.nextShapeId = 1;
	
	this.history = null; //todo: class

	//the selected menu (A, B, C, AB, AC)
	this.menuId = "A"; //todo: edit this when other menu will be developed

	//the list of shapes in this project ([Shape])
	this.shapesList = [];

	//the list of shapes ids, ordered by show order. synchronized with shapesList
	this.shapesShowOrder = []; // todo -> shapesList

	//the list of vertices of all shapes. synchronized with shapesList
	this.points = []; // todo -> shapesList

	//the id of the next family that will be created
	this.nextFamilyId = 1;

	//list of existing families ([Family])
	this.families = [];
}

/**
 * get the list of shapes that contains a given point
 * @param point: the point ({x: int, y: int})
 * @return the list of shapes ([Shape])
 */
Workspace.prototype.shapesOnPoint = function(point){
	var list = [];
	for (var i = 0; i < this.shapesList.length; i++) {
		if(this.shapesList[i].containsPoint(point))
			list.push(this.shapesList[i]);
	}
	return list;
};

/**
 * Static method: get the list of existing families names
 * @return families names
 */
Workspace.getMenuAFamiliesNames = function(){
	return [
		"Triangle équilatéral",
		"Carré",
		"Pentagone régulier"
	];
};

/**
 * add a family to the workspace
 * @param family: the family (Family)
 */
Workspace.prototype.addFamily = function(family){
	family.setId(this.nextFamilyId++);
	this.families.push(family);
};

/**
 * add a shape to the workspace
 * @param shape: the shape (Shape)
 */
Workspace.prototype.addShape = function(shape){
	shape.setId(this.nextShapeId++);
	this.shapesList.push(shape);
	//todo update shapesShowOrder and points
};

/**
 * create the Menu A Families and add them to this workspace
 */
Workspace.prototype.addMenuAFamilies = function(){
	var base = 50;

	var f1 = new Family("Triangle équilatéral", "#FF0");
	
	f1.addShape("Triangle équilatéral",[
		ShapeStep.getLine(25 - 25, 7.5 -25),
		ShapeStep.getLine(50 -25, 50 -25),
		ShapeStep.getLine(0 -25, 50 -25),
		ShapeStep.getLine(25 - 25, 7.5 -25)
	]);

	f1.addShape("Losange",[
		ShapeStep.getLine(0 -25, 7.5 -25),
		ShapeStep.getLine(50 -25, 7.5 -25),
		ShapeStep.getLine(75 -25, 50 -25),
		ShapeStep.getLine(25 -25, 50 -25),
		ShapeStep.getLine(0 -25, 7.5 -25)
	]);

	f1.addShape("Trapèze isocèle",[
		ShapeStep.getLine(25 - 25, 7.5 - 25),
		ShapeStep.getLine(75 - 25, 7.5 - 25),
		ShapeStep.getLine(100 - 25, 50 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(25 - 25, 7.5 - 25)
	]);

	f1.addShape("Hexagone régulier",[
		ShapeStep.getLine(25 - 25, 7.5 - 25),
		ShapeStep.getLine(75 - 25, 7.5 - 25),
		ShapeStep.getLine(100 - 25, 50 - 25),
		ShapeStep.getLine(75 - 25, 92.5 - 25),
		ShapeStep.getLine(25 - 25, 92.5 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(25 - 25, 7.5 - 25)
	]);

	f1.addShape("Triangle isocèle",[
		ShapeStep.getLine(25 - 25, 28.33 - 25),
		ShapeStep.getLine(50 - 25, 50 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(25 - 25, 28.33 - 25)
	]);

	f1.addShape("Triangle rectangle",[
		ShapeStep.getLine(25 - 25, 7.5 - 25),
		ShapeStep.getLine(50 - 25, 50 - 25),
		ShapeStep.getLine(25 - 25, 50 - 25),
		ShapeStep.getLine(25 - 25, 7.5 - 25)
	]);

	f1.addShape("Trapèze rectangle",[
		ShapeStep.getLine(25 - 25, 7.5 - 25),
		ShapeStep.getLine(50 - 25, 50 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(0 - 25, 7.5 - 25),
		ShapeStep.getLine(25 - 25, 7.5 - 25)
	]);

	f1.addShape("Dodécagone régulier",[
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(50 - 25, 50 - 25),
		ShapeStep.getLine(93.30127018922194 - 25, 25 - 25),
		ShapeStep.getLine(118.30127018922195 - 25, -18.301270189221928 - 25),
		ShapeStep.getLine(118.30127018922195 - 25, -68.30127018922192 - 25),
		ShapeStep.getLine(93.30127018922197 - 25, -111.60254037844386 - 25),
		ShapeStep.getLine(50.00000000000004 - 25, -136.60254037844388 - 25),
		ShapeStep.getLine(4.263256414560601e-14 - 25, -136.60254037844388 - 25),
		ShapeStep.getLine(-43.301270189221896 - 25, -111.60254037844389 - 25),
		ShapeStep.getLine(-68.30127018922192 - 25, -68.30127018922197 - 25),
		ShapeStep.getLine(-68.30127018922194 - 25, -18.301270189221967 - 25),
		ShapeStep.getLine(-43.30127018922197 - 25, 24.999999999999986 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25)
	]);

	f1.addShape("Grand triangle isocèle",[
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(50 - 25, 50 - 25),
		ShapeStep.getLine(25 - 25, -43.3 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25)
	]);

	f1.addShape("Petit losange",[
		ShapeStep.getLine(0 - 25, 50 - 25),
		ShapeStep.getLine(50 - 25, 50 - 25),
		ShapeStep.getLine(93.30 - 25, 25 - 25),
		ShapeStep.getLine(43.30 - 25, 25 - 25),
		ShapeStep.getLine(0 - 25, 50 - 25)
	]);

	f1.addShape("Petit disque",[
		ShapeStep.getLine(0 - 25, 0 - 25),
		ShapeStep.getArc(25 - 25, 30 - 25, 360, false)
	]);

	f1.addShape("Grand disque",[
		ShapeStep.getLine(0 - 25, 0 - 25),
		ShapeStep.getArc(75 - 25, 60 - 25, 360, false)
	]);

	/*
	f1.addShape("AAAAAAAA",[
		ShapeStep.getLine(XXXXX, YYYYY),
		ShapeStep.getLine(XXXXX, YYYYY),
		ShapeStep.getLine(XXXXX, YYYYY),
		ShapeStep.getLine(XXXXX, YYYYY),
		ShapeStep.getLine(XXXXX, YYYYY),
		ShapeStep.getLine(XXXXX, YYYYY),
	]);
	*/

	this.addFamily(f1);


	var f2 = new Family("Carré", "#F00");
	this.addFamily(f2);


	var f3 = new Family("Pentagone régulier", "#0F0");
	this.addFamily(f3);
	

};

/**
 * get the list of the existing families names
 * @return list of the names ([String])
 */
Workspace.prototype.getFamiliesNames = function() {
	var names = [];
	for (var i = 0; i < this.families.length; i++) {
		names.push(this.families[i].name);
	}
	return names;
};

/**
 * get a family object from the family name
 * @param name: the family name (String)
 * @return the family object (Family)
 */
Workspace.prototype.getFamily = function(name) {
	for (var i = 0; i < this.families.length; i++) {
		if(this.families[i].name==name)
			return this.families[i];
	}
	console.log("Workspace.getFamily: family not found");
	return null;
};
