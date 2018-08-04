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
	this.points = []; //les sommets de la forme

	this.segmentPoints = []; //liste de points qui se trouvent sur le contour de la forme

	//Liste de points situés dans ou en dehors de la forme (par ex le centre)
	this.otherPoints = [];

	this.id = null;
	this.showOrder = null; //numéro d'ordre d'affichage de la forme (=quelle forme est au dessus de quelle autre; plus le numéro est grand, plus la forme est en haut)

	//vrai si la forme a été retournée (pour savoir quelle face est visible)
	this.isReversed = false;

	//Forme à laquelle celle-ci est liée
	this.linkedShape = null;

	//la couleur de la forme. Vaut, par défaut, celle de la famille.
	this.color = color;

	//la couleur des bords de la forme.
	this.borderColor = borderColor;

	//point de référence de la forme (utilisé lors de l'ajout d'une forme), relatif au centre (0,0)
	this.refPoint = refPoint;

	//La forme a-t-elle 2 faces (-> 2 couleurs différentes) ou pas ? La couleur de l'autre face, le cas échéant, est le complément de la couleur de base.
	this.isSided = isSided;

	//Les sommets de la forme sont-ils affichés ?
	this.isPointed = isPointed;

	//l'opacité de la forme, entre 0 et 1
	this.opacity = opacity;

	this.computePoints();
}

/**
 * Définir l'identifiant unique de la forme
 * @param id: l'id (int)
 */
Shape.prototype.setId = function(id) {
	this.id = id;
	this.showOrder = id;
};

/**
 * Calcule la liste des points de la forme à partir des étapes de construction.
 * Note: ces points sont utilisés dans le workspace pour lier des formes entres elles lors de l'ajout de formes
 */
Shape.prototype.computePoints = function(){
	this.points = [];
	for (var i = 1; i < this.buildSteps.length; i++) {
		var s = this.buildSteps[i];
		if(s.getType()=="line") {
			this.points.push({
				"x": s.x, "y": s.y, //x et y relatifs
				"absX": this.x + s.x, "absY": this.y + s.y, //x et y absolus
				"link": null, //pas utilisé ? pas sûr.
				"shape": this
			});
		} else if(s.getType()=="arc") {
			if(this.buildSteps.length==2) {
				//ne rien faire: c'est un cercle.
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
 * Recalcule les coordonnées absolues des points.
 * Note: nécessaire si la forme est déplacée, zoomée, retournée ou tournée).
 */
Shape.prototype.recomputePoints = function(){
	for(var i=0;i<this.points.length;i++) {
		var x = this.buildSteps[i].x;
		var y = this.buildSteps[i].y;

		this.points[i].x = x;
		this.points[i].y = y;

		this.points[i].absX = this.x + x;
		this.points[i].absY = this.y + y;
	}
};

/**
 * Calcule les sommets d'un polygone approximant la forme
 * @return liste de points ([{"x": float, "y": float}])
 */
Shape.prototype.getApproximatedPointsList = function() {
	/**
	 * TODO performance:
	 * Stocker la liste calculée dans une variable, et utiliser cette variable les fois suivantes tant que la forme
	 * n'a pas été modifiée (buildSteps). Nécessite de savoir quand buildSteps est modifié...
	 */

	var pointsList = [ {"x": this.buildSteps[0].x, "y": this.buildSteps[0].y} ];
	for (var i = 1; i < this.buildSteps.length; i++) {
		if(this.buildSteps[i].getType()=="line") {
			pointsList.push({"x": this.buildSteps[i].x, "y": this.buildSteps[i].y});
		} else if(this.buildSteps[i].getType()=="arc") {
			var x = this.buildSteps[i].x,
				y = this.buildSteps[i].y,
				start_pos = {"x": this.buildSteps[i-1].x, "y": this.buildSteps[i-1].y},
				angle = this.buildSteps[i].angle,
				direction = this.buildSteps[i].direction;

			var rayon = Math.sqrt(Math.pow(x - start_pos.x, 2) + Math.pow(y - start_pos.y, 2));
			var start_angle = window.app.getAngleBetweenPoints(start_pos, {"x": x, "y": y});
			var end_angle = start_angle+angle*Math.PI/180;
			var step_angle = 10 *Math.PI/180;

			if(direction) {
				var tmp = start_angle + Math.PI*2;
				start_angle = end_angle;
				end_angle = tmp;
			}

			var cur_angle = start_angle;
			while(cur_angle+step_angle < end_angle) {
				cur_angle += step_angle;

				var posX = rayon * Math.sin(cur_angle) + x,
					posY = rayon * Math.cos(cur_angle) + y;

				pointsList.push({"x": posX,"y": posY});

			}

		} else if(this.buildSteps[i].getType()=="quadraticCurve") {
			console.log("Shape.getApproximatedPointsList: quadraticCurve, no approximation made");
			pointsList.push({"x": this.buildSteps[i].x, "y": this.buildSteps[i].y});
		} else if(this.buildSteps[i].getType()=="cubicCurve") {
			console.log("Shape.getApproximatedPointsList: cubicCurve, no approximation made");
			pointsList.push({"x": this.buildSteps[i].x, "y": this.buildSteps[i].y});
		} else{
			console.log("Shape.getApproximatedPointsList: unknown buildStep type");
			return null;
		}
	}

	return pointsList;
}

/**
 * Vérifie si un point est dans la forme ou non
 * @param point: le point ({x: int, y: int})
 * @return true si le point est dans la forme, false sinon
 * @author: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
 */
Shape.prototype.containsPoint = function(point) {
	var points = this.getApproximatedPointsList();
	point = {"x": point.x - this.x, "y": point.y - this.y};

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
	//TODO: retirer certains shape.recomputePoints() du code, et appeler cette méthode ici.
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
	//TODO: compléter avec les autres tableaux de points.
	return shape;
};
