/**
 * This class can perform a shape creation
 */

/**
 * Constructor
 */
function Create(app) { this.app = app; }

/**
 * Create a shape on the canvas
 */
Create.prototype.do = function(coordinates) {
	var family = app.state.createData.selectedFamily;
	var shapeData = app.state.createData.selectedShape
	var shape = new Shape(
		family.name, shapeData.name,
		coordinates.x, coordinates.y,
		shapeData.points, shapeData.color);
	console.log(shape);
	app.workspace.addShape(shape);
	app.getCanvas().refresh();
};