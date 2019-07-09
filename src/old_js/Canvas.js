/**
 * Représente le <canvas>, contient les méthodes de dessin
 */
import { ShapeStep } from './ShapeStep'
import { Point } from './Point'
import { settings } from './Settings';
import { distanceBetweenTwoPoints } from './Geometry';

export class Canvas {
	/**
	 * Constructeur
	 * @param divRef: le <div> contenant le <canvas> (balise HTML)
	 * @param canvasRef: le <canvas> (balise HTML)
	 * @param app: référence vers l'application (App)
	 */
	constructor(divRef, canvasRef, backgroundCanvasRef, app) {
		this.app = app;
		this.divRef = divRef;
		this.cvsRef = canvasRef;
		this.backgroundCanvasRef = backgroundCanvasRef; //Un second <canvas> sur lequel la grille se dessine.
		this.ctx = canvasRef.getContext("2d");
		this.scale = 1
	}

	refreshBackgroundCanvas() {
		var ctx = this.backgroundCanvasRef.getContext("2d"),
			canvasWidth = this.cvsRef.clientWidth,
			canvasHeight = this.cvsRef.clientHeight,
			maxX = canvasWidth * settings.get('maxZoomLevel'),
			maxY = canvasHeight * settings.get('maxZoomLevel');
		ctx.clearRect(0, 0, maxX, maxY);
		if (settings.get('isGridShown'))
			this.drawGrid();
	};

	/**
	 * Dessine le canvas
	 */
	refresh(mouseCoordinates, options) {
		var state = this.app.state;
		/**
		 * Pendant une animation, ne pas mettre le canvas à jour quand on bouge la
		 * souris, car il est déjà mis à jour avec l'animationFrame.
		 * -> TODO: faire la même chose si on est en train d'annuler (history) une action de type reverse
		 */
		if (state == "reverse_shape" && state.isReversing && options.event_type == 'mousemove')
			return;
		//if(this.app.workspace.history.isRunning && this.app.workspace.history.runningState == "reverse_shape"  && options.event_type == 'mousemove')
		//	return;  //TODO: options n'est pas défini dans ce cas-ci. le définir là où refresh est appelé ?

		if (this.previousMouseCoordinates !== undefined && mouseCoordinates == undefined)
			mouseCoordinates = this.previousMouseCoordinates;

		//met à jour le niveau de zoom et l'offset du canvas si nécessaire
		if (mouseCoordinates !== undefined) {
			this.previousMouseCoordinates = mouseCoordinates;

			if (state.name == "global_zoom" && state.isZooming) {
				state.updateZoomLevel(mouseCoordinates);
			}

			if (state.name == "moveplane_state" && state.isMoving) {
				state.updateOffset(this, mouseCoordinates);
				this.refreshBackgroundCanvas()
			}
		}

		var ctx = this.ctx,
			canvasWidth = this.cvsRef.clientWidth,
			canvasHeight = this.cvsRef.clientHeight,
			maxX = canvasWidth * settings.get('maxZoomLevel'),
			maxY = canvasHeight * settings.get('maxZoomLevel');
		ctx.clearRect(0, 0, maxX, maxY);

		// Calcul des éléments à mettre en évidence.
		// Optimisation possible: déplacer ce travail dans un "thread" secondaire.
		var shapesToHighlight = [],
			segmentsToHighlight = [],
			pointsToHighlight = [];
		if (mouseCoordinates !== undefined) {
			var shapes = this.app.workspace.shapesOnPoint(new Point(mouseCoordinates.x, mouseCoordinates.y));
			if (shapes.length > 0) {
				/*
				//Pour une version PC. getElementsToHighlight n'est pas utilisé sur tablette.
				var data = this.app.state.getElementsToHighlight(shapes[shapes.length-1], mouseCoordinates);

				shapesToHighlight = data.shapes;
				segmentsToHighlight = data.segments; // [{shape: Shape, segment: BuildStep}]
				pointsToHighlight = data.points; //[{shape: Shape, point: Point}]
				*/
			}
		}
		if (state.name == "cut_shape" && state.shape) {
			shapesToHighlight.push(state.shape);
			if (state.firstPoint)
				pointsToHighlight.push({ 'shape': state.shape, 'point': state.firstPoint });
			if (state.centerPoint)
				pointsToHighlight.push({ 'shape': state.shape, 'point': state.centerPoint });
		}
		if (state.name == "divide_segment" && state.selectedShape) {
			shapesToHighlight.push(state.selectedShape);
		}
		if (state.name == "merge_shapes" && state.firstShape) {
			shapesToHighlight.push(state.firstShape);
		}

		//dessine les formes
		var shapes = this.app.workspace.shapesList;
		for (var i = 0; i < shapes.length; i++) {
			var shape = shapes[i];
			if (state.name == "move_shape" && state.isMoving && state.shapesList.indexOf(shape) != -1)
				continue;
			if (state.name == "rotate_shape" && state.isRotating && state.shapesList.indexOf(shape) != -1)
				continue;
			if (state.name == "reverse_shape" && state.isReversing && state.shapesList.indexOf(shape) != -1)
				continue;
			if (this.app.workspace.history.isRunning && this.app.workspace.history.runningState == "reverse_shape") {
				if (this.app.workspace.history.stepData.shapesList.indexOf(shape.id) !== -1) {
					continue;
				}
			}

			var highlightInfo = {
				'shape': false,
				'segments': [],
				'points': []
			};

			if (shapesToHighlight.indexOf(shape) !== -1)
				highlightInfo.shape = true;
			highlightInfo.segments = segmentsToHighlight.filter(function (val, i) { return val.shape == shape }).map(function (val) { return val.segment; });
			highlightInfo.points = pointsToHighlight.filter(function (val, i) { return val.shape == shape }).map(function (val) { return val.point; });

			this.drawShape(shape, highlightInfo);


			if (state.name == "group_shapes" || state.name == "ungroup_shapes") {
				state.draw(this, mouseCoordinates, shape);
			}
			if (state.name == "reverse_shape" && !state.isReversing && state.selectedShape) {
				state.drawSymAxis(this);
			}
		}

		if (mouseCoordinates != undefined) {
			//Appelle la fonction de dessin de l'état actuel
			if ((state.name == "move_shape" && state.isMoving)
				|| (state.name == "duplicate_shape" && state.isDuplicating)
				|| (state.name == "create_shape")
				|| (state.name == "rotate_shape" && state.isRotating)
				|| (state.name == "reverse_shape")
			) {
				state.draw(this, mouseCoordinates);
			}
			//Si on est en train d'annuler un retournement de forme
			if (this.app.workspace.history.isRunning && this.app.workspace.history.runningState == "reverse_shape") {
				this.app.states["reverse_shape"].draw(this, mouseCoordinates);
			}
		}

		if (this.app.virtualMouse.isShown)
			this.drawVirtualMouse(mouseCoordinates);
	};

	/**
	 * Dessiner la grille de points
	 */
	drawGrid() {
		//Dessiner les points entre (0, 0) et (canvasWidth*this.app.maxZoomLevel, canvasHeight*this.app.maxZoomLevel)
		//TODO: utiliser le niveau de zoom actuel pour ne pas dessiner des points qui ne seront pas affichés !
		//TODO: lorsque le zoom sera centré, adapter cette méthode pour dessiner la bonne partie.

		var ctx = this.backgroundCanvasRef.getContext("2d");

		var canvasWidth = this.cvsRef.clientWidth,
			canvasHeight = this.cvsRef.clientHeight,
			gridType = settings.get('gridType'),
			gridSize = settings.get('gridSize'),
			offsetX = this.app.workspace.translateOffset.x,
			offsetY = this.app.workspace.translateOffset.y,
			actualZoomLvl = this.app.workspace.zoomLevel,
			min = { 'x': -offsetX, 'y': -offsetY },
			max = { 'x': canvasWidth * (1 / actualZoomLvl) * 1.1 - offsetX, 'y': canvasHeight * (1 / actualZoomLvl) * 1.1 - offsetY };
		if (gridType == "square") {
			var startX = 10 + Math.ceil((min.x - 10) / (50 * gridSize)) * 50 * gridSize,
				startY = 10 + Math.ceil((min.y - 10) / (50 * gridSize)) * 50 * gridSize;
			for (var x = startX; x <= max.x; x += 50 * gridSize) {
				for (var y = startY; y <= max.y; y += 50 * gridSize) {
					this.drawPoint({ "x": x, "y": y }, "#F00", ctx);
				}
			}
		} else if (gridType == "triangle") {
			var startX = 10 + Math.ceil((min.x - 10) / (50 * gridSize)) * 50 * gridSize,
				startY = 10 + Math.ceil((min.y - 10) / (43.3012701892 * 2 * gridSize)) * 43.3012701892 * 2 * gridSize;
			for (var x = startX; x <= max.x; x += 50 * gridSize) {
				for (var y = startY; y <= max.y; y += 43.3012701892 * 2 * gridSize) {
					this.drawPoint({ "x": x, "y": y }, "#F00", ctx);
				}
			}

			startX = 10 + 50 * gridSize / 2 + Math.ceil((min.x - 10 - 50 * gridSize / 2) / (50 * gridSize)) * 50 * gridSize;
			startY = 10 + 43.3012701892 * gridSize + Math.ceil((min.y - 10 - 43.3012701892 * gridSize) / (43.3012701892 * 2 * gridSize)) * 43.3012701892 * 2 * gridSize;
			for (var x = startX; x <= max.x; x += 50 * gridSize) {
				for (var y = startY; y <= max.y; y += 43.3012701892 * 2 * gridSize) {
					this.drawPoint({ "x": x, "y": y }, "#F00", ctx);
				}
			}
		} else {
			console.log("Canvas.drawGrid: unknown type: " + gridType);
		}
	};

	/**
	 * Modifie l'échelle du canvas de manière relative.
	 * @param newScale: nouvelle échelle relative (float)
	 */
	updateRelativeScaleLevel(newScale) {
		var ctx = this.ctx;
		ctx.scale(newScale, newScale);
		//TODO: ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y); ?
		//TODO: translater du centre ?
		ctx = this.backgroundCanvasRef.getContext('2d');
		ctx.scale(newScale, newScale);
		this.scale = newScale
	};

	/**
	 * Dessine un cercle
	 * @param point: la position ({'x': int, 'y': int})
	 * @param color: la couleur du texte
	 * @param radius: le rayon du cercle (float)
	 */
	drawCircle(point, color, radius) {
		var ctx = this.ctx;

		ctx.globalAlpha = 1;
		ctx.fillStyle = color;
		ctx.translate(this.app.workspace.translateOffset.x, this.app.workspace.translateOffset.y);
		ctx.beginPath();
		ctx.arc(point.x, point.y, radius / this.app.workspace.zoomLevel, 0, 2 * Math.PI, 0);
		ctx.closePath();
		ctx.stroke();
		ctx.translate(-this.app.workspace.translateOffset.x, -this.app.workspace.translateOffset.y);
	};


	resetZoom() {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0)
	}
}
