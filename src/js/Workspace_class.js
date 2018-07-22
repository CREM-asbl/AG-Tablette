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

	//niveau de zoom de l'interface
	this.zoomLevel = 1;
}

/**
 * Renvoie le groupe (d'un certain type) dont fait partie une forme, ou null si elle ne fait pas partie d'un groupe.
 * @param shape: la forme en question
 * @param type: vaut system (groupe par lien entre points) ou user (groupe créé par l'utilisateur)
 * @return: le groupe ([Shape]), ou null si pas de groupe trouvé
 */ //TODO: une forme ne peut normalement pas faire partie de 2 groupes ? (voir user/system!)
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
		var maxDist = this.app.magnetismDistance / this.zoomLevel;
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
			group.push(shape);
		} else //on crée un nouveau groupe
			this.systemShapeGroups.push([shape.linkedShape, shape]);
	}
	for(var i=0; i<shape.points.length;i++) {
		this.points.push(shape.points[i]);
	}
	//TODO update shapesShowOrder? or not ?
};

Workspace.prototype.getShapeIndex = function(shape){
	var index = -1;
	for(var i=0;i<this.shapesList.length;i++) {
		if(this.shapesList[i]==shape) {
			return i;
		}
	}
	return null;
};

/**
 * supprime une forme
 * @param shape: la forme (Shape)
 */
Workspace.prototype.removeShape = function(shape) {
	var shapeIndex = this.getShapeIndex(shape);
	if(shapeIndex==null) {
		console.log("Workspace.removeShape: couldn't remove the shape");
		return;
	}
	//supprime la forme
	this.shapesList.splice(shapeIndex, 1);

	//supprime les formes créées après la forme supprimée et qui sont (indirectement)
	//liées à cette forme par un point.
	//TODO: attention aux user groups ?

	var that = this;
	var removeLinkedShapes = function(list, srcShape) {
		var to_remove = [];
		for(var i=0;i<list.length;i++) {
			if(list[i].linkedShape==srcShape) { //la forme est liée à la forme supprimée (srcShape)
				var s = list.splice(i, 1)[0]; //la supprimer de la liste du groupe
				var shapeIndex = that.getShapeIndex(s);
				if(shapeIndex==null) {
					console.log("Workspace.removeShape: couldn't remove the linked shape");
				} else {
					that.shapesList.splice(shapeIndex, 1); //la supprimer de la liste des formes
				}

				to_remove.push(	s ); //ajouter la forme pour la récursion
				i--;
			}
		}
		for(var i=0;i<to_remove.length;i++)
			removeLinkedShapes(list, to_remove[i]); //supprimer les formes liées à chacune des formes supprimées dans la boucle précédente.
	};

	var groupLists = [this.systemShapeGroups, this.userShapeGroups];
	for(var g=0;g<groupLists.length;g++) {
		var groupList = groupLists[g];
		//parcours des groupes d'un certain type:
		for(var i=0;i<groupList.length;i++) {
			var group = groupList[i];
			//parcours d'un groupe:
			var found = false;
			for(var j=0;j<group.length;j++) {
				if(group[j]==shape) { //on a trouvé la forme dans le groupe
					found = true;
					group.splice(j, 1); //supprimer cette forme du groupe
					break;
				}
			}
			if(found) {
				removeLinkedShapes(group, shape); //supprimer (récursivement) les formes liées à la forme supprimée
			}

			if(group.length<=1) {
				groupList.splice(i, 1);
				i--;
			}
		}
	}

};

/**
 * create the Menu A Families and add them to this workspace
 */
Workspace.prototype.addMenuAFamilies = function(){
	var base = 50;

	var f1 = new Family("Triangle équilatéral", "#FF0");

	f1.addShape("Triangle équilatéral",[
		ShapeStep.getLine(25-25, -42.5+14.1666666666666667),
		ShapeStep.getLine(50-25, 0+14.1666666666666667),
		ShapeStep.getLine(0-25, 0+14.1666666666666667),
		ShapeStep.getLine(25-25, -42.5+14.1666666666666667)
	], {"x": -25, "y": 14.1666666666666667});

	f1.addShape("Losange",[
		ShapeStep.getLine(-25-12.5, -42.5+21.25),
		ShapeStep.getLine(25-12.5, -42.5+21.25),
		ShapeStep.getLine(50-12.5, 0+21.25),
		ShapeStep.getLine(0-12.5, 0+21.25),
		ShapeStep.getLine(-25-12.5, -42.5+21.25)
	], {"x": -12.5, "y": 21.25});

	f1.addShape("Trapèze isocèle",[
		ShapeStep.getLine(25-50, -42.5+21.25),
		ShapeStep.getLine(75-50, -42.5+21.25),
		ShapeStep.getLine(100-50, 0+21.25),
		ShapeStep.getLine(0-50, 0+21.25),
		ShapeStep.getLine(25-50, -42.5+21.25)
	], {"x": -50, "y": 21.25});

	f1.addShape("Hexagone régulier",[
		ShapeStep.getLine(0-25, -85+42.5),
		ShapeStep.getLine(50-25, -85+42.5),
		ShapeStep.getLine(75-25, -42.5+42.5),
		ShapeStep.getLine(50-25, 0+42.5),
		ShapeStep.getLine(0-25, 0+42.5),
		ShapeStep.getLine(-25-25, -42.5+42.5),
		ShapeStep.getLine(0-25, -85+42.5)
	], {"x": -25, "y": 42.5});

	f1.addShape("Triangle isocèle",[
		ShapeStep.getLine(25-25, -21.67+7.22333333333333),
		ShapeStep.getLine(50-25, 0+7.22333333333333),
		ShapeStep.getLine(0-25, 0+7.22333333333333),
		ShapeStep.getLine(25-25, -21.67+7.22333333333333)
	], {"x": -25, "y": 7.22333333333333});

	f1.addShape("Triangle rectangle",[
		ShapeStep.getLine(0-8.3333333333333, -42.5 +14.166666666667),
		ShapeStep.getLine(25-8.3333333333333, 0 +14.166666666667),
		ShapeStep.getLine(0-8.3333333333333, 0 +14.166666666667),
		ShapeStep.getLine(0-8.3333333333333, -42.5+14.166666666667)
	], {"x": -8.3333333333333, "y": 14.166666666667});

	f1.addShape("Trapèze rectangle",[
		ShapeStep.getLine(25-19.121449612403, -42.5+19.987071317829),
		ShapeStep.getLine(50-19.121449612403, 0+19.987071317829),
		ShapeStep.getLine(0-19.121449612403, 0+19.987071317829),
		ShapeStep.getLine(0-19.121449612403, -42.5+19.987071317829),
		ShapeStep.getLine(25-19.121449612403, -42.5+19.987071317829)
	], {"x": -19.121449612403, "y": 19.987071317829}); //chouette à calculer...

	f1.addShape("Dodécagone régulier",[
		ShapeStep.getLine(0-25, 0+93.3012701892),
		ShapeStep.getLine(50-25, 0+93.3012701892),
		ShapeStep.getLine(93.30127018922194-25, -25+93.3012701892),
		ShapeStep.getLine(118.30127018922195-25, -68.301270189221928+93.3012701892),
		ShapeStep.getLine(118.30127018922195-25, -118.30127018922192+93.3012701892),
		ShapeStep.getLine(93.30127018922197-25, -161.60254037844386+93.3012701892),
		ShapeStep.getLine(50.00000000000004-25, -186.60254037844388+93.3012701892),
		ShapeStep.getLine(4.263256414560601e-14-25, -186.60254037844388+93.3012701892),
		ShapeStep.getLine(-43.301270189221896-25, -161.60254037844389+93.3012701892),
		ShapeStep.getLine(-68.30127018922192-25, -118.30127018922197+93.3012701892),
		ShapeStep.getLine(-68.30127018922194-25, -68.301270189221967+93.3012701892),
		ShapeStep.getLine(-43.30127018922197-25, -25+93.3012701892),
		ShapeStep.getLine(0-25, 0+93.3012701892)
	], {"x": -25, "y": 93.3012701892});

	f1.addShape("Grand triangle isocèle",[
		ShapeStep.getLine(0-25, 0+31.1),
		ShapeStep.getLine(50-25, 0+31.1),
		ShapeStep.getLine(25-25, -93.3+31.1),
		ShapeStep.getLine(0-25, 0+31.1)
	], {"x": -25, "y": 31.1});

	f1.addShape("Petit losange",[
		ShapeStep.getLine(0-46.65, 0+12.5),
		ShapeStep.getLine(50-46.65, 0+12.5),
		ShapeStep.getLine(93.30-46.65, -25+12.5),
		ShapeStep.getLine(43.30-46.65, -25+12.5),
		ShapeStep.getLine(0-46.65, 0+12.5)
	], {"x": -46.65, "y": 12.5});

	f1.addShape("Petit disque",[
		ShapeStep.getLine(-25, -25),
		ShapeStep.getArc(0, 0, 360, false)
	], {"x": 0, "y": 0});

	f1.addShape("Grand disque",[
		ShapeStep.getLine(-75, -75),
		ShapeStep.getArc(0, 0, 360, false)
	], {"x": 0, "y": 0});

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

/**
 * définir le niveau de zoom général du canvas
 * @param newZoomLevel: le niveau de zoom, entre 0.1 et 10 (float)
 * @param doRefresh (@default true): si vaut false, ne va pas mettre le canvas à jour
 */
Workspace.prototype.setZoomLevel = function(newZoomLevel, doRefresh) {
	if(newZoomLevel<0.1)
		newZoomLevel = 0.1;
	if(newZoomLevel>10)
		newZoomLevel = 10


	var oldZoomLevel = this.zoomLevel;

	this.app.canvas.updateRelativeScaleLevel(1 / oldZoomLevel);
	this.app.canvas.updateRelativeScaleLevel(newZoomLevel);

	this.zoomLevel = newZoomLevel;
	if(doRefresh!==false)
		this.app.canvas.refresh();
};
