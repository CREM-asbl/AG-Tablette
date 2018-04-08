
/**
 * draw the background of the canvas
 */
App.drawer.drawBackground = function(){
	var ctx = App.ctx;
	var canvasWidth = App.canvas.clientWidth;
	var canvasHeight = App.canvas.clientHeight;

	//white rectangle:
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	ctx.fillRect(0,0,canvasWidth,canvasHeight);
};

/**
 * draw all shapes on the canvas
 */
App.drawer.drawShapesList = function(){
	var ctx = App.ctx;

	for (var i = 0; i < App.shapes.length; i++) {
		var x = App.shapes[i].getX(), y = App.shapes[i].getY();

		//if it is a currently rotating shape, do not draw it now
		if(App.modes.isRotating && i==App.modes.rotateInfo.shapeIndex)
			continue;

		//todo: generalize the drawing of all kind of shapes
		//todo: parametrize the size of a shape
		if(App.shapes[i].type == "square") {
			ctx.fillStyle = "orange";
			ctx.strokeStyle = "red";

			ctx.translate(x+25, y+25);
			ctx.rotate(-App.shapes[i].angle);

			ctx.fillRect(-25, -25, 50, 50);
			ctx.strokeRect(-25, -25, 50, 50);
			//ctx.strokeRect(-25, -25, 50, 10);

			ctx.rotate(App.shapes[i].angle);
			ctx.translate(-x-25, -y-25);
		}
	}
};

/**
 * draw the rotating shape on the canvas
 */
App.drawer.drawRotatingShape = function(mousePos){
	var ctx = App.ctx;
	var canvasWidth = App.canvas.clientWidth;
	var canvasHeight = App.canvas.clientHeight;

	//rotate the shape with the good angle
	var angles = App.rotation.getAngles(mousePos);
	var shown_angle = angles.shown_angle;
	var angle = angles.angle;

	var shape = App.shapes[App.modes.rotateInfo.shapeIndex];
	var x = shape.getX(), y = shape.getY();

	//draw the shape
	ctx.translate(x+25, y+25);
	ctx.rotate(-angle);
	
	if(shape.type=="square") {
		ctx.fillStyle = "orange";
		ctx.strokeStyle = "red";
		ctx.fillRect(-25, -25, 50, 50);
		ctx.strokeRect(-25, -25, 50, 50);
	}
	ctx.rotate(angle);
	ctx.translate(-x-25, -y-25);

	//draw the rotate information (degrees)

	//check where to put it (top right/top left/bottom right/bottom left)
	var pos_input = [x+50+10, y-30];
	if(x+100>canvasWidth)
		pos_input[0] = x-60;
	if(y-60<0)
		pos_input[1] = y+50+10;

	ctx.fillStyle = "white";
	ctx.strokeStyle = "gray";
	ctx.fillRect(pos_input[0], pos_input[1], 50, 20);
	ctx.strokeRect(pos_input[0], pos_input[1], 50, 20);
	ctx.strokeStyle = "black";
	ctx.font = "15px Arial";
	ctx.strokeText(shown_angle+"°", pos_input[0]+4, pos_input[1]+14);
};

/**
 * draw the context menu
 */
App.drawer.drawMenu = function(){
	var ctx = App.ctx;
	
	ctx.fillStyle = "white";
	ctx.strokeStyle = "gray";
	ctx.fillRect(App.modes.menuInfo.x, App.modes.menuInfo.y, 100, 200);
	ctx.strokeRect(App.modes.menuInfo.x, App.modes.menuInfo.y, 100, 200);

	ctx.strokeStyle = "black";
	ctx.font = "15px Arial";
	ctx.strokeText("à faire:", App.modes.menuInfo.x+3, App.modes.menuInfo.y+14);
	ctx.strokeText("-supprimer", App.modes.menuInfo.x+3, App.modes.menuInfo.y+34);
	ctx.strokeText("-translater", App.modes.menuInfo.x+3, App.modes.menuInfo.y+54);
	ctx.strokeText("-tourner", App.modes.menuInfo.x+3, App.modes.menuInfo.y+74);
	ctx.strokeText("(boutons)", App.modes.menuInfo.x+3, App.modes.menuInfo.y+94);

};
