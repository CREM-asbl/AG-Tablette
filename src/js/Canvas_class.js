/**
 * Représente le <canvas>, contient les méthodes de dessin
 */

/**
 * Constructeur
 * @param divRef: the <div> containing the <canvas> (HTML element)
 * @param canvasRef: the <canvas> (HTML element)
 * @param app: the app reference (App)
 */
function Canvas(divRef, canvasRef, app) {
	this.app = app;
	this.divRef = divRef;
	this.cvsRef = canvasRef;
	this.ctx = canvasRef.getContext("2d");
}

/**
 * Renvoie le <div> contenant le <canvas>
 * @return le div (élément HTML)
 */
Canvas.prototype.getDiv = function(){
	return this.divRef;
};

/**
 * Renvoie l'élément html <canvas>
 * @return <canvas (élément HTML)
 */
Canvas.prototype.getCanvas = function(){
	return this.cvsRef;
};

/**
 * Re-draw everything on the canvas
 */
Canvas.prototype.refresh = function(mouseCoordinates) {
	var state = this.app.state;

	this.drawBackground();

	var shapes = this.app.workspace.shapesList;
	for (var i = 0; i < shapes.length; i++) { //todo: draw in the good order (see order-array in workspace)
		if(state.name=="move_shape" && state.isMoving && state.shapesList.indexOf(shapes[i])!=-1)
			continue;
		this.drawShape(shapes[i]);
	}

	if(state.name=="move_shape" && state.isMoving) {
		for(var i=0;i<state.shapesList.length;i++) {
			//calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
			var xDiff = state.clickCoordinates.x - state.shapesList[i].x;
			var yDiff = state.clickCoordinates.y - state.shapesList[i].y;

			var newX = mouseCoordinates.x - xDiff;
			var newY = mouseCoordinates.y - yDiff;

			console.log("NEW:");
			console.log(state.clickCoordinates.x+" "+state.clickCoordinates.y);
			console.log(state.shapesList[i].x+" "+state.shapesList[i].y);
			console.log(mouseCoordinates.x +" "+mouseCoordinates.y);
			console.log(xDiff+" "+yDiff);
			console.log(newX+" "+newY);
			console.log("END.");
			console.log(" ");


			this.drawMovingShape(state.shapesList[i], {"x": newX, "y": newY});
		}

	}

	if(state.name=="create_shape") {
		this.drawMovingShape(state.selectedShape, mouseCoordinates);

		//afficher le point sur lequel la forme va se coller le cas échéant
		var pointsNear = this.app.workspace.pointsNearPoint(mouseCoordinates);
	    if(pointsNear.length>0) {
	        console.log("points near found!");
	        var last = pointsNear[pointsNear.length-1];
			var pos = {"x": last.absX, "y": last.absY};
			this.drawPoint(pos, "#F00");
			this.drawCircle(pos, "#000", 6);
		}
	}
};

/**
 * draw the background of the canvas
 */
Canvas.prototype.drawBackground = function() {
	var ctx = this.ctx;
	var canvasWidth = this.cvsRef.clientWidth;
	var canvasHeight = this.cvsRef.clientHeight;

	//white rectangle:
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	ctx.fillRect(0,0,canvasWidth,canvasHeight);
};

/**
 * draw a shape on the canvas
 * @param shape: the shape to draw (Shape)
 */
Canvas.prototype.drawShape = function(shape) {
	var ctx = this.ctx;

	ctx.fillStyle = shape.color;
	ctx.strokeStyle = "#000";
	ctx.lineWidth = "2";
	ctx.globalAlpha = 0.7;

	ctx.translate(shape.x, shape.y);
	ctx.rotate(-shape.rotateAngle);

	ctx.beginPath();
	var firstPoint = shape.buildSteps[0];

	ctx.moveTo(firstPoint.x, firstPoint.y);
	for (var i = 1; i < shape.buildSteps.length; i++) {
		var s = shape.buildSteps[i];
		if(s.getType()=="line") {
			ctx.lineTo(s.x, s.y);

		} else if(s.getType()=="arc") {
			var start_pos = {"x": shape.buildSteps[i-1].x, "y": shape.buildSteps[i-1].y};
			var rayon = Math.sqrt(Math.pow(s.x - start_pos.x, 2) + Math.pow(s.y - start_pos.y, 2));

			var start_angle = this.app.getAngleBetweenPoints(start_pos, s);
			ctx.arc(s.x, s.y, rayon, start_angle, start_angle+s.angle*Math.PI/180, s.direction);
		} else {
			//todo
			console.log("Canvas.drawShape: missed one step:");
			console.log(shape.buildSteps[i]);
		}
	}
	ctx.lineTo(firstPoint.x, firstPoint.y);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	//draw points
	for(var i=0;i<shape.points.length;i++) {
		this.drawPoint(shape.points[i], "#000");
	}

	ctx.globalAlpha = 1;

	ctx.rotate(shape.rotateAngle);
	ctx.translate(-shape.x, -shape.y);
};

Canvas.prototype.drawPoint = function(point, color) {
	var ctx = this.ctx;

	ctx.globalAlpha = 1;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(point.x, point.y);
	ctx.arc(point.x, point.y, 2, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.fill();
}

Canvas.prototype.drawCircle = function(point, color, radius) {
	var ctx = this.ctx;

	ctx.globalAlpha = 1;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.stroke();
}

Canvas.prototype.drawMovingShape = function(shape, point) {
	var coords = shape.getCoordinates();
	shape.setCoordinates(point);
	this.drawShape(shape);
	shape.setCoordinates(coords);
};
