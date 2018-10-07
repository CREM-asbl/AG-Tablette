/**
 * Représente une étape de construction d'une forme
 */

/**
 * Constructeur
 */
function ShapeStep() {
	this.type = null; //'line' ou 'arc'

	//Point de destination pour une ligne, coordonnées du centre de l'arc de cercle pour un arc.
	this.x = null;
	this.y = null;

	//numéro incrémenté à chaque fois que les coordonnées sont modifiées:
	this.updateId = 0;

	/**
	 * Vaut true si c'est un segment qui représente un morceau d'arc de cercle.
	 * -> Utilisé lors d'une animation de retournement (ReverseState).
	 * N'affiche pas le point lié à ce segment lors de l'affichage, même si la
	 * forme est pointée.
	 */
	this.isArtificial = false;

	//Utilisé pour les arcs:
	this.angle = null; //en radians
	this.direction = null; //false par défaut. si vaut true: sens anti-horloger
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
	} else {
		console.log("ShapeStep.createFromSaveData: type inconnu");
	}
	shapeStep.__finalPoint = saveData.__finalPoint;
	shapeStep.updateId = saveData.updateId;
	shapeStep.isArtificial = saveData.isArtificial;
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
		'__finalPoint': this.__finalPoint,
		'isArtificial': this.isArtificial
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
 * Renvoie le point de destination de l'étape. Si c'est une ligne, il s'agit simplement de (x, y),
 * mais si c'est un arc de cercle, (x, y) représente le centre de l'arc et non le point de destination
 * @param {{'x': float, 'y': float}} srcPoint le point de départ (utile pour un arc de cercle)
 * @return {{'x': float, 'y': float}} 	le point de destination
 */
ShapeStep.prototype.getFinalPoint = function(srcPoint){
	if(this.type=="line") {
		this.__finalPoint = {'x': this.x, 'y': this.y};
		return this.__finalPoint;
	} else if(this.type=="arc") {
		if(!srcPoint || (typeof srcPoint)!=="object" || typeof srcPoint.x!=="number" || typeof srcPoint.y!=="number") {
			console.error("le paramètre srcPoint n'a pas été défini!");
			return null;
		}
		var center = {'x': this.x, 'y': this.y},
			start_angle = window.app.positiveAtan2(srcPoint.y-center.y, srcPoint.x-center.x),
			end_angle = null,
			rayon = Math.sqrt(Math.pow(center.x-srcPoint.x, 2) + Math.pow(center.y-srcPoint.y, 2));
		if(!this.direction) { //sens anti-horloger
			end_angle = window.app.positiveAngle(start_angle + this.angle);
		} else {
			end_angle = window.app.positiveAngle(start_angle - this.angle);
		}

		this.__finalPoint = {
			'x': Math.cos(end_angle)*rayon + center.x,
			'y': Math.sin(end_angle)*rayon + center.y
		};

		return this.__finalPoint;
	} else {
		console.error("ShapeStep.getFinalPoint: unknown type");
		return null;
	}
};

/**
 * récupérer une copie de l'étape
 * @return la copie (ShapeStep)
 */
ShapeStep.prototype.getCopy = function() {
	if(this.type=="line") {
		var tmp = ShapeStep.getLine(this.x, this.y);
		tmp.__finalPoint = this.__finalPoint;
		tmp.isArtificial = this.isArtificial;
		return tmp;
	} else if(this.type=="arc") {
		var tmp = ShapeStep.getArc(this.x, this.y, this.angle, this.direction);
		tmp.__finalPoint = this.__finalPoint;
		tmp.isArtificial = this.isArtificial;
		return tmp;
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
 * @param angle: angle de l'arc de cercle (en radians)
 * @param direction: vrai si l'arc est dessiné dans le sens anti-horloger, false sinon
 */
ShapeStep.prototype.setArc = function(x, y, angle, direction) {
	this.type = "arc";

	this.x = x;
	this.y = y;
	this.angle = angle;
	this.direction = direction;
};
