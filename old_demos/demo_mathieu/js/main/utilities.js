
/**
 * Get the mouse coordinates, relative to the canvas top left corner
 * @param event: the parameter received with onclick/onmousemove
 * TODO: check browser compatibility (IE, edge)
 */
function getMousePositionFromEvent(event) {
	if(event.offsetX!==undefined) {
		return [event.offsetX, event.offsetY];
	} else if(event.layerX!==undefined) {
		return [event.layerX-1, event.layerY-1]; //todo: no "-1" if no border?
	} else {
		alert("navigator not compatible, to do: use clientX/Y to get mouse position");
		return null;
	}
}

/**
 * Check if a point (ex: the mouse coordinates) is on a shape of the canvas
 * @returns: false if it is not, else it returns the index of the newest shape that is on the point
 */
function isPointOnShape(shapes, point) {
	var shapeIndex = undefined;
	for(var i=shapes.length-1;i>=0;i--) { //start at the end, because a shape can be over another, and with this method it returns the last shape added that matches the condition
		var x = shapes[i].getX(), y = shapes[i].getY();
		if((point.x >= x && point.x <= x+50) && (point.y >= y && point.y <= y+50)) {
			shapeIndex = i;
			break;
		}
	}
	if(shapeIndex!==undefined)
		return shapeIndex;
	return false;
}

/**
 * Get the angle (in radians) between two points
 */
function getAngleBetweenPoints(a, b) {
	var angle = Math.atan2(a.x-b.x, a.y-b.y);
	if(angle<0)
		angle += 2*Math.PI;
	return angle;
}