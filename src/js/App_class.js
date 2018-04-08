/**
 * The main application class
 */

/**
 * Constructor
 * @param divRef: the <div> containing the <canvas> (HTML element)
 * @param canvasRef: the <canvas> (HTML element)
 */
function App(divRef, canvasRef) {
	this.cvs = new Canvas(divRef, canvasRef, this);

	this.state = new State();

	this.workspace = new Workspace(this);
	this.workspace.addMenuAFamilies();

	this.menu = new Menu(this);

	this.actions = {
		"create": new Create(this),
		"delete": new Delete(this),
		"move": new Move(this),
		"reverse": new Reverse(this),
		"rotate": new Rotate(this),
	};
}

/**
 * Getter: get the app version
 * @return app version (String)
 */
App.prototype.getVersion = function(){
	return "0.0.1";
};

/**
 * Getter: get the canvas reference
 * @return canvas reference (Canvas)
 */
App.prototype.getCanvas = function(){
	return this.cvs;
};

/**
 * Start the application. Called when the page is loaded
 */
App.prototype.start = function(){
	var that = this;

	//when the window is resized, update canvas size
	window.onresize = function(e){
		that.getCanvas().getDiv().setCanvasSize();
		that.getCanvas().refresh();
	};
};
