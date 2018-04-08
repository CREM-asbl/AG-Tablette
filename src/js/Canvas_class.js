/**
 * Represents the <canvas>, contains draw methods
 */

/**
 * Constructor
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
 * get the <div> containing the <canvas>
 * @return the div (HTML element)
 */
Canvas.prototype.getDiv = function(){
	return this.divRef;
};

/**
 * Re-draw everything on the canvas
 */
Canvas.prototype.refresh = function() {
	this.drawBackground();
	var shapes = this.app.workspace.shapesList;
	for (var i = 0; i < shapes.length; i++) {
		this.drawShape(shapes[i]);
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
	ctx.globalAlpha = 1;

	ctx.rotate(shape.rotateAngle);
	ctx.translate(-shape.x, -shape.y);
};
