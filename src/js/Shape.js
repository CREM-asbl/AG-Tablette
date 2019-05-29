import { Point } from './Point'
import { ShapeStep } from './ShapeStep'
import { distanceBetweenTwoPoints } from './Geometry';

/**
 * Cette classe représente une forme sur le canvas
 */
export class Shape {
	/**
	 * Constructeur
	 * @param familyName: le nom de la famille de la forme (String)
	 * @param name: le nom/type de la forme (String)
	 * @param x: la coordonnée x (int)
	 * @param y: la coordonnée y (int)
	 * @param buildSteps: liste des étapes de construction ([ShapeStep]). la première étape doit être une ligne (correspond au point de départ). Les coordonnées sont relatives.
	 * @param color: couleur de la forme (String: "#AABBCC")
	 * @param borderColor: couleur des bords de la forme (String: "#AABBCC")
	 * @param refPoint: coordonnées relatives du point de référence de la forme (point en bas à gauche), utilisé pour ajouter une forme.
	 * @param isPointed: si les sommets doivent être affichés ou non
	 * @param isSided: si la forme a 2 faces ou non
	 * @param opacity: opacité de la forme (int entre 0 et 1)
	 */
	constructor(familyName, name, x, y, buildSteps, color, borderColor, refPoint, isPointed, isSided, opacity) {
		window.app.workspace.tmpCreatingShape = this;
		this.id = null; //L'id est défini lorsqu'une forme est ajoutée à un workspace.

		this.x = x;
		this.y = y;
		this.familyName = familyName;
		this.name = name;
		this.buildSteps = buildSteps;
		this.color = color; //la couleur de la forme. Vaut, par défaut, celle de la famille.
		this.borderColor = borderColor; //la couleur des bords de la forme.

		//point de référence de la forme (utilisé lors de l'ajout d'une forme), relatif au centre (0,0)
		this.refPoint = refPoint; //Pour l'instant: {'x': float, 'y': float} (-> Point?)

		//La forme a-t-elle 2 faces (-> 2 couleurs différentes) ou pas ? La couleur de l'autre face, le cas échéant, est le complément de la couleur de base.
		this.isSided = isSided;

		//Les sommets de la forme sont-ils affichés ?
		this.isPointed = isPointed;

		//l'opacité de la forme, entre 0 et 1
		this.opacity = opacity;



		//vrai si la forme a été retournée (pour savoir quelle face est visible en cas de forme biface)
		this.isReversed = false;

		/**
		 * Forme à laquelle celle-ci est liée. Une forme B est liée à une forme A si
		 * B a été créée en cliquant sur l'un des sommets (ou autres points?) de A.
		 * Cette relation n'est donc pas réciproque (Si B est liée à A, a n'est pas liée à B)
		 */
		this.linkedShape = null;

		//les sommets de la forme
		this.points = [];
		this.__computePoints();

		//liste de points qui se trouvent sur le contour de la forme
		this.segmentPoints = [];

		//Liste de points situés dans ou en dehors de la forme (par ex le centre)
		this.otherPoints = [];

		/**
		 * numéro d'ordre d'affichage de la forme (=quelle forme est au dessus de quelle autre; plus le numéro est grand, plus la forme est en haut)
		 * TODO.
		 * Idée: si on doit juste pouvoir mettre une forme tout devant ou tout derrière, utiliser id (utiliser valeur négative, ou la future valeur de id (et incrémenter cette valeur de 1)
		 */
		this.showOrder = null;
	}

	__computePoints() {
		this.points = [];
		var final_point = null;
		for (var i = 1; i < this.buildSteps.length; i++) {
			final_point = this.buildSteps[i - 1].getFinalPoint(final_point);
			var s = this.buildSteps[i];
			if (s.getType() == "line") {
				var pt = new Point(s.x, s.y, "vertex", this);
				if (s.isArtificial)
					pt.hidden = true;
				this.points.push(pt);
			} else if (s.getType() == "arc") {
				if (this.buildSteps.length > 2) { //Ce n'est pas un cercle:
					var coord = this.buildSteps[i].getFinalPoint(final_point),
						pt = new Point(coord.x, coord.y, "vertex", this);
					this.points.push(pt);
				}
			} else {
				console.log("Shape.computePoints(): Unknown type");
			}
		}
	};

	//Permet de mettre à jour les propriétés __finalPoint des buildSteps
	__computeFinalBuildStepsPoints() {
		for (var i = 0, prev = null; i < this.buildSteps.length; i++)
			prev = this.buildSteps[i].getFinalPoint(prev);
	};
	/**
	 * Définir l'identifiant unique de la forme
	 * @param id: l'id (int)
	 */
	setId(id) {
		this.id = id;
		this.showOrder = id;
	};

	/**
	 * Vérifier si une forme contient au moins un arc
	 * @return {Boolean} true s'il y a au moins un arc de cercle.
	 */
	containsArc() {
		for (var i = 1; i < this.buildSteps.length; i++) {
			if (this.buildSteps[i].getType() == "arc")
				return true;
		}
		return false;
	};

	/**
	 * Centre la forme (moyenne des coordonnées -> estimation pour les arcs de cercle... mauvais! ne rend pas bien)
	 * @return le décalage effectué.
	 */ //TODO: trouver un autre système pour les arcs de cercles (ne pas les prendre en compte?)
	centerShape() { //à améliorer.
		var averageX = 0, averageY = 0, approxPointsList;

		if (!this.containsArc()) {
			approxPointsList = this.getApproximatedPointsList(0.2 * Math.PI);
			approxPointsList.shift();
		} else {
			//Calculer une approximation de la forme (transforme les arcs en liste de segments) qui a le même centre:
			var approxPointsList = [],
				lastPoint = null,
				approx_len = 3;
			for (var i = 1; i < this.buildSteps.length; i++) {
				lastPoint = this.buildSteps[i - 1].getFinalPoint(lastPoint);
				if (this.buildSteps[i].getType() == "line") {
					var p1 = { 'x': lastPoint.x, 'y': lastPoint.y },
						p2 = this.buildSteps[i],
						len = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
					console.log(len)
					console.log(distanceBetweenTwoPoints(p1, p2))
					var cursor1 = { 'x': p1.x, 'y': p1.y },
						cursor2 = { 'x': p2.x, 'y': p2.y },
						list1 = [],
						list2 = [],
						x_shift = (cursor2.x - cursor1.x) / (len / approx_len),
						y_shift = (cursor2.y - cursor1.y) / (len / approx_len),
						tmp = 0;
					while (Math.sqrt(Math.pow(cursor1.x - cursor2.x, 2) + Math.pow(cursor1.y - cursor2.y, 2)) >= 2.5 * approx_len && tmp++ < 100) {
						list1.push(new Point(cursor1.x, cursor1.y, null, this));
						list2.unshift(new Point(cursor2.x, cursor2.y, null, this));
						cursor1.x += x_shift;
						cursor2.x -= x_shift;
						cursor1.y += y_shift;
						cursor2.y -= y_shift;
					}
					if (tmp >= 100) {
						console.error("Shape.centerShape: boucle infinie...");
					}
					if (Math.sqrt(Math.pow(cursor1.x - cursor2.x, 2) + Math.pow(cursor1.y - cursor2.y, 2)) >= 1.5 * approx_len) {
						list1.push(new Point((cursor1.x + cursor2.x) / 2, (cursor1.y + cursor2.y) / 2, null, this));
					}
					approxPointsList = approxPointsList.concat(list1, list2);
				} else if (this.buildSteps[i].getType() == "arc") {
					var p1 = lastPoint,
						center = this.buildSteps[i],
						angle = this.buildSteps[i].angle,
						rayon = Math.sqrt(Math.pow(this.buildSteps[i].x - p1.x, 2) + Math.pow(this.buildSteps[i].y - p1.y, 2)),
						direction = this.buildSteps[i].direction,
						points = window.app.getApproximatedArc(center, p1, angle, direction, approx_len / rayon);
					for (var j = 0; j < points.length; j++) {
						approxPointsList.push(new Point(points[j].x, points[j].y, null, this));
					}
				} else {
					console.log("Shape.getApproximatedPointsList: unknown buildStep type");
					return null;
				}
			}
		}
		console.log(this)
		console.log(approxPointsList)
		approxPointsList.forEach(function (point) {
			var relCoord = point.getRelativeCoordinates();
			averageX += relCoord.x;
			averageY += relCoord.y;
		});
		averageX /= approxPointsList.length;
		averageY /= approxPointsList.length;

		console.log(averageX)
		console.log(averageY)

		this.buildSteps.forEach(function (step) {
			step.setCoordinates(step.x - averageX, step.y - averageY);
		});
		this.segmentPoints.forEach(function (pt) {
			pt.setCoordinates(pt.x - averageX, pt.y - averageY);
		});
		this.otherPoints.forEach(function (pt) {
			pt.setCoordinates(pt.x - averageX, pt.y - averageY);
		});
		return { x: averageX, y: averageY };
	};

	/**
	 * Recalcule les coordonnées des points sur base de BuildSteps
	 */
	recomputePoints() {
		var pointIndex = 0,
			final_point = this.buildSteps[0].getFinalPoint(null);
		for (var i = 1; i < this.buildSteps.length; i++) {
			final_point = this.buildSteps[i].getFinalPoint(final_point);
			if (this.buildSteps[i].type == "line" || this.buildSteps.length > 2) { //Si arc mais que ce n'est pas un cercle (ex: arc de cercle)
				this.points[pointIndex++].setCoordinates(final_point.x, final_point.y);
			}
		}
	};

	/**
	 * Renvoie un point à partir de son identifiant unique
	 * @param  {String} uniqId l'identifiant
	 * @return {Point}        l'objet de type Point
	 */
	getPointByUniqId(uniqId) {
		for (var i = 0; i < this.points.length; i++) {
			if (this.points[i].uniqId == uniqId)
				return this.points[i];
		}
		for (var i = 0; i < this.segmentPoints.length; i++) {
			if (this.segmentPoints[i].uniqId == uniqId)
				return this.segmentPoints[i];
		}
		for (var i = 0; i < this.otherPoints.length; i++) {
			if (this.otherPoints[i].uniqId == uniqId)
				return this.otherPoints[i];
		}
		return null;
	};

	/**
	 * Ajouter un point lié à la forme
	 * @param  {String} type segment ou other
	 * @param  {float} x    coordonnée x
	 * @param  {float} y    coordonnée y
	 */
	addPoint(type, x, y) {
		if (['segment', 'other'].indexOf(type) == -1) {
			console.log("Shape.addPoint: unknown type");
			return;
		}
		var arr = (type == 'segment') ? this.segmentPoints : this.otherPoints;

		arr.push(new Point(x, y, 'division', this));
	};

	/**
	 * Calcule les sommets (relatifs) d'un polygone approximant la forme
	 * @return liste de points ([Point])
	 */
	getApproximatedPointsList(angleStep) {
		if (angleStep === undefined)
			angleStep = 0.05 * Math.PI;

		//Vérifier si la forme a été modifiée.
		var edited = false;

		var newUpdateIdList = [];
		for (var i = 0; i < this.buildSteps.length; i++) {
			newUpdateIdList.push(this.buildSteps[i].updateId);
			if (this._buildStepsUpdateIdList == undefined
				|| this._buildStepsUpdateIdList.length != this.buildSteps.length
				|| this.buildSteps[i].updateId != this._buildStepsUpdateIdList[i]) {
				edited = true;
			}
		}
		this._buildStepsUpdateIdList = newUpdateIdList;

		//Si pas modifiée, renvoyer le tableau déjà calculé
		if (!edited && false) { //TODO retirer le false
			var pointsList = [];
			for (var i = 0; i < this._approximatedPointsList.length; i++) {
				pointsList.push(this._approximatedPointsList[i]); //.getCopy()) ?
			}
			return pointsList;
		}

		//Calculer le polygone approximé.
		var pointsList = [new Point(this.buildSteps[0].x, this.buildSteps[0].y, null, this)],
			lastPoint = null;
		for (var i = 1; i < this.buildSteps.length; i++) {
			lastPoint = this.buildSteps[i - 1].getFinalPoint(lastPoint);
			if (this.buildSteps[i].getType() == "line") {
				pointsList.push(new Point(this.buildSteps[i].x, this.buildSteps[i].y, null, this));
			} else if (this.buildSteps[i].getType() == "arc") {
				var p1 = lastPoint,
					center = this.buildSteps[i],
					angle = this.buildSteps[i].angle,
					direction = this.buildSteps[i].direction,
					points = window.app.getApproximatedArc(center, p1, angle, direction, angleStep);
				for (var j = 0; j < points.length; j++) {
					pointsList.push(new Point(points[j].x, points[j].y, null, this));
				}
			} else {
				console.log("Shape.getApproximatedPointsList: unknown buildStep type");
				return null;
			}
		}

		this._approximatedPointsList = pointsList;
		return pointsList;
	}

	/**
	 * Vérifie si un point est dans la forme ou non
	 * @param point: le point ({x: int, y: int}) (coordonnées absolues)
	 * @return true si le point est dans la forme, false sinon
	 */
	containsPoint(point) {
		var polygon = this.getApproximatedPointsList();
		var pos = point.getAbsoluteCoordinates();
		point = { "x": pos.x - this.x, "y": pos.y - this.y }; //calculer le point en position relative
		return window.app.isPointInPolygon(polygon, point);
	};

	/**
	 * récupère les coordonnées de la forme
	 * @return les coordonnées ({x: float, y: float})
	 */
	getCoordinates() {
		return { "x": this.x, "y": this.y };
	};

	/**
	 * défini les coordonnées de la forme
	 * @param coordinates: les coordonnées ({x: float, y: float})
	 */
	setCoordinates(coordinates) {
		this.x = coordinates.x;
		this.y = coordinates.y;
	};

	/**
	 * Récupérer une copie de la forme.
	 * Notes: La forme n'aura pas d'id. Le champ linkedShape n'est pas copié et est laissé à null.
	 */
	getCopy() {
		var buildStepsCopy = [];
		for (var i = 0; i < this.buildSteps.length; i++) {
			buildStepsCopy.push(this.buildSteps[i].getCopy());
		}

		var shape = new Shape(
			this.familyName,
			this.name,
			this.x, this.y,
			buildStepsCopy,
			this.color,
			this.borderColor,
			{ "x": this.refPoint.x, "y": this.refPoint.y },
			this.isPointed,
			this.isSided,
			this.opacity);
		shape.isReversed = this.isReversed;
		shape.isPointed = this.isPointed;

		var arrays = [this.segmentPoints, this.otherPoints];
		for (var i = 0; i < arrays.length; i++) {
			var arr = arrays[i];
			for (var j = 0; j < arr.length; j++) {
				var pos = arr[j].getRelativeCoordinates();
				shape.addPoint(['segment', 'other'][i], pos.x, pos.y);
			}
		}

		return shape;
	};

	/**
	 * Méthode statique. Crée un objet Shape à partir d'une sauvegarde (getSaveData).
	 * @param  {Object} saveData   Les données de sauvegarde
	 * @param  {Workspace} ws         Une référence vers le workspace à utiliser. Default: app.workspace
	 * @param  {Boolean} skipPoints Si true, ne va pas initialiser les points de la forme
	 * @param  {Shape} shape      Un objet Shape. Si non null, va utiliser cet objet et va uniquement initialiser les points
	 * @return {Shape}            La forme.
	 */
	static createFromSaveData(saveData, ws, skipPoints, shape) {
		if (!ws) ws = window.app.workspace;
		var buildSteps = [];
		for (var i = 0; i < saveData.buildSteps.length; i++)
			buildSteps.push(ShapeStep.createFromSaveData(saveData.buildSteps[i]));

		if (!shape) {
			var shape = new Shape(
				saveData.familyName,
				saveData.name,
				saveData.x, saveData.y,
				buildSteps,
				saveData.color,
				saveData.borderColor,
				{ "x": saveData.refPoint.x, "y": saveData.refPoint.y },
				saveData.isPointed,
				saveData.isSided,
				saveData.opacity);
			shape.isReversed = saveData.isReversed;
			shape.isPointed = saveData.isPointed;
			shape.id = saveData.id;
		}


		if (skipPoints === true)
			return shape;

		shape.points = [];
		for (var i = 0; i < saveData.points.length; i++)
			shape.points.push(Point.createFromSaveData(saveData.points[i], ws));
		for (var i = 0; i < saveData.segmentPoints.length; i++)
			shape.segmentPoints.push(Point.createFromSaveData(saveData.segmentPoints[i], ws));
		for (var i = 0; i < saveData.otherPoints.length; i++)
			shape.otherPoints.push(Point.createFromSaveData(saveData.otherPoints[i], ws));

		//LinkedShape:
		if (saveData.linkedShapeId !== undefined && saveData.linkedShapeId !== null) {
			var linkedShape = ws.getShapeById(saveData.linkedShapeId)
			if (!linkedShape)
				console.log("Shape.createFromSaveData: linked Shape not found...");
			else
				shape.linkedShape = linkedShape;
		}

		return shape;
	}

	/**
	 * Renvoie toutes les informations nécessaires pour recréer cette forme. L'information nécessaire doit pouvoir être encodée en JSON.
	 * @return {Object} les données sur la forme.
	 */
	getSaveData() {
		var buildStepsData = [];
		for (var i = 0; i < this.buildSteps.length; i++)
			buildStepsData.push(this.buildSteps[i].getSaveData());
		var pointsData = [];
		for (var i = 0; i < this.points.length; i++)
			pointsData.push(this.points[i].getSaveData());
		var segmentPointsData = [];
		for (var i = 0; i < this.segmentPoints.length; i++)
			segmentPointsData.push(this.segmentPoints[i].getSaveData());
		var otherPointsData = [];
		for (var i = 0; i < this.otherPoints.length; i++)
			otherPointsData.push(this.otherPoints[i].getSaveData());

		var saveData = {
			'name': this.name,
			'familyName': this.familyName,
			'x': this.x, 'y': this.y,
			'id': this.id,
			'buildSteps': buildStepsData,
			'points': pointsData,
			'segmentPoints': segmentPointsData,
			'otherPoints': otherPointsData,
			'color': this.color,
			'borderColor': this.borderColor,
			'refPoint': { "x": this.refPoint.x, "y": this.refPoint.y },
			'isPointed': this.isPointed,
			'isSided': this.isSided,
			'opacity': this.opacity,
			'isReversed': this.isReversed,
			'isPointed': this.isPointed,
			'linkedShapeId': (this.linkedShape ? this.linkedShape.id : null)
		};

		return saveData;
	}
}
