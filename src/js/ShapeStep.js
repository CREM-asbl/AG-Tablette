/**
 * Représente une étape de construction d'une forme
 */

/**
 * Constructeur
 */
function ShapeStep() {
	this.type = null;
	this.x = null;
	this.y = null;

	this.angle = null;
	this.direction = null;

	this.cp1X = null;
	this.cp1Y = null;

	this.cp2X = null;
	this.cp2Y = null;

	//numéro incrémenté à chaque fois que les coordonnées sont modifiées:
	this.updateId = 0;
}

/**
 * Méthode statique. Crée un objet ShapeStep à partir d'une sauvegarde (getSaveData).
 * @param  {Object} saveData les données de sauvegarde
 * @return {ShapeStep}          le nouvel objet
 */
ShapeStep.createFromSaveData = function(saveData) {
	var shapeStep = null;
	if(saveData.type=="line") {
		shapeStep = this.getLine(saveData.x, saveData.y);
	} else if(saveData.type=="arc") {
		shapeStep = this.getArc(saveData.x, saveData.y, saveData.angle, saveData.direction);
	} else if(saveData.type=="quadraticCurve") {
		shapeStep = this.getQuadraticBezierCurve(saveData.x, saveData.y, saveData.cp1X, saveData.cp1Y);
	} else { //cubicCurve
		shapeStep = this.getCubicBezierCurve(saveData.x, saveData.y, saveData.cp1X, saveData.cp1Y, saveData.cp2X, saveData.cp2Y);
	}
	shapeStep.updateId = saveData.updateId;
	return shapeStep;
}

/**
 * Renvoie toutes les informations nécessaires pour recréer cette ShapeStep. L'information nécessaire doit pouvoir être encodée en JSON.
 * @return {Object} les données sur la shapeStep.
 */
ShapeStep.prototype.getSaveData = function(){
	return {
		'type': this.type,
		'x': this.x,
		'y': this.y,
		'angle': this.angle,
		'direction': this.direction,
		'updateId': this.updateId,
		'cp1X': this.cp1X,
		'cp1Y': this.cp1Y,
		'cp2X': this.cp2X,
		'cp2Y': this.cp2Y
	};
};

/**
 * Méthode statique: récupérer une nouvelle instance de ShapeStep sur laquelle setLine a été appelé
 */
ShapeStep.getLine = function(x, y) {
	var n = new ShapeStep();
	n.setLine(x, y);
	return n;
};

/**
 * Méthode statique: récupérer une nouvelle instance de ShapeStep sur laquelle setArc a été appelé
 */
ShapeStep.getArc = function(x, y, angle, direction) {
	var n = new ShapeStep();
	n.setArc(x, y, angle, direction);
	return n;
};

/**
 * Méthode statique: récupérer une nouvelle instance de ShapeStep sur laquelle setQuadraticBezierCurve a été appelé
 */
ShapeStep.getQuadraticBezierCurve = function(x, y, cp1X, cp1Y) {
	var n = new ShapeStep();
	n.setQuadraticBezierCurve(x, y, cp1X, cp1Y);
	return n;
};

/**
 * Méthode statique: récupérer une nouvelle instance de ShapeStep sur laquelle setCubicBezierCurve a été appelé
 */
ShapeStep.getCubicBezierCurve = function(x, y, cp1X, cp1Y, cp2X, cp2Y) {
	var n = new ShapeStep();
	n.setCubicBezierCurve(x, y, cp1X, cp1Y, cp2X, cp2Y);
	return n;
};

/**
 * Définir les coordonnées x et y.
 */
ShapeStep.prototype.setCoordinates = function(x, y) {
    this.x = x;
    this.y = y;
	this.updateId++;
}

/**
 * Récupérer le type d'étape
 * @return the type
 */
ShapeStep.prototype.getType = function() {
	return this.type;
};

/**
 * récupérer une copie de l'étape
 * @return la copie (ShapeStep)
 */
ShapeStep.prototype.getCopy = function() {
	if(this.type=="line") {
		return ShapeStep.getLine(this.x, this.y);
	} else if(this.type=="arc") {
		return ShapeStep.getArc(this.x, this.y, this.angle, this.direction);
	} else if(this.type=="quadraticCurve") {
		return ShapeStep.getQuadraticBezierCurve(this.x, this.y, this.cp1X, this.cp1Y);
	} else if(this.type=="cubicCurve") {
		return ShapeStep.getCubicBezierCurve(this.x, this.y, this.cp1X, this.cp1Y, this.cp2X, this.cp2Y);
	} else  {
		console.log("ShapeStep.getCopy: unknown type");
		return null;
	}
};


/**
 * l'étape est une ligne
 * @param x: coordonnée x du second point de la ligne
 * @param y: coordonnée y du second point de la ligne
 */
ShapeStep.prototype.setLine = function(x, y) {
	this.type = "line";

	this.x = x;
	this.y = y;
};

/**
 * l'étape est un arc de cercle
 * @param x: coordonnée x du centre de l'arc de cercle
 * @param y: coordonnée y du centre de l'arc de cercle
 * @param angle: angle de l'arc de cercle (en degrés ?)
 * @param direction: vrai si l'arc est dessiné dans le sens anti-horloger, false sinon
 */
ShapeStep.prototype.setArc = function(x, y, angle, direction) {
	this.type = "arc";

	this.x = x;
	this.y = y;
	this.angle = angle;
	this.direction = direction;
};

/**
 * l'étape est une courbe de bézier quadratique
 * @param x: coordonnée x du point final de la courbe
 * @param y: coordonnée y du point final de la courbe
 * @param cp1X: coordonnée x du point de contrôle
 * @param cp1Y: coordonnée y du point de contrôle
 */
ShapeStep.prototype.setQuadraticBezierCurve = function(x, y, cp1X, cp1Y) {
	this.type = "quadraticCurve";

	this.x = x;
	this.y = y;
	this.cp1X = cp1X;
	this.cp1Y = cp1Y;
};

/**
 * l'étape est une courbe de bézier cubique
 * @param x: coordonnée x du point final de la courbe
 * @param y: coordonnée y du point final de la courbe
 * @param cp1X: coordonnée x du premier point de contrôle
 * @param cp1Y: coordonnée y du premier point de contrôle
 * @param cp2X: coordonnée x du second point de contrôle
 * @param cp2Y: coordonnée y du second point de contrôle
 */
ShapeStep.prototype.setCubicBezierCurve = function(x, y, cp1X, cp1Y, cp2X, cp2Y) {
	this.type = "cubicCurve";

	this.x = x;
	this.y = y;
	this.cp1X = cp1X;
	this.cp1Y = cp1Y;
	this.cp2X = cp2X;
	this.cp2Y = cp2Y;
};
