/**
 * Représente un projet: un canvas avec une liste d'objets (formes, points, ...).
 */

/**
 * Constructeur
 * @param app: Référence vers l'application (App)
 */
function Workspace(app) {
	this.app = app;
	this.appVersion = this.app.getVersion();

	//L'id de la prochaine forme qui sera créée
	this.nextShapeId = 1;

	this.history = null; //TODO

	//Le menu sélectionné (A, B, C, AB, AC)
	this.menuId = "A"; //à modifier lorsque d'autres menus seront développés

	//the list of shapes in this project ([Shape])
	this.shapesList = [];

	//the list of shapes ids, ordered by show order. synchronized with shapesList
	this.shapesShowOrder = []; // todo -> shapesList
	//TODO: variable inutile ? utiliser Shape.showOrder ?

	//the list of vertices of all shapes. synchronized with shapesList
	this.points = []; // todo -> shapesList

	//the id of the next family that will be created
	this.nextFamilyId = 1;

	//list of existing families ([Family])
	this.families = [];

	//Groupes de formes qui sont liées par des points
	this.systemShapeGroups = [];

	//Groupes de formes qui ont été liées par l'utilisateur après leur création.
	this.userShapeGroups = []; //TODO remplir, et utiliser pour les déplacements/suppressions?
}

/**
 * Renvoie le groupe (d'un certain type) dont fait partie une forme, ou null si elle ne fait pas partie d'un groupe.
 * @param shape: la forme en question
 * @param type: vaut system (groupe par lien entre points) ou user (groupe créé par l'utilisateur)
 * @return: le groupe ([Shape]), ou null si pas de groupe trouvé
 */
Workspace.prototype.getShapeGroup = function(shape, type){
	if(type=="system") {
		for(var i=0;i<this.systemShapeGroups.length;i++) {
			var group = this.systemShapeGroups[i];
			for(var j=0;j<group.length;j++) {
				if(group[j]==shape) {
					return group;
				}
			}
		}
		return null;
	} else if(type=="user") {
		console.log("Workspace.getShapeGroup: à implémenter");
		return null;
	} else {
		console.log("Workspace.getShapeGroup: bad type");
		return null;
	}
};


/**
 * Renvoie la liste des formes contenant un certain point
 * @param point: le point ({x: int, y: int})
 * @return la liste des formes ([Shape])
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
 * Renvoie la liste des points des formes existantes qui sont proches (< distance de magnétisme) d'un point donné
 * @param point: le point ({x: int, y: int})
 * @return la liste des points ([{shape: Shape, x: int, y: int}])
 */
Workspace.prototype.pointsNearPoint = function(point) {
	//TODO: les renvoyer dans l'ordre d'affichage des formes ?
	var response = [];
	for(var i=0;i<this.points.length;i++) {
		var p = this.points[i];
		var maxDist = this.app.magnetismDistance;
		if(maxDist*maxDist>=(point.x-p.absX)*(point.x-p.absX) + (point.y-p.absY)*(point.y-p.absY)) {
			response.push(p);
		}
	}
	return response;
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

	if(shape.linkedShape) {
		/* Si la forme a un point lié à une autre forme, ajouter cette liaison
		 * dans le tableau systemShapeGroups
		 */
		var group = this.getShapeGroup(shape.linkedShape, "system");
		if(group) {//un groupe existe déjà avec la forme à laquelle la nouvelle est liée
			console.log(group);
			group.push(shape);
		} else //on crée un nouveau groupe
			this.systemShapeGroups.push([shape.linkedShape, shape]);
	}
	for(var i=0; i<shape.points.length;i++) {
		this.points.push(shape.points[i]);
	}
	//TODO update shapesShowOrder? or not ?
};

/**
 * create the Menu A Families and add them to this workspace
 */
Workspace.prototype.addMenuAFamilies = function(){
	var base = 50;

	var f1 = new Family("Triangle équilatéral", "#FF0");

	f1.addShape("Triangle équilatéral",[
		ShapeStep.getLine(25, 7.5 -50),
		ShapeStep.getLine(50, 50 -50),
		ShapeStep.getLine(0, 50 -50),
		ShapeStep.getLine(25, 7.5 -50)
	]);

	f1.addShape("Losange",[
		ShapeStep.getLine(0 -25, 7.5 -50),
		ShapeStep.getLine(50 -25, 7.5 -50),
		ShapeStep.getLine(75 -25, 50 -50),
		ShapeStep.getLine(25 -25, 50 -50),
		ShapeStep.getLine(0 -25, 7.5 -50)
	]);

	f1.addShape("Trapèze isocèle",[
		ShapeStep.getLine(25 - 0, 7.5 - 50),
		ShapeStep.getLine(75 - 0, 7.5 - 50),
		ShapeStep.getLine(100 - 0, 50 - 50),
		ShapeStep.getLine(0 - 0, 50 - 50),
		ShapeStep.getLine(25 - 0, 7.5 - 50)
	]);

	f1.addShape("Hexagone régulier",[
		ShapeStep.getLine(25 - 25, 7.5 - 92.5),
		ShapeStep.getLine(75 - 25, 7.5 - 92.5),
		ShapeStep.getLine(100 - 25, 50 - 92.5),
		ShapeStep.getLine(75 - 25, 92.5 - 92.5),
		ShapeStep.getLine(25 - 25, 92.5 - 92.5),
		ShapeStep.getLine(0 - 25, 50 - 92.5),
		ShapeStep.getLine(25 - 25, 7.5 - 92.5)
	]);

	f1.addShape("Triangle isocèle",[
		ShapeStep.getLine(25 - 0, 28.33 - 50),
		ShapeStep.getLine(50 - 0, 50 - 50),
		ShapeStep.getLine(0 - 0, 50 - 50),
		ShapeStep.getLine(25 - 0, 28.33 - 50)
	]);

	f1.addShape("Triangle rectangle",[
		ShapeStep.getLine(25 - 25, 7.5 - 50),
		ShapeStep.getLine(50 - 25, 50 - 50),
		ShapeStep.getLine(25 - 25, 50 - 50),
		ShapeStep.getLine(25 - 25, 7.5 - 50)
	]);

	f1.addShape("Trapèze rectangle",[
		ShapeStep.getLine(25 - 0, 7.5 - 50),
		ShapeStep.getLine(50 - 0, 50 - 50),
		ShapeStep.getLine(0 - 0, 50 - 50),
		ShapeStep.getLine(0 - 0, 7.5 - 50),
		ShapeStep.getLine(25 - 0, 7.5 - 50)
	]);

	f1.addShape("Dodécagone régulier",[
		ShapeStep.getLine(0 - 0, 50 - 50),
		ShapeStep.getLine(50 - 0, 50 - 50),
		ShapeStep.getLine(93.30127018922194 - 0, 25 - 50),
		ShapeStep.getLine(118.30127018922195 - 0, -18.301270189221928 - 50),
		ShapeStep.getLine(118.30127018922195 - 0, -68.30127018922192 - 50),
		ShapeStep.getLine(93.30127018922197 - 0, -111.60254037844386 - 50),
		ShapeStep.getLine(50.00000000000004 - 0, -136.60254037844388 - 50),
		ShapeStep.getLine(4.263256414560601e-14 - 0, -136.60254037844388 - 50),
		ShapeStep.getLine(-43.301270189221896 - 0, -111.60254037844389 - 50),
		ShapeStep.getLine(-68.30127018922192 - 0, -68.30127018922197 - 50),
		ShapeStep.getLine(-68.30127018922194 - 0, -18.301270189221967 - 50),
		ShapeStep.getLine(-43.30127018922197 - 0, 24.999999999999986 - 50),
		ShapeStep.getLine(0 - 0, 50 - 50)
	]);

	f1.addShape("Grand triangle isocèle",[
		ShapeStep.getLine(0 - 0, 50 - 50),
		ShapeStep.getLine(50 - 0, 50 - 50),
		ShapeStep.getLine(25 - 0, -43.3 - 50),
		ShapeStep.getLine(0 - 0, 50 - 50)
	]);

	f1.addShape("Petit losange",[
		ShapeStep.getLine(0 - 0, 50 - 50),
		ShapeStep.getLine(50 - 0, 50 - 50),
		ShapeStep.getLine(93.30 - 0, 25 - 50),
		ShapeStep.getLine(43.30 - 0, 25 - 50),
		ShapeStep.getLine(0 - 0, 50 - 50)
	]);

	f1.addShape("Petit disque",[
		ShapeStep.getLine(0 - 25, 0 - 25),
		ShapeStep.getArc(25 - 25, 25 - 25, 360, false)
	]);

	f1.addShape("Grand disque",[
		ShapeStep.getLine(0 - 75, 0 - 75),
		ShapeStep.getArc(75 - 75, 75 - 75, 360, false)
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
