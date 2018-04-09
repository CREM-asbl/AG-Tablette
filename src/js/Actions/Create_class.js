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
	var family = this.app.state.createData.selectedFamily;
	var shapeData = this.app.state.createData.selectedShape;
	var shape = new Shape(
		family.name, shapeData.name,
		coordinates.x, coordinates.y,
		shapeData.buildSteps, shapeData.color);
	this.app.workspace.addShape(shape);
	this.app.getCanvas().refresh(coordinates);
};