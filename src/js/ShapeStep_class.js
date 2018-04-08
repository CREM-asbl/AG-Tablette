/**
 * represent a build step of a shape
 */

/**
 * Constructor
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
}

/**
 * Static method: Get a new instance of ShapeStep on which setLine was called
 */
ShapeStep.getLine = function(x, y) {
	var n = new ShapeStep();
	n.setLine(x, y);
	return n;
};

/**
 * Static method: Get a new instance of ShapeStep on which setArc was called
 */
ShapeStep.getArc = function(x, y, angle, direction) {
	var n = new ShapeStep();
	n.setArc(x, y, angle, direction);
	return n;
};

/**
 * Static method: Get a new instance of ShapeStep on which setQuadraticBezierCurve was called
 */
ShapeStep.getQuadraticBezierCurve = function(x, y, cp1X, cp1Y) {
	var n = new ShapeStep();
	n.setQuadraticBezierCurve(x, y, cp1X, cp1Y);
	return n;
};

/**
 * Static method: Get a new instance of ShapeStep on which setCubicBezierCurve was called
 */
ShapeStep.getCubicBezierCurve = function(x, y, cp1X, cp1Y, cp2X, cp2Y) {
	var n = new ShapeStep();
	n.setCubicBezierCurve(x, y, cp1X, cp1Y, cp2X, cp2Y);
	return n;
};

/**
 * get the type of the step
 * @return the type
 */
ShapeStep.prototype.getType = function() {
	return this.type;
};

/**
 * get the type of the step
 * @return the type
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
 * the step is a line
 * @param x: x coordinate of the line's second point
 * @param y: y coordinate of the line's second point
 */
ShapeStep.prototype.setLine = function(x, y) {
	this.type = "line";

	this.x = x;
	this.y = y;
};

/**
 * the step is an arc
 * @param x: x coordinate of the line's second point
 * @param y: y coordinate of the line's second point
 * @param angle: angle of the arc (in degrees)
 * @param direction: true if the angle is drawn clockwise, false if anticlockwise
 */
ShapeStep.prototype.setArc = function(x, y, angle, direction) {
	this.type = "arc";

	this.x = x;
	this.y = y;
	this.angle = angle;
	this.direction = direction;
};

/**
 * the step is a quadratic Bezier curve
 * @param x: x coordinate of the curve's final point
 * @param y: y coordinate of the curve's final point
 * @param cp1X: x coordinate of the control point
 * @param cp1Y: y coordinate of the control point
 */
ShapeStep.prototype.setQuadraticBezierCurve = function(x, y, cp1X, cp1Y) {
	this.type = "quadraticCurve";

	this.x = x;
	this.y = y;
	this.cp1X = cp1X;
	this.cp1Y = cp1Y;
};

/**
 * the step is a cubic Bezier curve
 * @param x: x coordinate of the curve's final point
 * @param y: y coordinate of the curve's final point
 * @param cp1X: x coordinate of the first control point
 * @param cp1Y: y coordinate of the first control point
 * @param cp2X: x coordinate of the second control point
 * @param cp2Y: y coordinate of the second control point
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
