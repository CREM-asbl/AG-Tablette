/**
 * Représente un projet: un canvas avec une liste d'objets (formes, points, ...).
 *
 */

import { Family } from './Family'
import { Shape } from './Shape'
import { ShapeStep } from './ShapeStep'
import { Point } from './Point'
import { AppHistory } from './AppHistory'
import { settings } from './Settings';
import { loadManifest } from './Manifest'

// TODO : rendre workspace plus SRP car actuellement, il gére trop (exemple: kit standard)

export class Workspace {
	/**
	 * Constructeur
	 */
	constructor(app) {
		//Version de l'application dans laquelle ce projet a été créé
		loadManifest().then(manifest => this.appVersion = manifest.version)

		//Représente l'historique
		this.history = new AppHistory(app);

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

		/**
		 * décalage du canvas (translation horizontale et verticale)
		 * un chiffre positif signifie un décalage horizontal vers la droite ou vertical vers le bas.
		 */
		this.translateOffset = { 'x': 0, 'y': 0 };

		//Utilisé par l'historique lorsque la suppression d'une forme est annulée, pour pouvoir accéder à cette forme via son id pendant la recréation.
		this.tmpCreatingShape = undefined;
	}

	/**
	 * Grille: Renvoie le point de la grille (grid) le plus proche d'un point quelconque d'un groupe de forme
	 * @param  {[Shape]} shapesList liste des formes
	 * @return {{'grid': point, 'shape': point}} le point de la grille le plus proche, et le point correspondant du groupe de forme.
	 */
	getClosestGridPoint(shapesList) {
		var pointsList = [];
		for (var i = 0; i < shapesList.length; i++) {
			for (var j = 0; j < shapesList[i].points.length; j++) {
				pointsList.push(shapesList[i].points[j]);
			}
		}
		if (pointsList.length === 0) return null

		const getClosestPoint = function (point) {
			var x = point.getAbsoluteCoordinates().x,
				y = point.getAbsoluteCoordinates().y;

			var possibilities = [];
			var gridType = settings.get('gridType');
			var gridSize = settings.get('gridSize');
			if (gridType == 'square') {
				var topleft = {
					'x': x - ((x - 10) % (50 * gridSize)),
					'y': y - ((y - 10) % (50 * gridSize))
				};
				possibilities.push(topleft);
				possibilities.push({ 'x': topleft.x, 'y': topleft.y + 50 * gridSize });
				possibilities.push({ 'x': topleft.x + 50 * gridSize, 'y': topleft.y });
				possibilities.push({ 'x': topleft.x + 50 * gridSize, 'y': topleft.y + 50 * gridSize });
			} else if (gridType == 'triangle') {
				var topleft1 = {
					'x': x - ((x - 10) % (50 * gridSize)),
					'y': y - ((y - 10) % (43.3012701892 * 2 * gridSize))
				};
				var topleft2 = {
					'x': x - ((x - (10 + 25 * gridSize)) % (50 * gridSize)),
					'y': y - ((y - (10 + 43.3012701892 * gridSize)) % (43.3012701892 * 2 * gridSize))
				};
				possibilities.push(topleft1);
				possibilities.push({ 'x': topleft1.x, 'y': topleft1.y + 43.3012701892 * 2 * gridSize });
				possibilities.push({ 'x': topleft1.x + 50 * gridSize, 'y': topleft1.y });
				possibilities.push({ 'x': topleft1.x + 50 * gridSize, 'y': topleft1.y + 43.3012701892 * 2 * gridSize });

				possibilities.push(topleft2);
				possibilities.push({ 'x': topleft2.x, 'y': topleft2.y + 43.3012701892 * 2 * gridSize });
				possibilities.push({ 'x': topleft2.x + 50 * gridSize, 'y': topleft2.y });
				possibilities.push({ 'x': topleft2.x + 50 * gridSize, 'y': topleft2.y + 43.3012701892 * 2 * gridSize });
			} else {
				console.error("Workspace.getClosestGridPoint: unknown type: " + gridType);
				return null;
			}

			var closest = possibilities[0];
			var smallestSquareDist = Math.pow(closest.x - x, 2) + Math.pow(closest.y - y, 2);
			for (var i = 1; i < possibilities.length; i++) {
				var d = Math.pow(possibilities[i].x - x, 2) + Math.pow(possibilities[i].y - y, 2);
				if (d < smallestSquareDist) {
					smallestSquareDist = d;
					closest = possibilities[i];
				}
			}

			return { 'dist': Math.sqrt(smallestSquareDist), 'point': new Point(closest.x, closest.y, "grid", null) };
		};

		var bestShapePoint = pointsList[0];
		var t = getClosestPoint(bestShapePoint);
		var bestDist = t.dist;
		var bestGridPoint = t.point;
		for (var i = 0; i < pointsList.length; i++) {
			var t = getClosestPoint(pointsList[i]);
			if (t.dist < bestDist) {
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
	getShapeGroup(shape, type) {
		if (type == "system" || type == "user") {
			var groupList = type == 'user' ? this.userShapeGroups : this.systemShapeGroups;
			for (var i = 0; i < groupList.length; i++) {
				var group = groupList[i];
				for (var j = 0; j < group.length; j++) {
					if (group[j] == shape) {
						return group;
					}
				}
			}
			return null;
		} else {
			console.error("Workspace.getShapeGroup: bad type");
			return null;
		}
	};

	/**
	 * Renvoie l'index du groupe (d'un certain type) reçu en paramètre.
	 * @param groupe: le groupe en question
	 * @param type: vaut system (groupe par lien entre points) ou user (groupe créé par l'utilisateur)
	 * @return: l'index du groupe (int), ou -1 si le groupe n'a pas été trouvé
	 */
	getGroupIndex(group, type) {
		if (type == "system" || type == "user") {
			var groupList = type == 'user' ? this.userShapeGroups : this.systemShapeGroups;
			for (var i = 0; i < groupList.length; i++) {
				if (groupList[i] == group)
					return i;
			}
			return -1;
		} else {
			console.error("Workspace.getShapeGroup: bad type");
			return null;
		}
	}

	/**
	 * Renvoie la liste des formes contenant un certain point
	 * @param point: le point (Point)
	 * @return la liste des formes ([Shape])
	 */
	shapesOnPoint(point) {
		const list = this.shapesList.filter(shape => shape.containsPoint(point))
		return list;
	};

	/**
	 * Renvoie la liste des points de la liste qui sont proches (< distance de magnétisme) d'un point donné
	 * @param point: le point (Point)
	 * @return la liste des points ([Point])
	 */
	pointsNearPoint(point) {
		var responses = [];
		var pointCoordinates = point.getAbsoluteCoordinates();
		var maxSquareDist = Math.pow(settings.get('magnetismDistance') / this.zoomLevel, 2);

		for (var i = 0; i < this.shapesList.length; i++) {
			var shape = this.shapesList[i];
			var arrays = ['points', 'segmentPoints', 'otherPoints'];
			for (var j = 0; j < arrays.length; j++) {
				var arr = shape[arrays[j]];
				for (var k = 0; k < arr.length; k++) {
					var p = arr[k];

					var pCoordinates = p.getAbsoluteCoordinates();

					if (maxSquareDist > Math.pow(pointCoordinates.x - pCoordinates.x, 2) + Math.pow(pointCoordinates.y - pCoordinates.y, 2))
						responses.push(p);
				}
			}
		}

		return responses;
	};

	getPointsAtCoordinates(x, y) {
		var responses = [];
		var pointCoordinates = { 'x': x, 'y': y };
		var maxSquareDist = Math.pow(settings.get('precision') / this.zoomLevel, 2); //précision d'1,5 pixel

		for (var i = 0; i < this.shapesList.length; i++) {
			var shape = this.shapesList[i];
			var arrays = ['points', 'segmentPoints', 'otherPoints'];
			for (var j = 0; j < arrays.length; j++) {
				var arr = shape[arrays[j]];
				for (var k = 0; k < arr.length; k++) {
					var p = arr[k];

					var pCoordinates = p.getAbsoluteCoordinates();

					if (maxSquareDist > Math.pow(pointCoordinates.x - pCoordinates.x, 2) + Math.pow(pointCoordinates.y - pCoordinates.y, 2))
						responses.push(p);
				}
			}
		}

		return responses;
	}

	/**
	 * Renvoie la liste des noms des familles existantes
	 * @return list of the names ([String])
	 */
	getFamiliesNames() {
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
	addFamily(family) {
		family.setId(this.nextFamilyId++);
		this.families.push(family);
	};

	/**
	 * ajoute une forme au workspace
	 * @param shape: la forme (Shape)
	 * @param id: facultatif, l'id de la forme (si non précisé, crée un nouvel id)
	 */
	addShape(shape, id) {
		if (id !== undefined) {
			shape.setId(id);
		} else {
			shape.setId(this.nextShapeId++);
		}

		this.shapesList.push(shape);

		if (shape.linkedShape) {
			/* Si la forme a un point lié à une autre forme, ajouter cette liaison
			 * dans le tableau systemShapeGroups
			 */
			var group = this.getShapeGroup(shape.linkedShape, "system");
			if (group) {//un groupe existe déjà avec la forme à laquelle la nouvelle est liée
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
	getShapeIndex(shape) {
		var index = -1;
		for (var i = 0; i < this.shapesList.length; i++) {
			if (this.shapesList[i] == shape) {
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
	getShapeById(shapeId) {
		for (var i = 0; i < this.shapesList.length; i++) {
			var s = this.shapesList[i];
			if (s.id == shapeId)
				return s;
		}
		if (this.tmpCreatingShape && this.tmpCreatingShape.id == shapeId)
			return this.tmpCreatingShape;
		return null;
	};

	/**
	 * supprime une forme
	 * @param shape: la forme (Shape)
	 */
	removeShape(shape) {
		var removedShapes = [shape]; //pour l'historique
		var shapeIndex = this.getShapeIndex(shape);
		if (shapeIndex == null) {
			console.error("Workspace.removeShape: couldn't remove the shape");
			return;
		}
		//supprime la forme
		this.shapesList.splice(shapeIndex, 1);

		//supprime les formes créées après la forme supprimée et qui sont (indirectement)
		//liées à cette forme par un point.

		var that = this;
		var removeLinkedShapes = function (list, srcShape) {
			var local_removed = [];
			var to_remove = [];
			for (var i = 0; i < list.length; i++) {
				if (list[i].linkedShape == srcShape) { //la forme est liée à la forme supprimée (srcShape)
					var s = list.splice(i, 1)[0]; //la supprimer de la liste du groupe
					local_removed.push(s);
					var shapeIndex = that.getShapeIndex(s);
					if (shapeIndex !== null) {
						that.shapesList.splice(shapeIndex, 1); //la supprimer de la liste des formes
					}

					to_remove.push(s); //ajouter la forme pour la récursion
					i--;
				}
			}
			for (var i = 0; i < to_remove.length; i++)
				local_removed = local_removed.concat(removeLinkedShapes(list, to_remove[i])); //supprimer les formes liées à chacune des formes supprimées dans la boucle précédente.
			return local_removed;
		};

		var userShapeGroup = { 'exists': false, 'ids': [] };

		var groupLists = [this.systemShapeGroups, this.userShapeGroups];
		for (var g = 0; g < groupLists.length; g++) {
			var groupList = groupLists[g];
			//parcours des groupes d'un certain type:
			for (var i = 0; i < groupList.length; i++) {
				var group = groupList[i];
				//parcours d'un groupe:
				var found = false;
				for (var j = 0; j < group.length; j++) {
					if (group[j] == shape) { //on a trouvé la forme dans le groupe
						found = true;
						group.splice(j, 1); //supprimer cette forme du groupe
						break;
					}
				}
				if (found) {
					var tmp_removed = removeLinkedShapes(group, shape); //supprimer (récursivement) les formes liées à la forme supprimée

					if (g == 1) { //c'est le userShapeGroup:
						userShapeGroup.exists = true;
						for (var j = 0; j < group.length; j++) {
							userShapeGroup.ids.push(group[j].id);
						}
					}

					if (group.length <= 1) {
						groupList.splice(i, 1);
						i--;
					}

					removedShapes = removedShapes.concat(tmp_removed);
				}

			}
		}

		return {
			"shapesInfo": removedShapes,
			"userGroupInfo": userShapeGroup
		};
	};

	/**
	 * Ajout des familles du menu A  au workspace
	 * Todo: Remplacer par une fonction plus dynamique
	 */
	addMenuAFamilies() {
		this.addFamily(new Family("Triangle équilatéral", "#FF0"));

		this.addFamily(new Family("Carré", "#F00"));

		this.addFamily(new Family("Pentagone régulier", "#0F0"));
	};

	/**
	 * Récupère une famille à partir de son nom
	 * @param name: le nom de la famille (String)
	 * @return la famille (Family)
	 */
	getFamily(name) {
		return this.families.filter(family => family.name === name)[0]
	};

	/**
	 * définir le niveau de zoom général du canvas
	 * @param newZoomLevel: le niveau de zoom, entre 0.1 et 10 (float)
	 * @param doRefresh (@default true): si vaut false, ne va pas mettre le canvas à jour
	 */
	setZoomLevel(newZoomLevel, doRefresh) {
		if (newZoomLevel < settings.get('minZoomLevel'))
			newZoomLevel = settings.get('minZoomLevel');
		if (newZoomLevel > settings.get('maxZoomLevel'))
			newZoomLevel = settings.get('maxZoomLevel');

		app.canvas.updateRelativeScaleLevel(newZoomLevel / this.zoomLevel);

		this.zoomLevel = newZoomLevel;
		if (doRefresh !== false) {
			app.canvas.refresh();

		}
		app.canvas.refreshBackgroundCanvas();
	};

	getSaveData() {
		var wsdata = {
			'uniqid': app.uniqId(),
			'appVersion': this.appVersion,
			'menuId': this.menuId,
			'nextShapeId': this.nextShapeId,
			'nextFamilyId': this.nextFamilyId,
			'zoomLevel': this.zoomLevel
		};

		//history:
		wsdata.history = this.history.steps;

		//shapesList:
		wsdata.shapesList = this.shapesList.map(function (val) {
			return val.getSaveData();
		});

		//families:
		wsdata.families = this.families.map(function (family) {
			return {
				'name': family.name,
				'defaultColor': family.defaultColor,
				'id': family.id,
				'shapesList': family.shapesList.map(function (shape) {
					return {
						'color': shape.color,
						'name': shape.name,
						'refPoint': shape.refPoint,
						'buildSteps': shape.buildSteps.map(function (bs) {
							return bs.getSaveData();
						})
					};
				})
			};
		});

		//systemShapeGroups:
		wsdata.systemShapeGroups = this.systemShapeGroups.map(function (group) {
			return group.map(function (shape) {
				return shape.id;
			});
		});

		//userShapeGroups:
		wsdata.userShapeGroups = this.userShapeGroups.map(function (group) {
			return group.map(function (shape) {
				return shape.id;
			});
		});

		return wsdata;
	}

	// Todo remplacer par loadFomJson au lieu d'une fonction static ?
	static createWorkingspaceFromJson(json) {
		const wsdata = JSON.parse(json);
		const ws = new Workspace();
		ws.appVersion = wsdata.appVersion;
		ws.menuId = wsdata.menuId;
		ws.nextShapeId = wsdata.nextShapeId;
		ws.nextFamilyId = wsdata.nextFamilyId;
		ws.zoomLevel = wsdata.zoomLevel;

		//history:
		ws.history.steps = wsdata.history;

		//shapesList:
		ws.shapesList = wsdata.shapesList.map(function (val) {
			var shape = Shape.createFromSaveData(val, ws, true);
			return shape;
		});
		ws.shapesList = ws.shapesList.map(function (val, i) {
			return Shape.createFromSaveData(wsdata.shapesList[i], ws, false, val);
		});

		//families:
		ws.families = wsdata.families.map(function (data) {
			var family = new Family(
				data.name,
				data.defaultColor
			);
			family.shapesList = data.shapesList.map(function (data2) {
				return {
					'color': data2.color,
					'name': data2.name,
					'refPoint': data2.refPoint,
					'buildSteps': data2.buildSteps.map(function (data3) {
						return ShapeStep.createFromSaveData(data3);
					})
				};
			});
			return family;
		});

		//systemShapeGroups & userShapeGroups:
		const mapFct = group => {
			return group.map(function (shapeId) {
				var shape = ws.shapesList.find(function (val) {
					return val.id == shapeId;
				});
				if (!shape) {
					console.error("Storer: error retrieving Shape");
					return null;
				}
				return shape;
			});
		};
		ws.systemShapeGroups = wsdata.systemShapeGroups.map(mapFct);
		ws.userShapeGroups = wsdata.userShapeGroups.map(mapFct);

		return ws;
	}
}