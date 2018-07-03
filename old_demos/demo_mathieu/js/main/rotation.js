
/**
 * Called when the user clicks while rotating a shape, to end the rotation
 */
App.rotation.terminate = function(mousePos){
	var shape = App.shapes[App.modes.rotateInfo.shapeIndex];
	App.modes.isRotating = false;
	var angles = App.rotation.getAngles(mousePos);

	//update the shape's angle
	shape.angle = angles.angle;
};

/**
 * Start a rotation, called when the user clicks on the canvas, in the rotation mode
 */
App.rotation.start = function(mouseX, mouseY) {
	var shapeIndex = isPointOnShape(App.shapes, {x: mouseX, y: mouseY});
	if(shapeIndex!==false) { //if we clicked on a shape
		App.modes.isRotating = true;
		App.modes.rotateInfo.x = mouseX;
		App.modes.rotateInfo.y = mouseY;
		App.modes.rotateInfo.shapeIndex = shapeIndex;
	}
};

/**
 * Cancel a rotation, called when the user was making a rotation but clicked on a menu button
 */
App.rotation.cancel = function(){
	App.modes.isRotating = false;
};

/**
 * Compute the angle of the currently rotating shape
 * 	 -> based on the mouse position, the coordinate of the
 *		first click on the shape, and on the shape start angle
 */
App.rotation.getAngles = function(mousePos){
	var mouseX = mousePos[0], mouseY = mousePos[1];
	var shape = App.shapes[App.modes.rotateInfo.shapeIndex];
	var x = shape.getX(), y = shape.getY();

	var start_angle = getAngleBetweenPoints(App.modes.rotateInfo, {'x': (x+25), 'y': (y+25)}) - shape.angle;
	var angle = getAngleBetweenPoints({'x': mouseX, 'y': mouseY}, {'x': (x+25), 'y': (y+25)}) - start_angle;
	if(angle<0)
		angle += 2*Math.PI;

	var shown_angle = parseInt(180*angle/Math.PI); //arrondi l'angle au degré près
	angle = shown_angle*Math.PI/180;
	return {'shown_angle': shown_angle, 'angle': angle};
};