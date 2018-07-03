var ShapeClass_nextShapeId = 1;

/**
 * Represents a shape
 */
function Shape(type, position) {
	/**
	 * Shape's uniq identifier
	 */
	this.id = ShapeClass_nextShapeId++;
	
	/**
	 * Shape's type
	 * Values: square, 
	 */
	if(type!=="square") {
		console.log("Shape class: bad shape type");
		new Error("Shape class: bad shape type");
		return null;
	}
	this.type = type;
	
	/**
	 * Shape's position: [x, y]
	 */
	this.position = position;

	/**
	 * get the X coordinate
	 */
	this.getX = function() {
		return this.position[0];
	};

	/**
	 * get the Y coordinate
	 */
	this.getY = function() {
		return this.position[1];
	};
	
	/**
	 * Shape's angle, in radians
	 */
	this.angle = 0;
}