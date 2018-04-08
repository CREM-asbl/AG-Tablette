/**
 * This class represent a shape on the canvas
 */

/**
 * Constructor
 * @param familyName: the name of the family of the shape (String)
 * @param name: the name/type of shape (String)
 * @param x: the x coordinate (int)
 * @param y: the y coordinate (int)
 * @param buildSteps: list of the build steps of the shape ([ShapeStep]). The first one must be a line (=first point)
 * @param color: the color of the shape (String: "#AABBCC")
 */
function Shape(familyName, name, x, y, buildSteps, color){

	this.x = x;
	this.y = y;
	this.familyName = familyName;
	this.name = name;
	this.buildSteps = buildSteps;
	this.id = null;

	//if this shape has been created from another, contains the reference of this other shape
	this.sourceShape = null;

	//angle of rotation of the shape (in degrees)
	this.rotateAngle = 0;

	//true if the shape is reversed
	this.isReversed = false; //todo: doit se faire autrement (retenir l'axe de symétrie utilisé)

	//the scale of the shape, 1 by default
	this.zoomRate = 1;

	//the list of shapes linked to this one (shapes can be linked together)
	this.linkedShapes = [];

	this.color = color;
}

/**
 * Define the uniq id of the shape
 * @param id: the id (int)
 */
Shape.prototype.setId = function(id) {
	this.id = id;
};

/**
 * Define the source shape of this shape
 * @param shape: the source shape (Shape)
 */
Shape.prototype.setSourceShape = function(shape) {
	this.sourceShape = shape;
};

/**
 * Define the source shape of this shape
 * @param shape: the source shape (Shape)
 */
Shape.prototype.getApproximatedPointsList = function() {
	var pointsList = [ {"x": this.buildSteps[0].x, "y": this.buildSteps[0].y} ];
	for (var i = 1; i < this.buildSteps.length; i++) {
		if(this.buildSteps[i].getType()=="line") {
			pointsList.push({"x": this.buildSteps[0].x, "y": this.buildSteps[0].y});
		} else if(this.buildSteps[i].getType()=="arc") {
			pointsList.push({"x": this.buildSteps[0].x, "y": this.buildSteps[0].y});
		} else if(this.buildSteps[i].getType()=="quadraticCurve") {
			//todo: compute a better approximation
			pointsList.push({"x": this.buildSteps[0].x, "y": this.buildSteps[0].y});
		} else if(this.buildSteps[i].getType()=="cubicCurve") {
			//todo: compute a better approximation
			pointsList.push({"x": this.buildSteps[0].x, "y": this.buildSteps[0].y});
		} else{
			console.log("Shape.getApproximatedPointsList: unknown buildStep type");
			return null;
		}
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
