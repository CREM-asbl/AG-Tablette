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

		//this.scale = 1; //TODO
	}

    askRefresh(canvas = "main") {
        if(canvas=="main")
            this.refreshMain();
        else if(canvas=="upper")
            this.refreshUpper();
        //TODO: limite de refresh par seconde? windowAnimationFrame?
    }

    refreshBackground() {
        console.log("refresh background !");
    }

    refreshMain() {
        //Reset
        let canvasWidth = this.canvas.main.clientWidth,
			canvasHeight = this.canvas.main.clientHeight,
			maxX = canvasWidth * app.settings.get('maxZoomLevel'),
			maxY = canvasHeight * app.settings.get('maxZoomLevel');
		this.mainCtx.clearRect(0, 0, maxX, maxY);

        //Afficher les formes
        let shapesToSkip = app.state ? app.state.getEditingShapes() : [];
        app.workspace.shapes.filter(shape => {
            return !shapesToSkip.includes(shape);
        }).forEach(shape => {
            this.drawShape(this.mainCtx, shape);
            if(app.state)
                app.state.shapeDrawn(this.mainCtx, shape);
        });

    }

    refreshUpper() {
        //Reset
        let canvasWidth = this.canvas.upper.clientWidth, //TODO factoriser ça ailleurs
			canvasHeight = this.canvas.upper.clientHeight,
			maxX = canvasWidth * app.settings.get('maxZoomLevel'),
			maxY = canvasHeight * app.settings.get('maxZoomLevel');
		this.upperCtx.clearRect(0, 0, maxX, maxY);

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
