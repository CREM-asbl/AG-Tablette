var App = {};

/**
 * HTML elements references
 */
App.divs = {};
App.divs.main = document.getElementById("main_div");
App.divs.canvas = document.getElementById("canvas_div");
App.canvas = document.getElementById("main_canvas");
App.ctx = App.canvas.getContext("2d");

/**
 * the shapes list
 */
App.shapes = [];

/**
 * The type of shape to add (used in addShape mode)
 */
App.selectedShapeInMenu = null; //value: square, ...

/**
 * Events managers
 */
App.events = {
	menu: {},	//Defined in menu_events.js
	canvas: {}	//Defined in canvas_events.js
};

/**
 * App modes
 */
App.modes = {
	isRotating: false,		//true if we are currently rotating a shape ( => mainMode = rotateShape )
		rotateInfo: {
			x: -1,
			y: -1,
			shapeIndex: -1
		},
	isTranslating: false,	//true if we are currently translating a shape ( => mainMode = translateShape ),
	isMenuOpened: false,
		menuInfo: {
			x: -1,
			y: -1
		},
	mainMode: "none"		//values: none, addShape, rotateShape, translateShape, removeShape
};

/**
 * Update the main app mode
 */
App.setMainMode = function(mode) {
	if(mode=="none") {
		App.modes.mainMode = "none";
	} else if(mode=="addShape") {
		App.modes.mainMode = "addShape";
		if(App.modes.isRotating)
			App.rotation.cancel();
	} else if(mode=="rotateShape") {
		App.modes.mainMode = "rotateShape";
		if(App.modes.isRotating)
			App.rotation.cancel();
	} else if(mode=="translateShape") {
		//todo
	} else if(mode=="removeShape") {
		//todo
	} else {
		console.log("Error in App.setMode: unknown mode");
	}
};

App.rotation = {}; //Defined in rotation.js

App.drawer = {}; //Defined in drawer.js

/**
 * Start the app
 */
App.start = function(){
	//nothing to do ?
};
