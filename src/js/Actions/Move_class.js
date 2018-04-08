function Move(app) { this.app = app; }

Move.prototype.start = function(shape) {
	console.log("move start!");
	console.log(shape);
};

Move.prototype.end = function(coordinates) {
	
};

Move.prototype.cancel = function(coordinates) {
	
};