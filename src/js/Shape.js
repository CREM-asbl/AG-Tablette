/**
 * Cette classe représente une forme sur le canvas
 */

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
function Shape(familyName, name, x, y, buildSteps, color, borderColor, refPoint, isPointed, isSided, opacity){

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

	this.id = null; //L'id est défini lorsqu'une forme est ajoutée à un workspace.

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

Shape.prototype.__computePoints = function(){
	this.points = [];
	for (var i = 1; i < this.buildSteps.length; i++) {
		var s = this.buildSteps[i];
		if(s.getType()=="line") {
			this.points.push(new Point(s.x, s.y, "vertex", this));
		} else if(s.getType()=="arc") {
			if(this.buildSteps.length==2) {
				//ne rien faire, c'est un cercle: il n'y a pas de sommets.
			} else {
				// à implémenter si certaines formes contiennent un arc de cercle.
				console.log("Shape.computePoints(): le point n'a pas pu être déterminé");
			}
		} else {
			// à implémenter si certaines formes contiennent des courbes
			console.log("Shape.computePoints(): le point n'a pas pu être déterminé (2)");
		}
	}
};

/**
 * Définir l'identifiant unique de la forme
 * @param id: l'id (int)
 */
Shape.prototype.setId = function(id) {
	this.id = id;
	this.showOrder = id;
};

/**
 * Recalcule les coordonnées des points sur base de BuildSteps
 */
Shape.prototype.recomputePoints = function(){
	var pointIndex = 0;
	for(var i=1;i<this.buildSteps.length;i++) {
		if(this.buildSteps.type=="line") {
			var x = this.buildSteps[i].x;
			var y = this.buildSteps[i].y;
			this.points[pointIndex++].setCoordinates(x, y);
		}
	}
};

/**
 * Ajouter un point lié à la forme
 * @param  {String} type segment ou other
 * @param  {float} x    coordonnée x
 * @param  {float} y    coordonnée y
 */
Shape.prototype.addPoint = function (type, x, y) {
	if(['segment', 'other'].indexOf(type)==1) {
		console.log("Shape.addPoint: unknown type");
		return;
	}
	var arr = (type=='segment') ? this.segmentPoints : this.otherPoints;

	arr.push(new Point(x, y, 'division', this));
};

/**
 * Calcule les sommets (relatifs) d'un polygone approximant la forme
 * @return liste de points ([Point])
 */
Shape.prototype.getApproximatedPointsList = function() {

	//Vérifier si la forme a été modifiée.
	var edited = false;

	var newUpdateIdList = [];
	for(var i=0;i<this.buildSteps.length;i++) {
		newUpdateIdList.push(this.buildSteps[i].updateId);
		if(this._buildStepsUpdateIdList==undefined
			|| this._buildStepsUpdateIdList.length != this.buildSteps.length
			||this.buildSteps[i].updateId != this._buildStepsUpdateIdList[i]) {
			edited = true;
		}
	}
	this._buildStepsUpdateIdList = newUpdateIdList;

	//Si pas modifiée, renvoyer le tableau déjà calculé
	if(!edited && false) {
		var pointsList = [];
		for(var i=0;i<this._approximatedPointsList.length;i++) {
			pointsList.push(this._approximatedPointsList[i]);
		}
		return pointsList;
	}

	//Calculer le polygone approximé.
	var pointsList = [ {"x": this.buildSteps[0].x, "y": this.buildSteps[0].y} ];
	for (var i = 1; i < this.buildSteps.length; i++) {
		if(this.buildSteps[i].getType()=="line") {
			pointsList.push(new Point(this.buildSteps[i].x, this.buildSteps[i].y, null, this));
		} else if(this.buildSteps[i].getType()=="arc") {
			var p1 = this.buildSteps[i-1],
				center = this.buildSteps[i],
				angle = this.buildSteps[i].angle,
				direction = this.buildSteps[i].direction;
			var points = window.app.getApproximatedArc(center, p1, angle, direction, 10);
			for(var j=0;j<points.length;j++) {
				pointsList.push(new Point(points[j].x, points[j].y, null, this));
			}
		} else if(this.buildSteps[i].getType()=="quadraticCurve") {
			console.log("Shape.getApproximatedPointsList: quadraticCurve, no approximation made");
			pointsList.push(new Point(this.buildSteps[i].x, this.buildSteps[i].y, null, this));
		} else if(this.buildSteps[i].getType()=="cubicCurve") {
			console.log("Shape.getApproximatedPointsList: cubicCurve, no approximation made");
			pointsList.push(new Point(this.buildSteps[i].x, this.buildSteps[i].y, null, this));
		} else{
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
 * @author: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
 */
Shape.prototype.containsPoint = function(point) {
	var points = this.getApproximatedPointsList();
	var pos = point.getAbsoluteCoordinates();
	point = {"x": pos.x - this.x, "y": pos.y - this.y}; //calculer le point en position relative

	/* Iterate through each line */
	var crossings = 0;
	var nb_pts = points.length;

	for(var i = 0; i < nb_pts; i++ ){
       	var x1, x2;
        /* This is done to ensure that we get the same result when
           the line goes from left to right and right to left */
        if ( points[i].x < points[ (i+1)%nb_pts ].x ){
            x1 = points[i].x;
            x2 = points[(i+1)%nb_pts].x;
        } else {
            x1 = points[(i+1)%nb_pts].x;
            x2 = points[i].x;
        }

        /* First check if the ray is possible to cross the line */
        if ( point.x > x1 && point.x <= x2 && ( point.y < points[i].y || point.y <= points[(i+1)%nb_pts].y ) ) {
            var eps = 0.000001;

            /* Calculate the equation of the line */
            var dx = points[(i+1)%nb_pts].x - points[i].x;
            var dy = points[(i+1)%nb_pts].y - points[i].y;
            var k;

            if ( Math.abs(dx) < eps ){
                k = Infinity;   // math.h
            } else {
                k = dy/dx;
            }

            var m = points[i].y - k * points[i].x;

            /* Find if the ray crosses the line */
            var y2 = k * point.x + m;
            if ( point.y <= y2 ){
                crossings++;
            }
        }
	}
	if ( crossings % 2 == 1 ){
        return true;
	}
	return false;
};

/**
 * récupère les coordonnées de la forme
 * @return les coordonnées ({x: float, y: float})
 */
Shape.prototype.getCoordinates = function() {

	return {"x": this.x, "y": this.y};
};

/**
 * défini les coordonnées de la forme
 * @param coordinates: les coordonnées ({x: float, y: float})
 */
Shape.prototype.setCoordinates = function(coordinates) {
	this.x = coordinates.x;
	this.y = coordinates.y;
};

/**
 * Récupérer une copie de la forme.
 * Notes: La forme n'aura pas d'id. Le champ linkedShape n'est pas copié et est laissé à null.
 */
Shape.prototype.getCopy = function() {
	var buildStepsCopy = [];
    for(var i=0;i<this.buildSteps.length;i++) {
        buildStepsCopy.push(this.buildSteps[i].getCopy());
    }

	var shape = new Shape(
		this.familyName,
		this.name,
		this.x, this.y,
		buildStepsCopy,
		this.color,
		this.borderColor,
        {"x": this.refPoint.x, "y": this.refPoint.y},
        this.isPointed,
		this.isSided,
		this.opacity);
	shape.isReversed = this.isReversed;
	shape.isPointed = this.isPointed;

	var arrays = [this.segmentPoints, this.otherPoints];
	for(var i=0;i<arrays.length;i++) {
		var arr = arrays[i];
		for(var j=0;j<arr.length;j++) {
			var pos = arr[i].getRelativeCoordinates();
			shape.addPoint(['segment', 'other'][i], pos.x, pos.y);
		}
	}

	return shape;
};
