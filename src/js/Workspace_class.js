/**
 * Représente un projet: un canvas avec une liste d'objets (formes, points, ...).
 */

/**
 * Constructeur
 * @param app: Référence vers l'application (App)
 */
function Workspace(app) {
	//référence vers l'application
	this.app = app;

	//Version de l'application dans laquelle ce projet a été créé
	this.appVersion = this.app.getVersion();

	//L'id de la prochaine forme qui sera créée
	this.nextShapeId = 1;

	//Représente l'historique
	this.history = null; //TODO

	//Le menu sélectionné (A, B, C, AB, AC)
	this.menuId = "A"; //à modifier lorsque d'autres menus seront développés

	//liste des formes du projet ([Shape])
	this.shapesList = [];

	//liste des points de toutes les formes ajoutées. (synchronisé avec shapesList)
	this.points = [];

	//L'id de la prochaine famille qui sera créée
	this.nextFamilyId = 1;

	//Liste des familles existantes ([Family])
	this.families = [];

	/**
	 * Groupes. Une forme fait partie de 0 ou 1 'systemGroup', et de 0 ou 1 'userGroup'
	 * Les systemGroup sont créés automatiquement lorsqu'un utilisateur crée une forme en cliquant
	 * sur un point d'une autre forme (ce qui implique que les 2 formes seront liées).
	 * Les userGroup sont créés manuellement par l'utilisateur en sélectionnant plusieurs formes.
	 */

	//Groupes de formes qui sont liées par des points
	this.systemShapeGroups = [];

	//Groupes de formes qui ont été liées par l'utilisateur après leur création.
	this.userShapeGroups = [];

	//niveau de zoom de l'interface
	this.zoomLevel = 1;

	//true si les formes ajoutées à l'avenir auront leurs sommets visibles
	this.areShapesPointed = false; // (défini dans les paramètres de l'application)

	//true si les formes ajoutées à l'avenir seront bifaces
	this.areShapesSided = false; // (défini dans les paramètres de l'application)

	//opacité des formes qui seront ajoutées
	this.shapesOpacity = 0.7; //0, 0.7, 1 (défini dans les paramètres de l'application)

	//taille des formes qui seront ajoutées
	this.shapesSize = 1; //1,2,3 (défini dans les paramètres de l'application)

	//max 16 colors
	this.previousSelectedColors = ["#FF0000", "#00FF00", "#0000FF"];

	/**
	 * Paramètres d'affichage de la grille.
	 * Le point de référence de la grille est le point (10,10).
	 * Si grille carrée: le côté du carré est de 50 unités. (-> ex de points: (60, 60), (60,10), (10,60), ...)
	 * Si grille triangulaire: la base du triangle est de 50 unités, et le triangle est équilatéral.
	 * 		(-> Ex de points: (-15, 52.5), (35, 52.5), (60, 10), ...)
	 */
	this.isGridShown = false;
	this.gridOptions = {
		'type': 'square', //square ou triangle
		'size': 1 //1 par défaut
	};

	//Ajustement automatique des formes activé ?
	this.automaticAdjustment = true;

	this.divideStateNumberOfParts = 2;

}

/**
 * Renvoie le point de la grille le plus proche d'un point quelconque d'un groupe de forme
 * @param  {[Shape]} shapesList liste des formes
 * @return {{'grid': point, 'shape': point}} le point de la grille le plus proche, et le point correspondant du groupe de forme.
 * Note: l'objet shape peut également être un objet n'ayant que la propriété "points", contenant une liste d'objets ayant les propriétés absX et absY.
 */
Workspace.prototype.getClosestGridPoint = function (shapesList) {
	var pointsList = [];
	for(var i=0;i<shapesList.length;i++) {
		for(var j=0;j<shapesList[i].points.length;j++) {
			pointsList.push({'x': shapesList[i].points[j].absX, 'y': shapesList[i].points[j].absY});
		}
	}
	var that = this;
	var getClosestPoint = function(point){
		var possibilities = [];
		var gridSize = that.gridOptions.size;
		if(that.gridOptions.type=='square') {
			var topleft = {
				'x': point.x - ( (point.x - 10) % (50*that.gridOptions.size) ),
				'y': point.y - ( (point.y - 10) % (50*that.gridOptions.size) )
			};
			possibilities.push(topleft);
			possibilities.push({'x': topleft.x, 'y': topleft.y+50*that.gridOptions.size});
			possibilities.push({'x': topleft.x+50*that.gridOptions.size, 'y': topleft.y});
			possibilities.push({'x': topleft.x+50*that.gridOptions.size, 'y': topleft.y+50*that.gridOptions.size});
		} else if(that.gridOptions.type=='triangle') {
			var topleft1 = {
				'x': point.x - ( (point.x - 10) % (50*that.gridOptions.size) ),
				'y': point.y - ( (point.y - 10) % (85*that.gridOptions.size) )
			};
			var topleft2 = {
				'x': point.x - ( (point.x - (10+25*that.gridOptions.size)) % (50*that.gridOptions.size) ),
				'y': point.y - ( (point.y - (10+ 42.5*that.gridOptions.size)) % (85*that.gridOptions.size) )
			};
			possibilities.push(topleft1);
			possibilities.push({'x': topleft1.x, 'y': topleft1.y+85*that.gridOptions.size});
			possibilities.push({'x': topleft1.x+50*that.gridOptions.size, 'y': topleft1.y});
			possibilities.push({'x': topleft1.x+50*that.gridOptions.size, 'y': topleft1.y+85*that.gridOptions.size});

			possibilities.push(topleft2);
			possibilities.push({'x': topleft2.x, 'y': topleft2.y+85*that.gridOptions.size});
			possibilities.push({'x': topleft2.x+50*that.gridOptions.size, 'y': topleft2.y});
			possibilities.push({'x': topleft2.x+50*that.gridOptions.size, 'y': topleft2.y+85*that.gridOptions.size});
		} else {
			console.log("Workspace.getClosestGridPoint: unknown type: "+that.gridOptions.type);
			return null;
		}

		var closest = possibilities[0];
		var smallestSquareDist = Math.pow(closest.x-point.x, 2) + Math.pow(closest.y-point.y, 2);
		for(var i=1;i<possibilities.length;i++) {
			var d = Math.pow(possibilities[i].x-point.x, 2) + Math.pow(possibilities[i].y-point.y, 2);
			if(d<smallestSquareDist) {
				smallestSquareDist = d;
				closest = possibilities[i];
			}
		}

		return {'dist': Math.sqrt(smallestSquareDist), 'point': closest};
	};

	var bestShapePoint = pointsList[0];
	var t = getClosestPoint(bestShapePoint);
	var bestDist = t.dist;
	var bestGridPoint = t.point;
	for(var i=0;i<pointsList.length;i++) {
		var t = getClosestPoint(pointsList[i]);
		if(t.dist < bestDist) {
			bestDist = t.dist;
			bestGridPoint = t.point;
			bestShapePoint = pointsList[i];
		}
	}

	return {
		'grid': bestGridPoint,
		'shape': bestShapePoint
	};
};

/**
 * Renvoie le groupe (d'un certain type) dont fait partie une forme, ou null si elle ne fait pas partie d'un groupe.
 * @param shape: la forme en question
 * @param type: vaut system (groupe par lien entre points) ou user (groupe créé par l'utilisateur)
 * @return: le groupe ([Shape]), ou null si pas de groupe trouvé
 */
Workspace.prototype.getShapeGroup = function(shape, type){
	if(type=="system" || type=="user") {
		var groupList = type=='user' ? this.userShapeGroups : this.systemShapeGroups;
		for(var i=0;i<groupList.length;i++) {
			var group = groupList[i];
			for(var j=0;j<group.length;j++) {
				if(group[j]==shape) {
					return group;
				}
			}
		}
		return null;
	} else {
		console.log("Workspace.getShapeGroup: bad type");
		return null;
	}
};

/**
 * Renvoie l'index du groupe (d'un certain type) reçu en paramètre.
 * @param groupe: le groupe en question
 * @param type: vaut system (groupe par lien entre points) ou user (groupe créé par l'utilisateur)
 * @return: l'index du groupe (int), ou -1 si le groupe n'a pas été trouvé
 */
Workspace.prototype.getGroupIndex = function(group, type) {
	if(type=="system" || type=="user") {
		var groupList = type=='user' ? this.userShapeGroups : this.systemShapeGroups;
		for(var i=0;i<groupList.length;i++) {
			if(groupList[i] == group)
				return i;
		}
		return -1;
	} else {
		console.log("Workspace.getShapeGroup: bad type");
		return null;
	}
}

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
 * Renvoie la liste des points de la liste qui sont proches (< distance de magnétisme) d'un point donné
 * @param pointsList: la liste des points ([{x: int, y: int}])
 * @param point: le point ({x: int, y: int})
 * @return la liste des points ([{shape: Shape, x: int, y: int}])
 */
Workspace.prototype.pointsNearPoint = function(pointsList, point) {
	var response = [];
	for(var i=0;i<pointsList.length;i++) {
		var p = pointsList[i];
		var maxDist = this.app.magnetismDistance / this.zoomLevel;
		if(maxDist*maxDist>=(point.x-p.absX)*(point.x-p.absX) + (point.y-p.absY)*(point.y-p.absY)) {
			response.push(p);
		}
	}
	return response;
};

/**
 * Méthode statique: renvoie la liste des noms des familles existantes
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
 * Renvoie la liste des noms des familles existantes
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
 * ajoute une famille au workspace
 * @param family: la famille (Family)
 */
Workspace.prototype.addFamily = function(family){
	family.setId(this.nextFamilyId++);
	this.families.push(family);
};

/**
 * ajoute une forme au workspace
 * @param shape: la forme (Shape)
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
};

/**
 * Renvoie l'index d'une forme
 * @param shape: la forme (Shape)
 * @return: l'id (int)
 */
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
 * Crée les familles du menu A et les ajoute au workspace
 * TODO: déplacer ça ailleurs ?
 */
Workspace.prototype.addMenuAFamilies = function(){
	var base = 50;

	var f1 = new Family(this.app, "Triangle équilatéral", "#FF0");

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


	var f2 = new Family(this.app, "Carré", "#F00");
	this.addFamily(f2);


	var f3 = new Family(this.app, "Pentagone régulier", "#0F0");
	this.addFamily(f3);


};

/**
 * Récupère une famille à partir de son nom
 * @param name: le nom de la famille (String)
 * @return la famille (Family)
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
	if(newZoomLevel<this.app.minZoomLevel)
		newZoomLevel = this.app.minZoomLevel;
	if(newZoomLevel>this.app.maxZoomLevel)
		newZoomLevel = this.app.maxZoomLevel;

	var oldZoomLevel = this.zoomLevel;

	this.app.canvas.updateRelativeScaleLevel(1 / oldZoomLevel);
	this.app.canvas.updateRelativeScaleLevel(newZoomLevel);

	this.zoomLevel = newZoomLevel;
	if(doRefresh!==false)
		this.app.canvas.refresh();
};
