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
 * @param color: the color of the shape (String: "#AABBCC")
 * @param refPoint: coordonnées relatives du point de référence de la forme (point en bas à gauche), utilisé pour ajouter une forme.
 */
function Shape(familyName, name, x, y, buildSteps, color, borderColor, refPoint, isPointed){

	this.x = x;
	this.y = y;
	this.familyName = familyName;
	this.name = name;
	this.buildSteps = buildSteps;
	this.points = [];

	this.id = null;
	this.showOrder = null; //numéro d'ordre d'affichage de la forme (=quelle forme est au dessus de quelle autre; plus le numéro est grand, plus la forme est en haut)

	//if this shape has been created from another, contains the reference of this other shape
	this.sourceShape = null; //TODO: utilisé ?

	//angle of rotation of the shape (in radian)
	this.rotateAngle = 0;

	//true if the shape is reversed
	this.isReversed = false; //todo: doit se faire autrement (retenir l'axe de symétrie utilisé)

	//the scale of the shape, 1 by default
	this.zoomRate = 1;

	//Forme à laquelle celle-ci est liée
	this.linkedShape = null; //TODO: utilisé ?

	//la couleur de la forme. Vaut, par défaut, celle de la famille.
	this.color = color;

	//la couleur des bords de la forme. //TODO: initialiser la valeur lors de la création à partir de la famille?
	this.borderColor = borderColor;

	this.refPoint = refPoint; //relatif au centre (0,0)

	//La forme a-t-elle 2 faces (-> 2 couleurs différentes) ou pas ? La couleur de l'autre face, le cas échéant, est le complément de la couleur de base.
	this.isSided = false;

	//Les sommets de la forme sont-ils affichés ?
	this.isPointed = isPointed;

	this.computePoints();
}

/**
 * Define the uniq id of the shape
 * @param id: the id (int)
 */
Shape.prototype.setId = function(id) {
	this.id = id;
	this.showOrder = id;
};

/**
 * Define the source shape of this shape
 * @param shape: the source shape (Shape)
 */
Shape.prototype.setSourceShape = function(shape) { //TODO: utilisé?
	this.sourceShape = shape;
};

//points utilisés dans le workspace pour lier des formes entres elles lors de l'ajout de formes
Shape.prototype.computePoints = function(){
	for (var i = 1; i < this.buildSteps.length; i++) {
		var s = this.buildSteps[i];
		if(s.getType()=="line") {
			this.points.push({
				"x": s.x, "y": s.y, //x et y relatifs
				"absX": this.x + s.x, "absY": this.y + s.y, //x et y absolus, avec rotation
				"link": null,
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

//recalcule les coordonnées absolues des points (sont modifiées si
//la forme est déplacée, zoomée, retournée ou tournée).
//TODO: faire tourner le refPoint ? ou pas ? est-il utile après création?
Shape.prototype.recomputePoints = function(){
	var s = Math.sin(-this.rotateAngle);
    var c = Math.cos(-this.rotateAngle);

	for(var i=0;i<this.points.length;i++) {
		var x = this.points[i].x;
		var y = this.points[i].y;

		var newX = x * c - y * s;
		var newY = x * s + y * c;

		this.points[i].absX = this.x + newX;
		this.points[i].absY = this.y + newY;
	}
};

/**
 * Compute an approximated path of the shape, using only lines (no arc or curves)
 * @param shape: the source shape (Shape)
 * @return the list of lines ([{"x": float, "y": float}])
 */ //TODO performance: stocker cette liste tant que la forme n'est pas modifiée?
Shape.prototype.getApproximatedPointsList = function() {
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
			//TODO: compute a better approximation
			pointsList.push({"x": this.buildSteps[i].x, "y": this.buildSteps[i].y});
		} else if(this.buildSteps[i].getType()=="cubicCurve") {
			//TODO: compute a better approximation
			pointsList.push({"x": this.buildSteps[i].x, "y": this.buildSteps[i].y});
		} else{
			console.log("Shape.getApproximatedPointsList: unknown buildStep type");
			return null;
		}
	}


	//rotate the points
	var s = Math.sin(-this.rotateAngle);
    var c = Math.cos(-this.rotateAngle);

	for(var i=0;i<pointsList.length;i++) {
		// translater le point au centre:
	    var x = pointsList[i].x;
	    var y = pointsList[i].y;

	    // effectuer la rotation
	    var newX = x * c - y * s;
	    var newY = x * s + y * c;

	    // retranslater le point à sa position d'origine
	    pointsList[i].x = newX;
	    pointsList[i].y = newY;
	}


	return pointsList;
}

/**
 * Check if a point is in a shape or not
 * @param point: the point ({x: int, y: int})
 * @return true if the point is in the shape, false otherwise
 * @author: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
 */
Shape.prototype.containsPoint = function(point) {
	//TODO: ne calculer qu'une fois les points approximatifs si la forme ne change pas
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
 * get the position of the shape
 * @return the position ({x: float, y: float})
 */
Shape.prototype.getCoordinates = function() {
	return {"x": this.x, "y": this.y};
};

/**
 * set the position of the shape
 * @param coordinates: the position ({x: float, y: float})
 */
Shape.prototype.setCoordinates = function(coordinates) {
	this.x = coordinates.x;
	this.y = coordinates.y;
};
