function Move(app) { this.app = app; }

Move.prototype.start = function(shape) {
	console.log("move start!");
	console.log(shape);
	this.app.state.moveData.shape = shape;
	this.app.state.moveData.isShapeSelected = true;
};

Move.prototype.end = function(coordinates) {
	this.app.state.moveData.shape.setCoordinates(coordinates);
	this.app.state.moveData.shape = null;
	this.app.state.moveData.isShapeSelected = false;
};

Move.prototype.cancel = function(coordinates) {
	
};
