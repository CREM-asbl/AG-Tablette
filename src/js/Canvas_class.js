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


	if(this.previousMouseCoordinates!==undefined && mouseCoordinates==undefined)
		mouseCoordinates = this.previousMouseCoordinates;
	if(mouseCoordinates!==undefined) {
		this.previousMouseCoordinates = mouseCoordinates;

		if(state.name=="global_zoom" && state.isZooming) {
			var newDist = Math.sqrt( Math.pow(mouseCoordinates.x, 2) + Math.pow(mouseCoordinates.y, 2));
			var oldDist = state.baseDistance;

			if(newDist==0) newDist=0.1;
			if(oldDist==0) oldDist=0.1;

			var baseZoom = this.app.workspace.zoomLevel;
			if(newDist>=oldDist) {
				baseZoom *= newDist/oldDist;
			} else {
				baseZoom *= newDist/oldDist;
			}

			this.app.workspace.setZoomLevel(baseZoom, false);

		}

	}

	this.drawBackground();

	//dessine les formes
	var shapes = this.app.workspace.shapesList;
	for (var i = 0; i < shapes.length; i++) { //TODO: draw in the good order (see order-array in workspace)
		if(state.name=="move_shape" && state.isMoving && state.shapesList.indexOf(shapes[i])!=-1)
			continue;
		if(state.name=="rotate_shape" && state.isRotating && state.shapesList.indexOf(shapes[i])!=-1)
			continue;

		this.drawShape(shapes[i]);
	}

	if(mouseCoordinates==undefined)
		return;

	//dessine la forme/le groupe de formes qui est en train d'être bougé
	if(state.name=="move_shape" && state.isMoving) {
		for(var i=0;i<state.shapesList.length;i++) {
			//calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
			var xDiff = state.clickCoordinates.x - state.shapesList[i].x;
			var yDiff = state.clickCoordinates.y - state.shapesList[i].y;

			var newX = mouseCoordinates.x - xDiff;
			var newY = mouseCoordinates.y - yDiff;

			this.drawMovingShape(state.shapesList[i], {"x": newX, "y": newY});
		}

	}

	//dessine la forme qui est en train d'être ajoutée
	if(state.name=="create_shape") {
		this.drawMovingShape(state.selectedShape, {
			"x": mouseCoordinates.x - state.selectedShape.refPoint.x,
			"y": mouseCoordinates.y - state.selectedShape.refPoint.y
		});

		//afficher le point sur lequel la forme va se coller le cas échéant
		var pointsNear = this.app.workspace.pointsNearPoint(mouseCoordinates);
	    if(pointsNear.length>0) {
	        var last = pointsNear[pointsNear.length-1];
			var pos = {"x": last.absX, "y": last.absY};
			this.drawPoint(pos, "#F00");
			this.drawCircle(pos, "#000", 6);
		}
	}

	//dessine la forme/le groupe de formes qui est en train d'être tourné
	if(state.name=="rotate_shape" && state.isRotating) {
		var AngleDiff = this.app.getAngleBetweenPoints(state.selectedShape, mouseCoordinates) - state.startAngle;
		for(var i=0;i<state.shapesList.length;i++) {
			var pos = state.computeNewShapePos(state.shapesList[i], AngleDiff);
			this.drawRotatingShape(state.shapesList[i], pos, AngleDiff);
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
	ctx.fillRect(0,0,canvasWidth*10,canvasHeight*10); //TODO: utiliser maxZoomLevel...
};

/**
 * draw a shape on the canvas
 * @param shape: the shape to draw (Shape)
 */
Canvas.prototype.drawShape = function(shape) {
	var ctx = this.ctx;

	ctx.fillStyle = shape.color;
	ctx.strokeStyle = shape.borderColor;
	ctx.lineWidth = (new Number( 2 / this.app.workspace.zoomLevel )).toString();
	ctx.globalAlpha = 0.7;

	ctx.translate(shape.x, shape.y);
	ctx.rotate(-shape.rotateAngle);

	//dessine le chemin principal
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
			//TODO
			console.log("Canvas.drawShape: missed one step:");
			console.log(shape.buildSteps[i]);
		}
	}
	ctx.lineTo(firstPoint.x, firstPoint.y);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	if(shape.isPointed) {
		//dessine les points (noirs) de la forme
		for(var i=0;i<shape.points.length;i++) {
			this.drawPoint(shape.points[i], "#000");
		}
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
	ctx.arc(point.x, point.y, 2 / this.app.workspace.zoomLevel, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.fill();
}

Canvas.prototype.drawCircle = function(point, color, radius) {
	var ctx = this.ctx;

	ctx.globalAlpha = 1;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius / this.app.workspace.zoomLevel, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.stroke();
}

Canvas.prototype.drawMovingShape = function(shape, point) {
	var coords = shape.getCoordinates();
	shape.setCoordinates(point);
	this.drawShape(shape);
	shape.setCoordinates(coords);
};

Canvas.prototype.drawRotatingShape = function(shape, point, angle) {
	var saveAngle = shape.rotateAngle;
	shape.rotateAngle += angle;
	this.drawMovingShape(shape, point);
	shape.rotateAngle = saveAngle;
};

/**
 * Modifie l'échelle du canvas de manière relative.
 * @param newScale: nouvelle échelle relative (float)
 */
Canvas.prototype.updateRelativeScaleLevel = function(newScale) {
	this.ctx.scale(newScale, newScale);
}
