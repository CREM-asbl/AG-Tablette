
/**
 * Called each time we should update the canvas content
 *
 * todo: if we refresh the canvas when onmousemove is triggered,
 *		 use two canvas (including a transparent one), and draw the 
 *		 onmousemove-related content on a separate canvas (optimisation)
 */
App.events.canvas.refresh = function(event_ref){
	var mousePos = undefined;
	if(event_ref!==undefined) {
		mousePos = getMousePositionFromEvent(event_ref);
	} else {
		console.log("Warning: no event given to App.events.canvas.refresh()");
	}

	var ctx = App.ctx;

	//draw the background
	App.drawer.drawBackground();

	//draw each shape, eventually rotated
	App.drawer.drawShapesList();

	//draw the moving/rotating/translating shape
	if(App.modes.isMoving) {

		//todo: move a shape at the cursor position
	} else if(App.modes.isRotating) {

		App.drawer.drawRotatingShape(mousePos);
	}

	//if we are adding a shame, draw one at the cursor position (like if we were moving a shape)
	if(mousePos!==undefined && App.modes.mainMode=="addShape") {
		if(App.selectedShapeInMenu=="square") {
			ctx.fillStyle = "orange";
			ctx.strokeStyle = "red";
			ctx.fillRect(mousePos[0], mousePos[1], 50, 50);
			ctx.strokeRect(mousePos[0], mousePos[1], 50, 50);
		}
	}

	//draw a menu
	if(App.modes.isMenuOpened) {
		App.drawer.drawMenu();
	}
};

/**
 * Called when clicking on the canvas in addShape mode
 */
App.events.canvas.addShape = function(mouseX, mouseY){
	if(App.selectedShapeInMenu) {
		App.shapes.push(new Shape(App.selectedShapeInMenu, [mouseX, mouseY]));
	}
};

/**
 * Called when onclick is triggerd
 */
App.events.canvas.onclick = function(e){
	if(App.modes.mainMode!="none") { //close the menu
		App.modes.isMenuOpened = false;
	}

	var mousePos = getMousePositionFromEvent(e);
	var mouseX = mousePos[0], mouseY = mousePos[1];

	//choose what to do, depending on the main mode
	if(App.modes.mainMode=="addShape") {

		App.events.canvas.addShape(mouseX, mouseY);
	} else if(App.modes.mainMode=="removeShape") {

		//removeShape(mouseX, mouseY);
	} else if(App.modes.mainMode=="moveShape") {

		//isMoving = !isMoving;
	} else if(App.modes.mainMode=="rotateShape") {

		if(App.modes.isRotating) {
			App.rotation.terminate(mousePos);
		} else {
			App.rotation.start(mouseX, mouseY);
		}
	} else if(App.modes.mainMode=="none") {
		if(!App.modes.isMenuOpened) {
			//open the menu when clicking on a shape
			var shapeIndex = isPointOnShape(App.shapes, {x: mouseX, y: mouseY});
			if(shapeIndex!==false) {
				App.modes.isMenuOpened = true;
				App.modes.menuInfo.x = mousePos[0];
				App.modes.menuInfo.y = mousePos[1];
			}
		} else {
			//close the menu
			App.modes.isMenuOpened = false;
		}
	} else {
		console.log("unknown mode in App.events.canvas.onclick");
	}

	App.events.canvas.refresh(e);
};
App.canvas.onclick = App.events.canvas.onclick;


/**
 * Called when onmousemove is triggerd
 */
App.events.canvas.onmousemove = function(e){
	App.events.canvas.refresh(e);
};
App.canvas.onmousemove = App.events.canvas.onmousemove;

/**
 * Called when oncontextmenu is triggerd
 */
App.events.canvas.oncontextmenu = function(e){
	e.preventDefault(); //cancel right click
};
App.canvas.oncontextmenu = App.events.canvas.oncontextmenu;
