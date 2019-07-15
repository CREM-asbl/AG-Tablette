import { app } from './App'

export class DrawAPI {

    constructor(upperCanvas, mainCanvas, backgroundCanvas) {
        this.canvas = {
            "upper": upperCanvas,
            "main": mainCanvas,
            "background": backgroundCanvas
        };
        this.upperCtx = this.canvas.upper.getContext("2d");
        this.mainCtx = this.canvas.main.getContext("2d");
        this.backgroundCtx = this.canvas.background.getContext("2d");

        this.lastKnownMouseCoordinates = null;

	}

    clearCtx(ctx) {
        let canvasWidth = this.canvas.main.clientWidth,
			canvasHeight = this.canvas.main.clientHeight,
			maxX = canvasWidth * app.settings.get('maxZoomLevel'),
			maxY = canvasHeight * app.settings.get('maxZoomLevel');

        //TODO: calculer la zone à clear, en fonction du zoom et translate!
		ctx.clearRect(-10000, -10000, 20000, 20000);
    }

    resetTransformations() {
        this.upperCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.mainCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
    }

    translateView(relativeOffset) {
        this.upperCtx.translate(relativeOffset.x, relativeOffset.y);
        this.mainCtx.translate(relativeOffset.x, relativeOffset.y);
        this.backgroundCtx.translate(relativeOffset.x, relativeOffset.y);
    }

    scaleView(relativeScale) {
        this.upperCtx.scale(relativeScale, relativeScale);
        this.mainCtx.scale(relativeScale, relativeScale);
        this.backgroundCtx.scale(relativeScale, relativeScale);
    }

    askRefresh(canvas = "main") {
        if(canvas=="main")
            this.refreshMain();
        else if(canvas=="upper")
            this.refreshUpper();
        else if(canvas=="background")
            this.refreshBackground();
        //TODO: limite de refresh par seconde? windowAnimationFrame?
        //TODO: ne pas mettre les canvas à jour qd mouseMove pendant une animFrame
    }

    refreshBackground() {
        this.clearCtx(this.backgroundCtx);

        //Grid:
        if(app.settings.get("isGridShown")) {
            let canvasWidth = this.canvas.main.clientWidth,
    			canvasHeight = this.canvas.main.clientHeight,
    			offsetX = app.workspace.translateOffset.x,
    			offsetY = app.workspace.translateOffset.y,
    			actualZoomLvl = app.workspace.zoomLevel,
                //Ne pas voir les points apparaître:
                marginToAdd = 20 * actualZoomLvl,
    			min = {
                    'x': -offsetX/actualZoomLvl - marginToAdd,
                    'y': -offsetY/actualZoomLvl - marginToAdd
                },
    			max = {
                    'x': (canvasWidth - offsetX)/ actualZoomLvl + marginToAdd,
                    'y': (canvasHeight - offsetY)/ actualZoomLvl + marginToAdd
                };

            let pts = app.workspace.grid.getVisibleGridPoints(min, max);
            pts.forEach(pt => {
                this.drawPoint(this.backgroundCtx, pt, "#F00", 1, false);
            });
        }
    }

    refreshMain() {
        this.clearCtx(this.mainCtx);

        //Afficher les formes
        let shapesToSkip = app.state ? app.state.getEditingShapes() : [];
        app.workspace.shapes.filter(shape => {
            return shapesToSkip.findIndex(s => s.id == shape.id) == -1;
        }).forEach(shape => {
            this.drawShape(this.mainCtx, shape);
            if(app.state)
                app.state.shapeDrawn(this.mainCtx, shape);
        });

    }

    refreshUpper() {
        this.clearCtx(this.upperCtx);

        if(app.state) {
            app.state.draw(this.upperCtx, this.lastKnownMouseCoordinates);
        }
    }

    /**
     * Dessiner une forme sur un canvas donné
     * @param  {Context2D} ctx   le canvas
     * @param  {Shape} shape la forme
     */
    drawShape(ctx, shape) {
        ctx.strokeStyle = shape.borderColor;
        ctx.fillStyle = shape.color;

        ctx.translate(shape.x, shape.y);

        ctx.fill(shape.getDrawPath());
		ctx.stroke(shape.getDrawPath());
        ctx.save();
        shape.buildSteps.filter(bs => bs.type=="vertex").forEach(bs => { //Sommets
            this.drawPoint(ctx, bs.coordinates, "#000", 1, false);
        });
        shape.buildSteps.filter(bs => bs.type=="segment").forEach(bs => { //Points sur les segments
            bs.points.forEach(pt => {
                this.drawPoint(ctx, pt, "#000", 1, false);
            });
        });
        if(shape.isCenterShown)
            this.drawPoint(ctx, shape.center, "#000", 1, false); //Le centre
        ctx.restore();

        ctx.translate(-shape.x, -shape.y);
    }

    /**
     * Dessiner un point
     * @param  {Context2D} ctx            le canvas
     * @param  {{x: float, y: float}} coordinates    les coordonnées du point
     * @param  {String} [color="#000"] La couleur du point
     * @param  {Number} [size=1]       Taille du point
     * @param  {Boolean} [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
     */
    drawPoint(ctx, coordinates, color = "#000", size = 1, doSave = true) {
        if(doSave) ctx.save();

        ctx.fillStyle = color;
        ctx.globalAlpha = 1;

        ctx.beginPath();
		ctx.moveTo(coordinates.x, coordinates.y);
		ctx.arc(coordinates.x, coordinates.y, size * 2, 0, 2 * Math.PI, 0);
		ctx.closePath();
        ctx.fill();

		if(doSave) ctx.restore();
    }

    /**
     * Dessine un segment
     * @param  {Point} fromPoint    origine
     * @param  {Point} toPoint      destination
     * @param  {String} [color='#000'] Couleur de la ligne
     * @param  {Boolean} [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
     */
	drawLine(ctx, fromPoint, toPoint, color = '#000', doSave = true) {
        if(doSave) ctx.save();

		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(fromPoint.x, fromPoint.y);
		ctx.lineTo(toPoint.x, toPoint.y);
		ctx.closePath();
		ctx.stroke();

        if(doSave) ctx.restore();
	}

	/**
     * Dessine un texte
     * @param  {Context2D}  ctx         Le canvas
     * @param  {String}  text           Le texte à dessiner
     * @param  {Point}  point           Les coordonnées
     * @param  {String}  [color='#000'] La couleur du texte
     * @param  {Boolean} [doSave=true]  Faut-il sauvegarder le contexte du canvas (optimisation)
     */
	drawText(ctx, text, point, color = '#000', doSave = true) {
		if(doSave) ctx.save();

		ctx.fillStyle = color;
		ctx.font = "13px Arial";
		ctx.fillText(text, point.x, point.y);

        if(doSave) ctx.restore();
	};


    /**
     * Dessine un cercle
     * @param  {Context2D} ctx         Le canvas
     * @param  {Point} point           Coordonnées du centre
     * @param  {String} [color='#000'] Couleur du bord
     * @param  {float} [radius=10]     Le rayon
     */
    drawCircle(ctx, point, color = '#000', radius = 10, doSave = true) {
        if(doSave) ctx.save();

        ctx.globalAlpha = 1;
		ctx.strokeStyle = color;

        ctx.beginPath();
		ctx.arc(point.x, point.y, radius / this.app.workspace.zoomLevel, 0, 2 * Math.PI, 0);
		ctx.closePath();
		ctx.stroke();

        if(doSave) ctx.restore();
    }


    /**
     * Vérifie si un point est à l'intérieur d'une forme ou non
     * @param  {{x: float, y: float}}  point le point
     * @param  {Shape}  shape la forme
     * @return {Boolean}       true si le point est dans la forme
     */
    isPointInShape(point, shape) {
        const ctx = this.upperCtx;
        ctx.save(); //TODO utiliser un autre canvas pour éviter de trop appeler save et restore?
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.translate(shape.x, shape.y);
        const selected = ctx.isPointInPath(shape.getDrawPath(), point.x, point.y);
        ctx.restore();
        return selected;
	}

}
