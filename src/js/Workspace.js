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

	//Représente l'historique
	this.history = new AppHistory(this.app);

	//Le menu sélectionné (A, B, C, AB, AC)
	this.menuId = "A"; //à modifier lorsque d'autres menus seront développés

	//L'id de la prochaine forme qui sera créée
	this.nextShapeId = 1;

	//liste des formes du projet ([Shape])
	this.shapesList = [];

	//L'id de la prochaine famille qui sera créée
	this.nextFamilyId = 1;

	//Liste des familles existantes ([Family])
	this.families = [];

	/**
	 * Groupes. Une forme fait partie de 0 ou 1 'systemGroup', et de 0 ou 1 'userGroup'
	 * Les systemGroup sont créés automatiquement lorsqu'un utilisateur crée une forme en cliquant
	 * sur un point d'une autre forme (ce qui implique que les 2 formes seront liées), ou en utilisant
	 * la fonction diviser en sélectionnant 2 points de 2 formes différentes
	 * Les userGroup sont créés manuellement par l'utilisateur en sélectionnant plusieurs formes.
	 * Si l'une des formes faisant partie d'un systemGroup fait aussi partie d'un userGroup, les autres
	 * formes de ce systemGroup font d'office également partie du même userGroup.
	 */

	//Groupes de formes qui sont liées par des points
	this.systemShapeGroups = [];

	//Groupes de formes qui ont été liées par l'utilisateur après leur création.
	this.userShapeGroups = [];

	//niveau de zoom de l'interface
	this.zoomLevel = 1;

	//max 16 couleurs
	this.previousSelectedColors = ["#FF0000", "#00FF00", "#0000FF"];

	//Utilisé par l'historique lorsque la suppression d'une forme est annulée, pour pouvoir accéder à cette forme via son id pendant la recréation.
	this.tmpCreatingShape = undefined;
}

/**
 * Grille: Renvoie le point de la grille (grid) le plus proche d'un point quelconque d'un groupe de forme
 * @param  {[Shape]} shapesList liste des formes
 * @return {{'grid': point, 'shape': point}} le point de la grille le plus proche, et le point correspondant du groupe de forme.
 */
Workspace.prototype.getClosestGridPoint = function (shapesList) {
	var pointsList = [];
	for(var i=0;i<shapesList.length;i++) {
		for(var j=0;j<shapesList[i].points.length;j++) {
			pointsList.push(shapesList[i].points[j]);
		}
	}

	var that = this;
	var getClosestPoint = function(point){
		var x = point.getAbsoluteCoordinates().x,
			y = point.getAbsoluteCoordinates().y;

		var possibilities = [];
		var gridType = that.app.settings.get('gridType');
		var gridSize = that.app.settings.get('gridSize');
		if(gridType=='square') {
			var topleft = {
				'x': x - ( (x - 10) % (50*gridSize) ),
				'y': y - ( (y - 10) % (50*gridSize) )
			};
			possibilities.push(topleft);
			possibilities.push({'x': topleft.x, 'y': topleft.y+50*gridSize});
			possibilities.push({'x': topleft.x+50*gridSize, 'y': topleft.y});
			possibilities.push({'x': topleft.x+50*gridSize, 'y': topleft.y+50*gridSize});
		} else if(gridType=='triangle') {
			var topleft1 = {
				'x': x - ( (x - 10) % (50*gridSize) ),
				'y': y - ( (y - 10) % (43.3012701892*2*gridSize) )
			};
			var topleft2 = {
				'x': x - ( (x - (10+25*gridSize)) % (50*gridSize) ),
				'y': y - ( (y - (10+ 43.3012701892*gridSize)) % (43.3012701892*2*gridSize) )
			};
			possibilities.push(topleft1);
			possibilities.push({'x': topleft1.x, 'y': topleft1.y+43.3012701892*2*gridSize});
			possibilities.push({'x': topleft1.x+50*gridSize, 'y': topleft1.y});
			possibilities.push({'x': topleft1.x+50*gridSize, 'y': topleft1.y+43.3012701892*2*gridSize});

			possibilities.push(topleft2);
			possibilities.push({'x': topleft2.x, 'y': topleft2.y+43.3012701892*2*gridSize});
			possibilities.push({'x': topleft2.x+50*gridSize, 'y': topleft2.y});
			possibilities.push({'x': topleft2.x+50*gridSize, 'y': topleft2.y+43.3012701892*2*gridSize});
		} else {
			console.log("Workspace.getClosestGridPoint: unknown type: "+gridType);
			return null;
		}

		var closest = possibilities[0];
		var smallestSquareDist = Math.pow(closest.x-x, 2) + Math.pow(closest.y-y, 2);
		for(var i=1;i<possibilities.length;i++) {
			var d = Math.pow(possibilities[i].x-x, 2) + Math.pow(possibilities[i].y-y, 2);
			if(d<smallestSquareDist) {
				smallestSquareDist = d;
				closest = possibilities[i];
			}
		}

		return {'dist': Math.sqrt(smallestSquareDist), 'point': new Point(closest.x, closest.y, "grid", null)};
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
 * @param point: le point (Point)
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
 * @param point: le point (Point)
 * @return la liste des points ([Point])
 */
Workspace.prototype.pointsNearPoint = function(point) {
	var responses = [];
	var pointCoordinates = point.getAbsoluteCoordinates();
	var maxSquareDist = Math.pow(this.app.settings.get('magnetismDistance') / this.zoomLevel, 2);

	for(var i=0;i<this.shapesList.length;i++) {
		var shape = this.shapesList[i];
		var arrays = ['points', 'segmentPoints', 'otherPoints'];
		for(var j=0;j<arrays.length;j++) {
			var arr = shape[arrays[j]];
			for(var k=0;k<arr.length;k++) {
				var p = arr[k];

				var pCoordinates = p.getAbsoluteCoordinates();

				if(maxSquareDist>Math.pow(pointCoordinates.x - pCoordinates.x, 2)+Math.pow(pointCoordinates.y - pCoordinates.y, 2))
					responses.push(p);
			}
		}
	}

	return responses;
};

Workspace.prototype.getPointsAtCoordinates = function(x, y) {
	var responses = [];
	var pointCoordinates = {'x': x, 'y': y};
	var maxSquareDist = Math.pow(this.app.settings.get('precision') / this.zoomLevel, 2); //précision d'1,5 pixel

	for(var i=0;i<this.shapesList.length;i++) {
		var shape = this.shapesList[i];
		var arrays = ['points', 'segmentPoints', 'otherPoints'];
		for(var j=0;j<arrays.length;j++) {
			var arr = shape[arrays[j]];
			for(var k=0;k<arr.length;k++) {
				var p = arr[k];

				var pCoordinates = p.getAbsoluteCoordinates();

				if(maxSquareDist>Math.pow(pointCoordinates.x - pCoordinates.x, 2)+Math.pow(pointCoordinates.y - pCoordinates.y, 2))
					responses.push(p);
			}
		}
	}

	return responses;
}

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
 * @param id: facultatif, l'id de la forme (si non précisé, crée un nouvel id)
 */
Workspace.prototype.addShape = function(shape, id){
	if(id!==undefined) {
		shape.setId(id);
	} else {
		shape.setId(this.nextShapeId++);
	}

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
 * Renvoie la forme ayant un certain id
 * @param  {int} shapeId l'id de la forme
 * @return {Shape}         l'objet forme
 */
Workspace.prototype.getShapeById = function (shapeId) {
	for(var i=0;i<this.shapesList.length;i++) {
		var s = this.shapesList[i];
		if(s.id==shapeId)
			return s;
	}
	if(this.tmpCreatingShape && this.tmpCreatingShape.id==shapeId)
		return this.tmpCreatingShape;
	return null;
};

/**
 * supprime une forme
 * @param shape: la forme (Shape)
 */
Workspace.prototype.removeShape = function(shape) {
	var removedShapes = [shape]; //pour l'historique
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
		var local_removed = [];
		var to_remove = [];
		for(var i=0;i<list.length;i++) {
			if(list[i].linkedShape==srcShape) { //la forme est liée à la forme supprimée (srcShape)
				var s = list.splice(i, 1)[0]; //la supprimer de la liste du groupe
				local_removed.push(s);
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
			local_removed = local_removed.concat(removeLinkedShapes(list, to_remove[i])); //supprimer les formes liées à chacune des formes supprimées dans la boucle précédente.
		return local_removed;
	};

	var userShapeGroup = {'exists': false, 'ids': []};

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
				var tmp_removed = removeLinkedShapes(group, shape); //supprimer (récursivement) les formes liées à la forme supprimée

				if(g==1) { //c'est le userShapeGroup:
					userShapeGroup.exists = true;
					for(var j=0;j<group.length;j++) {
						userShapeGroup.ids.push(group[j].id);
					}
				}

				if(group.length<=1) {
					groupList.splice(i, 1);
					i--;
				}

				removedShapes = removedShapes.concat(tmp_removed);
			}

		}
	}

	//TODO: supprimer certains points qui sont liées aux points de otherPoints et segmentPoints. Et enregistrer cela dans l'historique.

	return {
		"shapesInfo": removedShapes,
		"userGroupInfo": userShapeGroup
	};
};

/**
 * Crée les familles du menu A et les ajoute au workspace
 * TODO: déplacer ça ailleurs ?
 */
Workspace.prototype.addMenuAFamilies = function(){
	var base = 50;

	var f1 = new Family(this.app, "Triangle équilatéral", "#FF0");

	f1.addShape("Triangle équilatéral",[
		ShapeStep.getLine(25	-25, -43.3012701892	+14.433756729733),
		ShapeStep.getLine(0		-25, 0				+14.433756729733),
		ShapeStep.getLine(50	-25, 0				+14.433756729733),
		ShapeStep.getLine(25	-25, -43.3012701892	+14.433756729733)
	], {"x": -25, "y": +14.433756729733});

	f1.addShape("Losange",[
		ShapeStep.getLine(-25	-12.5, -43.3012701892	+21.650635094600),
		ShapeStep.getLine(0		-12.5, 0				+21.650635094600),
		ShapeStep.getLine(50	-12.5, 0				+21.650635094600),
		ShapeStep.getLine(25	-12.5, -43.3012701892	+21.650635094600),
		ShapeStep.getLine(-25	-12.5, -43.3012701892	+21.650635094600)
	], {"x": -12.5, "y": +21.650635094600});

	f1.addShape("Trapèze isocèle",[
		ShapeStep.getLine(25	-50, -43.3012701892	+21.650635094600),
		ShapeStep.getLine(0		-50, 0				+21.650635094600),
		ShapeStep.getLine(100	-50, 0				+21.650635094600),
		ShapeStep.getLine(75	-50, -43.3012701892	+21.650635094600),
		ShapeStep.getLine(25	-50, -43.3012701892	+21.650635094600)
	], {"x": -50, "y": +21.650635094600});

	f1.addShape("Hexagone régulier",[
		ShapeStep.getLine(0		-25, -86.6025403784	+43.3012701892),
		ShapeStep.getLine(-25	-25, -43.3012701892	+43.3012701892),
		ShapeStep.getLine(0		-25, 0				+43.3012701892),
		ShapeStep.getLine(50	-25, 0				+43.3012701892),
		ShapeStep.getLine(75	-25, -43.3012701892	+43.3012701892),
		ShapeStep.getLine(50	-25, -86.6025403784	+43.3012701892),
		ShapeStep.getLine(0		-25, -86.6025403784	+43.3012701892)
	], {"x": -25, "y": +43.3012701892});

	f1.addShape("Triangle isocèle",[
		ShapeStep.getLine(25	-25, -14.433756729747	+4.811252243249),
		ShapeStep.getLine(0		-25, 0					+4.811252243249),
		ShapeStep.getLine(50	-25, 0					+4.811252243249),
		ShapeStep.getLine(25	-25, -14.433756729747	+4.811252243249)
	], {"x": -25, "y": +4.811252243249});

	f1.addShape("Triangle rectangle",[
		ShapeStep.getLine(0		-8.3333333333333, -43.3012701892	+14.433756729733),
		ShapeStep.getLine(0		-8.3333333333333, 0					+14.433756729733),
		ShapeStep.getLine(25	-8.3333333333333, 0					+14.433756729733),
		ShapeStep.getLine(0		-8.3333333333333, -43.3012701892	+14.433756729733)
	], {"x": -8.3333333333333, "y": +14.433756729733});

	f1.addShape("Trapèze rectangle",[
		ShapeStep.getLine(25	-18.75, -43.3012701892	+21.650635094600),
		ShapeStep.getLine(0		-18.75, -43.3012701892	+21.650635094600),
		ShapeStep.getLine(0		-18.75, 0				+21.650635094600),
		ShapeStep.getLine(50	-18.75, 0				+21.650635094600),
		ShapeStep.getLine(25	-18.75, -43.3012701892	+21.650635094600)
	], {"x": -18.75, "y": +21.650635094600});

	f1.addShape("Dodécagone régulier",[
		ShapeStep.getLine(0					-25, 0					+93.301270189200),
		ShapeStep.getLine(50				-25, 0					+93.301270189200),
		ShapeStep.getLine(93.301270189200	-25, -25				+93.301270189200),
		ShapeStep.getLine(118.301270189200	-25, -68.301270189200	+93.301270189200),
		ShapeStep.getLine(118.301270189200	-25, -118.301270189200	+93.301270189200),
		ShapeStep.getLine(93.301270189200	-25, -161.602540378400	+93.301270189200),
		ShapeStep.getLine(50				-25, -186.602540378400	+93.301270189200),
		ShapeStep.getLine(0					-25, -186.602540378400	+93.301270189200),
		ShapeStep.getLine(-43.301270189200	-25, -161.602540378400	+93.301270189200),
		ShapeStep.getLine(-68.301270189200	-25, -118.301270189200	+93.301270189200),
		ShapeStep.getLine(-68.301270189200	-25, -68.301270189200	+93.301270189200),
		ShapeStep.getLine(-43.301270189200	-25, -25				+93.301270189200),
		ShapeStep.getLine(0					-25, 0					+93.301270189200)
	], {"x": -25, "y": +93.301270189200});

	f1.addShape("Grand triangle isocèle",[
		ShapeStep.getLine(0		-25, 0					+31.100423396400),
		ShapeStep.getLine(50	-25, 0					+31.100423396400),
		ShapeStep.getLine(25	-25, -93.301270189200	+31.100423396400),
		ShapeStep.getLine(0		-25, 0					+31.100423396400)
	], {"x": -25, "y": +31.100423396400});

	f1.addShape("Petit losange",[
		ShapeStep.getLine(0					-46.650635094600, 0		+12.5),
		ShapeStep.getLine(50				-46.650635094600, 0		+12.5),
		ShapeStep.getLine(93.301270189200	-46.650635094600, -25	+12.5),
		ShapeStep.getLine(43.301270189200	-46.650635094600, -25	+12.5),
		ShapeStep.getLine(0					-46.650635094600, 0		+12.5)
	], {"x": -46.650635094600, "y": +12.5});

	f1.addShape("Petit disque",[
		ShapeStep.getLine(0, -28.867513459466),
		ShapeStep.getArc(0, 0, 360, false)
	], {"x": 0, "y": 0});

	f1.addShape("Grand disque",[
		ShapeStep.getLine(0, -50),
		ShapeStep.getArc(0, 0, 360, false)
	], {"x": 0, "y": 0});

	this.addFamily(f1);


	var f2 = new Family(this.app, "Carré", "#F00");

	f2.addShape("Carré",[
		ShapeStep.getLine(0		-25, 0		+25),
		ShapeStep.getLine(50	-25, 0		+25),
		ShapeStep.getLine(50	-25, -50	+25),
		ShapeStep.getLine(0		-25, -50	+25),
		ShapeStep.getLine(0		-25, 0		+25)
	], {"x": -25, "y": +25});

	f2.addShape("Triangle isocèle",[
		ShapeStep.getLine(0		-25, 0					+20.118446353109),
		ShapeStep.getLine(50	-25, 0					+20.118446353109),
		ShapeStep.getLine(25	-25, -60.355339059329	+20.118446353109),
		ShapeStep.getLine(0		-25, 0					+20.118446353109)
	], {"x": -25, "y": +20.118446353109});

	f2.addShape("Petit triangle rectangle isocèle",[
		ShapeStep.getLine(0		-25, 0		+12.5),
		ShapeStep.getLine(50	-25, 0		+12.5),
		ShapeStep.getLine(25	-25, -25	+12.5),
		ShapeStep.getLine(0		-25, 0		+12.5)
	], {"x": -25, "y": +12.5});

	f2.addShape("Triangle rectangle isocèle",[
		ShapeStep.getLine(0		-16.666666666666, 0		+16.666666666666),
		ShapeStep.getLine(50	-16.666666666666, 0		+16.666666666666),
		ShapeStep.getLine(0		-16.666666666666, -50	+16.666666666666),
		ShapeStep.getLine(0		-16.666666666666, 0		+16.666666666666)
	], {"x": -16.666666666666, "y": +16.666666666666});

	f2.addShape("Petit triangle rectangle",[
		ShapeStep.getLine(0		-16.666666666666, 0		+16.666666666666),
		ShapeStep.getLine(25	-16.666666666666, 0		+16.666666666666),
		ShapeStep.getLine(25	-16.666666666666, -50	+16.666666666666),
		ShapeStep.getLine(0		-16.666666666666, 0		+16.666666666666)
	], {"x": -16.666666666666, "y": +16.666666666666});

	f2.addShape("Parallélogramme",[
		ShapeStep.getLine(0, 0		+25),
		ShapeStep.getLine(50, 0		+25),
		ShapeStep.getLine(0, -50	+25),
		ShapeStep.getLine(-50, -50	+25),
		ShapeStep.getLine(0, 0		+25)
	], {"x": 0, "y": +25});

	f2.addShape("Petit losange",[
		ShapeStep.getLine(0					-17.677669529664, 0					+17.677669529664),
		ShapeStep.getLine(50				-17.677669529664, 0					+17.677669529664),
		ShapeStep.getLine(85.355339059329	-17.677669529664, -35.355339059329	+17.677669529664),
		ShapeStep.getLine(35.355339059329	-17.677669529664, -35.355339059329	+17.677669529664),
		ShapeStep.getLine(0					-17.677669529664, 0					+17.677669529664)
	], {"x": -17.677669529664, "y": +17.677669529664});

	f2.addShape("Octogone régulier",[
		ShapeStep.getLine(0					-25, 0					+60.355339059329),
		ShapeStep.getLine(50				-25, 0					+60.355339059329),
		ShapeStep.getLine(85.355339059329	-25, -35.355339059329	+60.355339059329),
		ShapeStep.getLine(85.355339059329	-25, -85.355339059329	+60.355339059329),
		ShapeStep.getLine(50				-25, -120.710678118658	+60.355339059329),
		ShapeStep.getLine(0					-25, -120.710678118658	+60.355339059329),
		ShapeStep.getLine(-35.355339059329	-25, -85.355339059329	+60.355339059329),
		ShapeStep.getLine(-35.355339059329	-25, -35.355339059329	+60.355339059329),
		ShapeStep.getLine(0					-25, 0					+60.355339059329)
	], {"x": -25, "y": +60.355339059329});

	f2.addShape("Disque",[
		ShapeStep.getLine(0, -35.355339059327),
		ShapeStep.getArc(0, 0, 360, false)
	], {"x": 0, "y": 0});

	this.addFamily(f2);


	var f3 = new Family(this.app, "Pentagone régulier", "#0F0");

	f3.addShape("Pentagone régulier",[
		ShapeStep.getLine(0					-25, 0					+34.409548011750),
		ShapeStep.getLine(50				-25, 0					+34.409548011750),
		ShapeStep.getLine(65.450849718737	-25, -47.552825814750	+34.409548011750),
		ShapeStep.getLine(25				-25, -76.942088429350	+34.409548011750),
		ShapeStep.getLine(-15.450849718737	-25, -47.552825814750	+34.409548011750),
		ShapeStep.getLine(0					-25, 0					+34.409548011750)
	], {"x": -25, "y": +34.409548011750});

	f3.addShape("Petit triangle isocèle",[
		ShapeStep.getLine(0		-25, 0					+11.469849337250),
		ShapeStep.getLine(50	-25, 0					+11.469849337250),
		ShapeStep.getLine(25	-25, -34.409548011750	+11.469849337250),
		ShapeStep.getLine(0		-25, 0					+11.469849337250)
	], {"x": -25, "y": +11.469849337250});

	f3.addShape("Grand triangle isocèle",[
		ShapeStep.getLine(0		-25, 0					+25.647362809800),
		ShapeStep.getLine(50	-25, 0					+25.647362809800),
		ShapeStep.getLine(25	-25, -76.942088429400	+25.647362809800),
		ShapeStep.getLine(0		-25, 0					+25.647362809800)
	], {"x": -25, "y": +25.647362809800});

	f3.addShape("Triangle obtusangle",[
		ShapeStep.getLine(0					-16.666666666666, 0					+31.701883876500),
		ShapeStep.getLine(65.450849718737	-16.666666666666, -47.552825814750	+31.701883876500),
		ShapeStep.getLine(-15.450849718737	-16.666666666666, -47.552825814750	+31.701883876500),
		ShapeStep.getLine(0					-16.666666666666, 0					+31.701883876500)
	], {"x": -16.666666666666, "y": +31.701883876500});

	f3.addShape("Petit losange",[
		ShapeStep.getLine(0				-45.225424859350, 0					+14.694631307300),
		ShapeStep.getLine(50			-45.225424859350, 0					+14.694631307300),
		ShapeStep.getLine(90.4508497187	-45.225424859350, -29.3892626146	+14.694631307300),
		ShapeStep.getLine(40.4508497187	-45.225424859350, -29.3892626146	+14.694631307300),
		ShapeStep.getLine(0				-45.225424859350, 0					+14.694631307300)
	], {"x": -45.225424859350, "y": +14.694631307300});

	f3.addShape("Décagone régulier",[
		ShapeStep.getLine(0					-25, 0					+76.942088429400),
		ShapeStep.getLine(50				-25, 0					+76.942088429400),
		ShapeStep.getLine(90.4508497187		-25, -29.3892626146		+76.942088429400),
		ShapeStep.getLine(105.9016994374	-25, -76.9420884294		+76.942088429400),
		ShapeStep.getLine(90.4508497187		-25, -124.4949142442	+76.942088429400),
		ShapeStep.getLine(50				-25, -153.8841768588	+76.942088429400),
		ShapeStep.getLine(0					-25, -153.8841768588	+76.942088429400),
		ShapeStep.getLine(-40.4508497187	-25, -124.4949142442	+76.942088429400),
		ShapeStep.getLine(-55.9016994374	-25, -76.9420884294		+76.942088429400),
		ShapeStep.getLine(-40.4508497187	-25, -29.3892626146		+76.942088429400),
		ShapeStep.getLine(0					-25, 0					+76.942088429400)
	], {"x": -25, "y": +76.942088429400});

	f3.addShape("Disque",[
		ShapeStep.getLine(0, -42.5325404176),
		ShapeStep.getArc(0, 0, 360, false)
	], {"x": 0, "y": 0});

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
	if(newZoomLevel<this.app.settings.get('minZoomLevel'))
		newZoomLevel = this.app.settings.get('minZoomLevel');
	if(newZoomLevel>this.app.settings.get('maxZoomLevel'))
		newZoomLevel = this.app.settings.get('maxZoomLevel');

	var oldZoomLevel = this.zoomLevel;

	this.app.canvas.updateRelativeScaleLevel(1 / oldZoomLevel);
	this.app.canvas.updateRelativeScaleLevel(newZoomLevel);

	this.zoomLevel = newZoomLevel;
	if(doRefresh!==false) {
		this.app.canvas.refresh();

	}
	this.app.canvas.refreshBackgroundCanvas();
};
