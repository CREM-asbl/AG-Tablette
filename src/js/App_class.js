/**
 * La classe principale de l'application
 */

/**
 * Constructeur, initialise l'application
 * @param divRef: le <div> contenant l'élément HTML <canvas>
 * @param canvasRef: l'élément HTML <canvas>
 */
function App(divRef, canvasRef) {
	this.canvas = new Canvas(divRef, canvasRef, this);

	this.state = {name: null};

	this.workspace = new Workspace(this);
	this.workspace.addMenuAFamilies();

	this.menu = new Menu(this);

	this.magnetismDistance = 6;

	this.states = {
		"create_shape": new CreateState(this),
		"delete": null, //TODO
		"move_shape": new MoveState(this),
		"reverse": null, //TODO
		"rotate_shape": new RotateState(this),
	};

	this.events = {
		"click": function(){},
		"mousedown": function(){},
		"mouseup": function(){}
	};
}

App.prototype.handleEvent = function(eventName, eventObj){
	this.events[eventName](eventObj);
};

App.prototype.setState = function(stateName, params){
	var that = this;
	if(this.state.name!=null) {
		this.state.abort();
	}

	this.state = this.states[stateName];
	this.state.reset();
	this.state.start(params);

	this.events.click = function(e){ that.state.click(e); };
	this.events.mousedown = function(e){ that.state.mousedown(e); };
	this.events.mouseup = function(e){ that.state.mouseup(e); };
};

/**
 * Récupérer la version de l'application
 * @return la version (Chaîne de caractères)
 */
App.prototype.getVersion = function(){
	return "0.0.1";
};

/**
 * Récupérer une référence vers le canvas
 * @return un objet de type Canvas
 */
App.prototype.getCanvas = function(){
	return this.canvas;
};

/**
 * Démarre l'application; fonction appelée lorsque la page est chargée
 */
App.prototype.start = function(){
	var that = this;

	//quand la fenêtre est redimensionnée, mettre à jour la taille du canvas
	window.onresize = function(e){
		that.canvas.getDiv().setCanvasSize();
		that.canvas.refresh();
	};
};

/**
 * Récupérer l'angle (en radians) entre 2 points
 * @param a: premier point ({x: float, y:float})
 * @param b: second point ({x: float, y:float})
 * @return: l'angle
 */
App.prototype.getAngleBetweenPoints = function(a, b) {
	var angle = Math.atan2(a.x-b.x, a.y-b.y);
	if(angle<0)
		angle += 2*Math.PI;
	return angle;
};

/**
 * Méthode statique: faire hériter une classe d'une autre
 *	-> copie le prototype de la classe mère
 * @param child: le prototype de la classe Fille
 * @param parent: le prototype de la classe mère
 */
App.heriter = function(child, parent) {
		for(var elem in parent)
    		child[elem]=parent[elem];
}
