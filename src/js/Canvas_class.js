/**
 * Représente le <canvas>, contient les méthodes de dessin
 */

/**
 * Constructeur
 * @param divRef: le <div> contenant le <canvas> (balise HTML)
 * @param canvasRef: le <canvas> (balise HTML)
 * @param app: référence vers l'application (App)
 */
function Canvas(divRef, canvasRef, app) {
	this.app = app;
	this.divRef = divRef;
	this.cvsRef = canvasRef;
	this.ctx = canvasRef.getContext("2d");
	//this.isAnimating = false; //si vaut vrai, c'est qu'une animation (ex retournement) est en cours.
	//TODO: utiliser ça ? pour ne plus mettre à jour avec mousemove pendant ce temps là.
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
 * Dessine le canvas
 */
Canvas.prototype.refresh = function(mouseCoordinates/*, options*/) {
	var state = this.app.state;
	/*if(options===undefined) options = {};
	if(this.isAnimating && options.animation!==true)
		return;*/

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
		var shape = shapes[i];
		if(state.name=="move_shape" && state.isMoving && state.shapesList.indexOf(shape)!=-1)
			continue;
		if(state.name=="rotate_shape" && state.isRotating && state.shapesList.indexOf(shape)!=-1)
			continue;
		if(state.name=="reverse_shape" && state.isReversing && state.shapesList.indexOf(shape)!=-1)
			continue;

		this.drawShape(shape);

		//affiche les user-groups sur les formes (texte)
		if(state.name=="link_shapes") {
			var group = this.app.workspace.getShapeGroup(shape, 'user');
			var pos = {"x": shape.x - 25, "y": shape.y};
			if(group!==null) {
				var groupIndex = this.app.workspace.getGroupIndex(group, 'user');
				this.drawText("Groupe "+(groupIndex+1), pos, '#000');
			} else if(shape==state.firstShape) {
				this.drawText("Groupe "+(this.app.workspace.userShapeGroups.length+1), pos, '#666');
			}
		}
	}

	if(mouseCoordinates==undefined)
		return;

	//TODO: déplacer ça dans les classes des états ?

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

	/**
	 * Dessine l'axe de symétrie si l'on est en mode retournement et que l'on
	 * survolle une forme, sans qu'une animation soit en cours
	 */
	if(state.name=="reverse_shape" && !state.isReversing) {
		var list = window.app.workspace.shapesOnPoint(mouseCoordinates);
	    if(list.length>0) {
			var shape = list.pop();
			var axis = state.getSymmetryAxis(shape, mouseCoordinates);
			this.drawLine(axis[0], axis[1]);
		}
	}

	//Dessine les formes qui sont en train d'être retournées (animation)
	if(state.name=="reverse_shape" && state.isReversing) {
		//Dessiner les formes:
		for(var i=0;i<state.shapesList.length;i++) {
			this.drawReversingShape(state.shapesList[i], state.axe, state.getProgress());
		}

		//Dessiner l'axe de symétrie:
		var shape = state.selectedShape;
		var axis = state.getSymmetryAxis(shape, state.clickCoordinates);
		this.drawLine(axis[0], axis[1]);
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
 * Dessine une forme sur le canvas
 * @param shape: la forme à dessiner (Shape)
 */
Canvas.prototype.drawShape = function(shape) {
	var ctx = this.ctx;

	ctx.fillStyle = shape.color;
	ctx.strokeStyle = shape.borderColor;
	ctx.lineWidth = (new Number( 2 / this.app.workspace.zoomLevel )).toString();
	ctx.globalAlpha = 0.7;

	ctx.translate(shape.x, shape.y);
	//TODO remove ctx.rotate(-shape.rotateAngle);

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

	if(this.app.state.name == "rotate_shape" && this.app.state.selectedShape==shape) {
		this.drawPoint({"x": 0, "y": 0}, "#000");
	}

	ctx.globalAlpha = 1;

	//TODO remove ctx.rotate(shape.rotateAngle);

	ctx.translate(-shape.x, -shape.y);
};

/**
 * Dessine une forme qui est en train d'être bougée
 * @param shape: la forme à dessiner (Shape)
 * @param point: la position de la forme ({'x': int, 'y': int})
 */
Canvas.prototype.drawMovingShape = function(shape, point) {
	var coords = shape.getCoordinates();
	shape.setCoordinates(point);
	this.drawShape(shape);
	shape.setCoordinates(coords);
};

/**
 * Dessine une forme qui est en train d'être tournée
 * @param shape: la forme à dessiner (Shape)
 * @param point: la position de la forme ({'x': int, 'y': int})
 * @param angle: l'angle de la forme (float, en radians)
 */
Canvas.prototype.drawRotatingShape = function(shape, point, angle) {
	var tmpBuildSteps = [];
	for(var i=0;i<shape.buildSteps.length;i++) {
		var transformation = this.app.state.computePointPosition(shape.buildSteps[i], angle);
		tmpBuildSteps.push([ shape.buildSteps[i].x, shape.buildSteps[i].y ]);
		shape.buildSteps[i].x = transformation.x;
		shape.buildSteps[i].y = transformation.y;
	}
	shape.recomputePoints();

	this.drawMovingShape(shape, point);

	for(var i=0;i<tmpBuildSteps.length;i++) {
		shape.buildSteps[i].x = tmpBuildSteps[i][0];
		shape.buildSteps[i].y = tmpBuildSteps[i][1];
	}
	shape.recomputePoints();
};

/**
 * Dessine une forme qui est en train d'être retournée (animation)
 * @param shape: la forme à dessiner (Shape)
 * @param axe: l'axe de symétrie (Object, voir ReverseState.axe)
 * @param progress: l'avancement de l'animation (float, entre 0 et 1)
 */
Canvas.prototype.drawReversingShape = function(shape, axe, progress) {
	var saveShapeCenter = {'x': shape.x, 'y': shape.y};
	var saveAxeCenter = axe.center;

	var newShapeCenter = this.app.state.computePointPosition(shape, axe, progress);
	axe.center = {'x': 0, 'y': 0};
	shape.x = newShapeCenter.x;
	shape.y = newShapeCenter.y;

	var tmpBuildSteps = [];
	for(var i=0;i<shape.buildSteps.length;i++) {
		var transformation = this.app.state.computePointPosition(shape.buildSteps[i], axe, progress);
		tmpBuildSteps.push([ shape.buildSteps[i].x, shape.buildSteps[i].y ]);
		shape.buildSteps[i].x = transformation.x;
		shape.buildSteps[i].y = transformation.y;
	}
	shape.recomputePoints();

	this.drawShape(shape);

	axe.center = saveAxeCenter;
	shape.x = saveShapeCenter.x;
	shape.y = saveShapeCenter.y;
	for(var i=0;i<tmpBuildSteps.length;i++) {
		shape.buildSteps[i].x = tmpBuildSteps[i][0];
		shape.buildSteps[i].y = tmpBuildSteps[i][1];
	}
	shape.recomputePoints();
};

/**
 * Modifie l'échelle du canvas de manière relative.
 * @param newScale: nouvelle échelle relative (float)
 */
Canvas.prototype.updateRelativeScaleLevel = function(newScale) {
	var ctx = this.ctx;
	ctx.scale(newScale, newScale);
};

/**
 * Dessine un texte
 * @param text: le texte
 * @param point: la position ({'x': int, 'y': int})
 * @param color: la couleur du texte
 */
Canvas.prototype.drawText = function(text, point, color) {
	var ctx = this.ctx;

	ctx.fillStyle = color;
	ctx.font = "13px Arial";
	ctx.fillText(text, point.x, point.y);

};

/**
 * Dessine un point
 * @param point: la position ({'x': int, 'y': int})
 * @param color: la couleur du point
 */
Canvas.prototype.drawPoint = function(point, color) {
	var ctx = this.ctx;

	ctx.globalAlpha = 1;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(point.x, point.y);
	ctx.arc(point.x, point.y, 2 / this.app.workspace.zoomLevel, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.fill();
};

/**
 * Dessine un cercle
 * @param point: la position ({'x': int, 'y': int})
 * @param color: la couleur du texte
 * @param radius: le rayon du cercle (float)
 */
Canvas.prototype.drawCircle = function(point, color, radius) {
	var ctx = this.ctx;

	ctx.globalAlpha = 1;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius / this.app.workspace.zoomLevel, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.stroke();
};

/**
 * Dessine un segment
 * @param fromPoint: le point de départ ({'x': int, 'y': int})
 * @param toPoint: le point d'arrivée ({'x': int, 'y': int})
 */
Canvas.prototype.drawLine = function(fromPoint, toPoint) {
	var ctx = this.ctx;
	ctx.beginPath();
	ctx.moveTo(fromPoint.x, fromPoint.y);
	ctx.lineTo(toPoint.x, toPoint.y);
	ctx.closePath();
	ctx.stroke();
};
