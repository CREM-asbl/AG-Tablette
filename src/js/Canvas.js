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
	this.backgroundCanvasRef = backgroundCanvasRef; //Un second <canvas> sur lequel la grille se dessine.
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
	 * -> TODO: faire la même chose si on est en train d'annuler (history) une action de type reverse
	 */
	if(state=="reverse_shape" && state.isReversing && options.event_type == 'mousemove')
		return;

	if(this.previousMouseCoordinates!==undefined && mouseCoordinates==undefined)
		mouseCoordinates = this.previousMouseCoordinates;

	//met à jour le niveau de zoom et l'offset du canvas si nécessaire
	if(mouseCoordinates!==undefined) {
		this.previousMouseCoordinates = mouseCoordinates;

		if(state.name=="global_zoom" && state.isZooming) {
			state.updateZoomLevel(this, mouseCoordinates);
		}

		if(state.name=="moveplane_state" && state.isMoving) {
			state.updateOffset(this, mouseCoordinates);
		}
	}

	var ctx = this.ctx,
		canvasWidth = this.cvsRef.clientWidth,
		canvasHeight = this.cvsRef.clientHeight,
		maxX = canvasWidth*this.app.settings.get('maxZoomLevel'),
		maxY = canvasHeight*this.app.settings.get('maxZoomLevel');
	ctx.clearRect(0, 0, maxX, maxY);

	// Calcul des éléments à mettre en évidence.
	// Optimisation possible: déplacer ce travail dans un "thread" secondaire.
	var shapesToHighlight = [],
		segmentsToHighlight = [],
		pointsToHighlight = [];
	if(mouseCoordinates!==undefined) {
		var shapes = this.app.workspace.shapesOnPoint(new Point(mouseCoordinates.x, mouseCoordinates.y));
		if(shapes.length>0) {
			/*
			//Pour une version PC:
			var data = this.app.state.getElementsToHighlight(shapes[shapes.length-1], mouseCoordinates);

			shapesToHighlight = data.shapes;
			segmentsToHighlight = data.segments; // [{shape: Shape, segment: BuildStep}]
			pointsToHighlight = data.points; //[{shape: Shape, point: Point}]
			*/
		}
	}

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

		var highlightInfo = {
			'shape': false,
			'segments': [],
			'points': []
		};
		if(shapesToHighlight.indexOf(shape)!==-1)
			highlightInfo.shape = true;
		highlightInfo.segments = segmentsToHighlight.filter(function(val, i){ return val.shape == shape }).map(function(val){ return val.segment; });
		highlightInfo.points = pointsToHighlight.filter(function(val, i){ return val.shape == shape }).map(function(val){ return val.point; });

		this.drawShape(shape, highlightInfo);


		if(state.name=="link_shapes" || state.name=="unlink_shapes") {
			state.draw(this, mouseCoordinates, shape);
		}
		if(state.name=="reverse_shape" && !state.isReversing && state.selectedShape) {
			state.drawSymAxis(this);
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
	//Si on est en train d'annuler un retournement de forme
	if(this.app.workspace.history.isRunning && this.app.workspace.history.runningState=="reverse_shape") {
		this.app.states["reverse_shape"].draw(this, mouseCoordinates);
	}
};

/**
 * Dessiner la grille de points
 */
Canvas.prototype.drawGrid = function() {
	//Dessiner les points entre (0, 0) et (canvasWidth*this.app.maxZoomLevel, canvasHeight*this.app.maxZoomLevel)
	//TODO: utiliser le niveau de zoom actuel pour ne pas dessiner des points qui ne seront pas affichés !
	//TODO: lorsque le zoom sera centré, adapter cette méthode pour dessiner la bonne partie.

	var ctx = this.backgroundCanvasRef.getContext("2d");

	var canvasWidth = this.cvsRef.clientWidth,
		canvasHeight = this.cvsRef.clientHeight,
		gridType = this.app.settings.get('gridType'),
		gridSize = this.app.settings.get('gridSize'),
		offsetX = this.app.workspace.translateOffset.x,
		offsetY = this.app.workspace.translateOffset.y,
		actualZoomLvl = this.app.workspace.zoomLevel,
		min = {'x': -offsetX,'y': -offsetY},
		max = {'x': canvasWidth*(1/actualZoomLvl)*1.1-offsetX, 'y': canvasHeight*(1/actualZoomLvl)*1.1-offsetY};

	if(gridType=="square") {
		var startX = 10 + Math.ceil((min.x-10)/(50*gridSize)) * 50 * gridSize,
			startY = 10 + Math.ceil((min.y-10)/(50*gridSize)) * 50 * gridSize;
		for(var x = startX; x<= max.x; x += 50*gridSize) {
			for(var y = startY; y<= max.y; y += 50*gridSize) {
				this.drawPoint({"x": x, "y": y}, "#F00", ctx);
			}
		}
	} else if(gridType=="triangle") {
		var startX = 10 + Math.ceil((min.x-10)/(50*gridSize)) * 50 * gridSize,
			startY = 10 + Math.ceil((min.y-10)/(43.3012701892*2*gridSize)) * 43.3012701892*2 * gridSize;
		for(var x = startX; x<= max.x; x += 50*gridSize) {
			for(var y = startY; y<= max.y; y += 43.3012701892*2*gridSize) {
				this.drawPoint({"x": x, "y": y}, "#F00", ctx);
			}
		}

		startX = 10 + 50*gridSize/2 + Math.ceil((min.x-10-50*gridSize/2)/(50*gridSize)) * 50 * gridSize;
		startY = 10 + 43.3012701892*gridSize + Math.ceil((min.y-10-43.3012701892*gridSize)/(43.3012701892*2*gridSize)) * 43.3012701892*2 * gridSize;
		for(var x = startX; x<= max.x; x += 50*gridSize) {
			for(var y = startY; y<= max.y; y += 43.3012701892*2*gridSize) {
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
Canvas.prototype.drawShape = function(shape, highlightInfo) {
	if(highlightInfo===undefined)
		highlightInfo = {'shape': false, 'segments': [], 'points': []};
	var ctx = this.ctx;

	//Choix de la couleur
	if(shape.isReversed && shape.isSided) {
		ctx.fillStyle = this.app.getComplementaryColor(shape.color);
	} else {
		ctx.fillStyle = shape.color;
	}

	ctx.strokeStyle = shape.borderColor;
	ctx.lineWidth = (new Number( 2 / this.app.workspace.zoomLevel )).toString();

	if(highlightInfo.shape===true) { //il faut mettre la forme en évidence
		ctx.lineWidth = ((new Number(ctx.lineWidth)) * 1.7).toString();
		ctx.strokeStyle = '#E90CC8';
	}

	//Choix de l'opacité
	if(shape.opacity>0.05)
		ctx.globalAlpha = shape.opacity;
	else {
		ctx.globalAlpha = 1;
		ctx.fillStyle = 'rgba(0,0,0,0)';
	}

	ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
	ctx.translate(shape.x, shape.y);

	//dessine le chemin principal
	ctx.beginPath();
	var firstPoint = shape.buildSteps[0];

	ctx.moveTo(firstPoint.x, firstPoint.y);
	var prevFinalPoint = null;
	for (var i = 1; i < shape.buildSteps.length; i++) {
		var s = shape.buildSteps[i],
			prevFinalPoint = shape.buildSteps[i-1].getFinalPoint(prevFinalPoint);

		if(s.getType()=="line") {
			ctx.lineTo(s.x, s.y);
		} else if(s.getType()=="arc") {
			var rayon = Math.sqrt(Math.pow(s.x - prevFinalPoint.x, 2) + Math.pow(s.y - prevFinalPoint.y, 2)),
				start_angle = window.app.positiveAtan2(prevFinalPoint.y-s.y, prevFinalPoint.x-s.x),
				end_angle;
			if(!s.direction) { //sens horloger
    			end_angle = start_angle + s.angle;
    		} else {
    			end_angle = start_angle - s.angle;
    		}

			ctx.arc(s.x, s.y, rayon, start_angle, end_angle, s.direction);
		} else {
			console.error("unknown type");
			return;
		}
	}

	ctx.lineTo(firstPoint.x, firstPoint.y);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);

	//Dessiner le polygone approximatif de la forme (pour le debugging des arcs de cercle)
	if(false) {
		ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
		var tmp_stroke = ctx.strokeStyle;
		ctx.strokeStyle = '#00F';
		var tmp_pts = shape.getApproximatedPointsList();
		ctx.beginPath();
		ctx.moveTo(tmp_pts[0].x, tmp_pts[0].y);
		for(var i=1;i<tmp_pts.length;i++) {
			ctx.lineTo(tmp_pts[i].x, tmp_pts[i].y);
		}
		ctx.lineTo(tmp_pts[0].x, tmp_pts[0].y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);

		for(var i=0;i<tmp_pts.length;i++) {
			this.drawPoint(tmp_pts[i].getRelativeCoordinates(), "#00"+(30+i)+"00");
		}

		ctx.strokeStyle = tmp_stroke;
	}


	if(highlightInfo.shape===true) { //il faut mettre la forme en évidence
		ctx.lineWidth = ((new Number(ctx.lineWidth)) * (1/1.7)).toString();
	}

	//Highlight segment(s):
	var strokeSave = ctx.strokeStyle;
	ctx.strokeStyle = '#E90CC8';
	ctx.lineWidth = ((new Number(ctx.lineWidth)) * (1.7)).toString();
	ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
	for(var i=0;i<highlightInfo.segments.length;i++) {
		var bsIndex = shape.buildSteps.slice(1).findIndex(function(val){
			return val == highlightInfo.segments[i];
		});
		var sourcept = shape.buildSteps[bsIndex].__finalPoint; //bsIndex: index de la buildStep précédente.
		var bs = highlightInfo.segments[i];

		ctx.beginPath();
		if(bs.getType()=="line") {
			ctx.moveTo(sourcept.x, sourcept.y);
			ctx.lineTo(bs.x, bs.y);
		} else if(bs.getType()=="arc") {
			ctx.moveTo(sourcept.x, sourcept.y);
			var rayon = Math.sqrt(Math.pow(bs.x - sourcept.x, 2) + Math.pow(bs.y - sourcept.y, 2)),
				start_angle = window.app.positiveAtan2(sourcept.y-bs.y, sourcept.x-bs.x),
				end_angle;
			if(!bs.direction) { //sens horloger
    			end_angle = start_angle + bs.angle;
    		} else {
    			end_angle = start_angle - bs.angle;
    		}

			ctx.arc(bs.x, bs.y, rayon, start_angle, end_angle, bs.direction);
			ctx.arc(bs.x, bs.y, rayon, end_angle, start_angle, !bs.direction);
		}

		ctx.fill();
		ctx.stroke();
	}
	ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);
	ctx.lineWidth = ((new Number(ctx.lineWidth)) * (1/1.7)).toString();
	ctx.strokeStyle = strokeSave;


	if(shape.isPointed) {
		//dessine les points (noirs) des sommets de la forme
		for(var i=0;i<shape.points.length;i++) {
			if(shape.points[i].hidden)
				continue;
			if(highlightInfo.points.some(function(val){ return val==shape.points[i]; })) {
				//Il faut mettre ce point en évidence
				this.drawPoint(shape.points[i].getRelativeCoordinates(), "#E90CC8");
			} else {
				this.drawPoint(shape.points[i].getRelativeCoordinates(), "#000");
			}
		}
	}

	for(var i=0;i<shape.points.length;i++) {
		if(highlightInfo.points.some(function(val){ return val==shape.points[i]; })) { //Il faut mettre ce point en évidence
			console.log("highlight");
			this.drawPoint(shape.points[i].getRelativeCoordinates(), "#E90CC8");
		}
	}
	for(var i=0;i<shape.segmentPoints.length;i++) {
		if(highlightInfo.points.some(function(val){ return val==shape.segmentPoints[i]; })) { //Il faut mettre ce point en évidence
			this.drawPoint(shape.segmentPoints[i].getRelativeCoordinates(), "#E90CC8");
			console.log("highlight");
		} else {
			this.drawPoint(shape.segmentPoints[i].getRelativeCoordinates(), "#000");
		}
	}
	for(var i=0;i<shape.otherPoints.length;i++) {
		if(highlightInfo.points.some(function(val){ return val==shape.otherPoints[i]; })) { //Il faut mettre ce point en évidence
			this.drawPoint(shape.otherPoints[i].getRelativeCoordinates(), "#E90CC8");
		} else {
			this.drawPoint(shape.otherPoints[i].getRelativeCoordinates(), "#000");
		}
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

	var newShapeCenter = this.app.states.reverse_shape.computePointPosition(shape.x, shape.y, axe, progress);
	axe.center = {'x': 0, 'y': 0};
	shape.x = newShapeCenter.x;
	shape.y = newShapeCenter.y;

	var tmpBuildSteps = shape.buildSteps,
		pointsSave = shape.points;
	shape.buildSteps = [];
	for(var i=0;i<tmpBuildSteps.length;i++) {
		var b = tmpBuildSteps[i];
		if(b.type=="line") {
			var transformation = this.app.states.reverse_shape.computePointPosition(b.x, b.y, axe, progress);
			var copy = b.getCopy();
			copy.setCoordinates(transformation.x, transformation.y);
			shape.buildSteps.push(copy);
		} else if(b.type=="arc") {
			var p1 = tmpBuildSteps[i-1],
				center = b,
				angle = b.angle,
				direction = b.direction;
			var points = this.app.getApproximatedArc(center, p1, angle, direction, 0.05*Math.PI);
			for(var j=0;j<points.length;j++) {
				var transformation = this.app.states.reverse_shape.computePointPosition(points[j].x, points[j].y, axe, progress);
				var tmp_shapestep = ShapeStep.getLine(transformation.x, transformation.y);
				tmp_shapestep.isArtificial = true;
				shape.buildSteps.push(tmp_shapestep);
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
		var transformation = this.app.states.reverse_shape.computePointPosition(pos.x, pos.y, axe, progress);
		tmpSegmentPoints.push([ pos.x, pos.y ]);
		shape.segmentPoints[i].setCoordinates(transformation.x, transformation.y);
	}
	for(var i=0;i<shape.otherPoints.length;i++) {
		var pos = shape.otherPoints[i].getRelativeCoordinates();
		var transformation = this.app.states.reverse_shape.computePointPosition(pos.x, pos.y, axe, progress);
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
	//TODO: ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y); ?
	//TODO: translater du centre ?
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
	ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
	ctx.fillText(text, point.x, point.y);
	ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);
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
	ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
	ctx.beginPath();
	ctx.moveTo(point.x, point.y);
	ctx.arc(point.x, point.y, 2 / this.app.workspace.zoomLevel, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.fill();
	ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);
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
	ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius / this.app.workspace.zoomLevel, 0, 2*Math.PI, 0);
	ctx.closePath();
	ctx.stroke();
	ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);
};

/**
 * Dessine un segment
 * @param fromPoint: le point de départ ({'x': int, 'y': int})
 * @param toPoint: le point d'arrivée ({'x': int, 'y': int})
 */
Canvas.prototype.drawLine = function(fromPoint, toPoint) {
	var ctx = this.ctx;
	ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
	ctx.beginPath();
	ctx.moveTo(fromPoint.x, fromPoint.y);
	ctx.lineTo(toPoint.x, toPoint.y);
	ctx.closePath();
	ctx.stroke();
	ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);
};
