/**
 * Représente le <canvas>, contient les méthodes de dessin
 */

/**
 * Constructeur
 * @param divRef: le <div> contenant le <canvas> (balise HTML)
 * @param canvasRef: le <canvas> (balise HTML)
 * @param app: référence vers l'application (App)
 */
function Canvas(divRef, canvasRef, backgroundCanvasRef, app) {
	this.app = app;
	this.divRef = divRef;
	this.cvsRef = canvasRef;
	this.backgroundCanvasRef = backgroundCanvasRef;
	this.ctx = canvasRef.getContext("2d");
}

Canvas.prototype.refreshBackgroundCanvas = function(){
	var ctx = this.backgroundCanvasRef.getContext("2d"),
		canvasWidth = this.cvsRef.clientWidth,
		canvasHeight = this.cvsRef.clientHeight,
		maxX = canvasWidth*this.app.settings.get('maxZoomLevel'),
		maxY = canvasHeight*this.app.settings.get('maxZoomLevel');
	ctx.clearRect(0, 0, maxX, maxY);
	if(this.app.settings.get('isGridShown'))
		this.drawGrid();
};

/**
 * Dessine le canvas
 */
Canvas.prototype.refresh = function(mouseCoordinates, options) {
	var state = this.app.state;

	/**
	 * Pendant une animation, ne pas mettre le canvas à jour quand on bouge la
	 * souris, car il est déjà mis à jour avec l'animationFrame.
	 */
	if(state=="reverse_shape" && state.isReversing && options.event_type == 'mousemove')
		return;

	if(this.previousMouseCoordinates!==undefined && mouseCoordinates==undefined)
		mouseCoordinates = this.previousMouseCoordinates;

	//met à jour le niveau de zoom si nécessaire
	if(mouseCoordinates!==undefined) {
		this.previousMouseCoordinates = mouseCoordinates;

		if(state.name=="global_zoom" && state.isZooming) {
			state.updateZoomLevel(this, mouseCoordinates);
		}
	}

	var ctx = this.ctx,
		canvasWidth = this.cvsRef.clientWidth,
		canvasHeight = this.cvsRef.clientHeight,
		maxX = canvasWidth*this.app.settings.get('maxZoomLevel'),
		maxY = canvasHeight*this.app.settings.get('maxZoomLevel');
	ctx.clearRect(0, 0, maxX, maxY);

	//dessine les formes
	var shapes = this.app.workspace.shapesList;
	for (var i = 0; i < shapes.length; i++) {
		var shape = shapes[i];
		if(state.name=="move_shape" && state.isMoving && state.shapesList.indexOf(shape)!=-1)
			continue;
		if(state.name=="rotate_shape" && state.isRotating && state.shapesList.indexOf(shape)!=-1)
			continue;
		if(state.name=="reverse_shape" && state.isReversing && state.shapesList.indexOf(shape)!=-1)
			continue;

		this.drawShape(shape);


		if(state.name=="link_shapes" || state.name=="unlink_shapes") {
			state.draw(this, mouseCoordinates, shape);
		}
	}

	if(mouseCoordinates==undefined)
		return;

	//Appelle la fonction de dessin de l'état actuel
	if(		(state.name=="move_shape" && state.isMoving)
		 || (state.name=="duplicate_shape" && state.isDuplicating)
		 || (state.name=="create_shape")
		 || (state.name=="rotate_shape" && state.isRotating)
		 || (state.name=="reverse_shape")
	 ) {
		state.draw(this, mouseCoordinates);
	}
};

/**
 * Dessiner la grille de points
 */
Canvas.prototype.drawGrid = function() {
	//Dessiner les points entre (0, 0) et (canvasWidth*this.app.maxZoomLevel, canvasHeight*this.app.maxZoomLevel)
	//TODO: utiliser le niveau de zoom actuel pour ne pas dessiner des points qui ne seront pas affichés ?
	//TODO: dessiner ça sur un autre canvas, et ne pas redessiner à chaque refresh!

	var ctx = this.backgroundCanvasRef.getContext("2d");

	var canvasWidth = this.cvsRef.clientWidth;
	var canvasHeight = this.cvsRef.clientHeight;
	var gridType = this.app.settings.get('gridType');
	var gridSize = this.app.settings.get('gridSize');
	var max = {'x': canvasWidth*this.app.settings.get('maxZoomLevel'), 'y': canvasHeight*this.app.settings.get('maxZoomLevel')};
	if(gridType=="square") {
		for(var x = 10; x<= max.x; x += 50*gridSize) {
			for(var y = 10; y<= max.y; y += 50*gridSize) {
				this.drawPoint({"x": x, "y": y}, "#F00", ctx);
			}
		}
	} else if(gridType=="triangle") {
		for(var x = 10; x<= max.x; x += 50*gridSize) {
			for(var y = 10; y<= max.y; y += 85*gridSize) {
				this.drawPoint({"x": x, "y": y}, "#F00", ctx);
			}
		}
		for(var x = 10 + 50*gridSize/2; x<= max.x; x += 50*gridSize) {
			for(var y =10 +  42.5*gridSize; y<= max.y; y += 85*gridSize) {
				this.drawPoint({"x": x, "y": y}, "#F00", ctx);
			}
		}
	} else {
		console.log("Canvas.drawGrid: unknown type: "+gridType);
	}
};

/**
 * Dessine une forme sur le canvas
 * @param shape: la forme à dessiner (Shape)
 */
Canvas.prototype.drawShape = function(shape) {
	var ctx = this.ctx;

	//Choix de la couleur
	if(shape.isReversed && shape.isSided) {
		ctx.fillStyle = this.app.getComplementaryColor(shape.color);
	} else {
		ctx.fillStyle = shape.color;
	}

	ctx.strokeStyle = shape.borderColor;
	ctx.lineWidth = (new Number( 2 / this.app.workspace.zoomLevel )).toString();

	//Choix de l'opacité
	if(shape.opacity>0.05)
		ctx.globalAlpha = shape.opacity;
	else {
		ctx.globalAlpha = 1;
		ctx.fillStyle = 'rgba(0,0,0,0)';
	}

	ctx.translate(shape.x, shape.y);

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

			var a = this.app.getAngleBetweenPoints({'x': 0, 'y': 0}, start_pos);
			var b = this.app.getAngleBetweenPoints({'x': 0, 'y': 0}, s);
			//var start_angle = -a+b;

			var start_angle = Math.atan2(start_pos.y, start_pos.x);
			//var start_angle = -this.app.getAngleBetweenPoints(s, start_pos);
			var end_angle = start_angle+s.angle*Math.PI/180;
			if(s.direction) {
				end_angle = start_angle-s.angle*Math.PI/180;
			}

			ctx.arc(s.x, s.y, rayon, start_angle, end_angle, s.direction);
		} else {
			//Pour les formes contenant des courbes de bézier
			console.log("Canvas.drawShape: missed one step:");
			console.log(shape.buildSteps[i]);
		}
	}

	ctx.lineTo(firstPoint.x, firstPoint.y);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	if(shape.isPointed) {
		//dessine les points (noirs) des sommets de la forme
		for(var i=0;i<shape.points.length;i++) {
			this.drawPoint(shape.points[i].getRelativeCoordinates(), "#000");
		}
	}

	for(var i=0;i<shape.segmentPoints.length;i++) {
		this.drawPoint(shape.segmentPoints[i].getRelativeCoordinates(), "#000");
	}
	for(var i=0;i<shape.otherPoints.length;i++) {
		this.drawPoint(shape.otherPoints[i].getRelativeCoordinates(), "#000");
	}

	//afficher le centre
	if((this.app.state.name == "rotate_shape" && this.app.state.selectedShape==shape)) {
		this.drawPoint({"x": 0, "y": 0}, "#000");
	}

	ctx.globalAlpha = 1;

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
		var transformation = this.app.state.computePointPosition(shape.buildSteps[i].x, shape.buildSteps[i].y, angle);
		tmpBuildSteps.push([ shape.buildSteps[i].x, shape.buildSteps[i].y ]);
		shape.buildSteps[i].setCoordinates(transformation.x, transformation.y);
	}
	shape.recomputePoints();
	var tmpSegmentPoints = [], tmpOtherPoints = [];
	for(var i=0;i<shape.segmentPoints.length;i++) {
		var pos = shape.segmentPoints[i].getRelativeCoordinates();
		var transformation = this.app.state.computePointPosition(pos.x, pos.y, angle);
		tmpSegmentPoints.push([ pos.x, pos.y ]);
		shape.segmentPoints[i].setCoordinates(transformation.x, transformation.y);
	}
	for(var i=0;i<shape.otherPoints.length;i++) {
		var pos = shape.otherPoints[i].getRelativeCoordinates();
		var transformation = this.app.state.computePointPosition(pos.x, pos.y, angle);
		tmpOtherPoints.push([ pos.x, pos.y ]);
		shape.otherPoints[i].setCoordinates(transformation.x, transformation.y);
	}

	this.drawMovingShape(shape, point);

	for(var i=0;i<tmpBuildSteps.length;i++) {
		shape.buildSteps[i].setCoordinates(tmpBuildSteps[i][0], tmpBuildSteps[i][1]);
	}
	for(var i=0;i<tmpSegmentPoints.length;i++) {
		shape.segmentPoints[i].setCoordinates(tmpSegmentPoints[i][0], tmpSegmentPoints[i][1]);
	}
	for(var i=0;i<tmpOtherPoints.length;i++) {
		shape.otherPoints[i].setCoordinates(tmpOtherPoints[i][0], tmpOtherPoints[i][1]);
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

	var newShapeCenter = this.app.state.computePointPosition(shape.x, shape.y, axe, progress);
	axe.center = {'x': 0, 'y': 0};
	shape.x = newShapeCenter.x;
	shape.y = newShapeCenter.y;

	var tmpBuildSteps = shape.buildSteps,
		pointsSave = shape.points;
	shape.buildSteps = [];
	for(var i=0;i<tmpBuildSteps.length;i++) {
		var b = tmpBuildSteps[i];
		if(b.type=="line") {
			var transformation = this.app.state.computePointPosition(b.x, b.y, axe, progress);
			var copy = b.getCopy();
			copy.setCoordinates(transformation.x, transformation.y);
			shape.buildSteps.push(copy);
		} else if(b.type=="arc") {
			var p1 = tmpBuildSteps[i-1],
				center = b,
				angle = b.angle,
				direction = b.direction;
			var points = this.app.getApproximatedArc(center, p1, angle, direction, 10);
			for(var j=0;j<points.length;j++) {
				var transformation = this.app.state.computePointPosition(points[j].x, points[j].y, axe, progress);
				shape.buildSteps.push(ShapeStep.getLine(transformation.x, transformation.y));
			}
		} else {
			console.log("drawReversingShape: curve! ");
			console.log(b);
		}
	}
	shape.__computePoints();

	var tmpSegmentPoints = [], tmpOtherPoints = [];
	for(var i=0;i<shape.segmentPoints.length;i++) {
		var pos = shape.segmentPoints[i].getRelativeCoordinates();
		var transformation = this.app.state.computePointPosition(pos.x, pos.y, axe, progress);
		tmpSegmentPoints.push([ pos.x, pos.y ]);
		shape.segmentPoints[i].setCoordinates(transformation.x, transformation.y);
	}
	for(var i=0;i<shape.otherPoints.length;i++) {
		var pos = shape.otherPoints[i].getRelativeCoordinates();
		var transformation = this.app.state.computePointPosition(pos.x, pos.y, axe, progress);
		tmpOtherPoints.push([ pos.x, pos.y ]);
		shape.otherPoints[i].setCoordinates(transformation.x, transformation.y);
	}

	if(progress>=0.5)
		shape.isReversed = !shape.isReversed;

	this.drawShape(shape);

	if(progress>=0.5)
		shape.isReversed = !shape.isReversed;

	axe.center = saveAxeCenter;
	shape.x = saveShapeCenter.x;
	shape.y = saveShapeCenter.y;

	shape.buildSteps = tmpBuildSteps;
	shape.points = pointsSave;

	for(var i=0;i<tmpSegmentPoints.length;i++) {
		shape.segmentPoints[i].setCoordinates(tmpSegmentPoints[i][0], tmpSegmentPoints[i][1]);
	}
	for(var i=0;i<tmpOtherPoints.length;i++) {
		shape.otherPoints[i].setCoordinates(tmpOtherPoints[i][0], tmpOtherPoints[i][1]);
	}
};

/**
 * Modifie l'échelle du canvas de manière relative.
 * @param newScale: nouvelle échelle relative (float)
 */
Canvas.prototype.updateRelativeScaleLevel = function(newScale) {
	var ctx = this.ctx;
	ctx.scale(newScale, newScale);

	ctx = this.backgroundCanvasRef.getContext('2d');
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
Canvas.prototype.drawPoint = function(point, color, ctx) {
	ctx = ctx ? ctx : this.ctx;

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
