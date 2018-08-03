/**
 * La classe principale de l'application
 */

/**
 * Constructeur, initialise l'application
 * @param divRef: le <div> contenant l'élément HTML <canvas>
 * @param canvasRef: l'élément HTML <canvas>
 */
function App(divRef, canvasRef) {
	//Classe qui gère le canvas
	this.canvas = new Canvas(divRef, canvasRef, this);

	//Classe représentant l'état de l'application
	this.state = {'name': null};

	//Liste des classes d'états possible
	this.states = {
		"create_shape": new CreateState(this),
		"delete_shape": new DeleteState(this),
		"move_shape": new MoveState(this),
		"reverse": null, //TODO
		"rotate_shape": new RotateState(this),
		"global_zoom": new GlobalZoomState(this),
		"border_color": new BorderColorState(this),
		"background_color": new BackgroundColorState(this),
		"link_shapes": new LinkerState(this),
		"reverse_shape": new ReverseState(this),
		"build_shape_center": new BuildCenterState(this),
		"duplicate_shape": new DuplicateState(this)
	};

	//Représente un projet, qui peut être sauvegardé
	this.workspace = new Workspace(this);
	this.workspace.addMenuAFamilies();

	/**
	 * Distance en dessous de laquelle 2 points se collent l'un à l'autre (quand on ajoute une forme par exemple)
	 */
	this.magnetismDistance = 6;

	//Niveau de zoom maximal de l'interface
	this.maxZoomLevel = 10;

	//Niveau de zoom minimal de l'interface
	this.minZoomLevel = 0.1;

	//Liste des événements que l'application transmet à la classe de l'état actuel
	this.events = {
		"click": function(){},
		"mousedown": function(){},
		"mouseup": function(){}
	};

	//Classe permettant de sélectionner visuellement une couleur
	this.colorpicker = new ColorPicker(this);
}

/**
 * Transmet les événements à l'état
 * @param eventName: le nom de l'événement (click, mousedown, ...)
 * @param eventObj: référence vers l'objet Event
 */
App.prototype.handleEvent = function(eventName, eventObj){
	this.events[eventName](eventObj);
};

/**
 * Définir l'état de l'application
 * @param stateName: le nom du nouvel état
 * @param params: objet envoyé en paramètre à la méthode start() du nouvel état
 */
App.prototype.setState = function(stateName, params){
	var that = this;
	if(this.state.name!=null) {
		this.state.abort(); //Annuler les actions en cours de l'état courant
	}

	this.state = this.states[stateName];
	this.state.reset();
	this.state.start(params);

	this.events.click = function(e){ if(that.state.name) that.state.click(e); };
	this.events.mousedown = function(e){ if(that.state.name) that.state.mousedown(e); };
	this.events.mouseup = function(e){ if(that.state.name) that.state.mouseup(e); };
};

/**
 * Récupérer la version de l'application
 * @return la version (Chaîne de caractères)
 */
App.prototype.getVersion = function(){
	return "0.1.0";
};

/**
 * Démarre l'application; fonction appelée lorsque la page est chargée
 */
App.prototype.start = function(){
	var that = this;

	//quand la fenêtre est redimensionnée, mettre à jour la taille du canvas
	window.onresize = function(e){
		that.canvas.divRef.setCanvasSize();
		that.canvas.refresh();
	};

	//Utilisé pour les animations.
	window.requestAnimFrame = (function(){
    	return window.requestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.oRequestAnimationFrame
			|| window.msRequestAnimationFrame
			|| function(callback) {
			       window.setTimeout(callback,1000/20);
			   };
    })();

	//Mettre à jour le formulaire <html> des options
	var form = document.getElementsByTagName("app-settings")[0].shadowRoot.getElementById("app-settings-view");
	form.dispatchEvent(new CustomEvent('update-request'));
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
 * Calcule la couleur complémentaire d'une couleur.
 * @param color: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 */
App.prototype.getComplementaryColor = function(color) {
	var regex = /^#([0-9a-fA-F]{3}){1,2}$/;
	if(!regex.test(color)) {
		console.log("App.getComplementaryColor: la couleur n'a pas été reconnue: "+color);
		return;
	}
	if(color.length==4) //transforme #abc en #aabbcc
		color = '#'+color[1]+''+color[1]+''+color[2]+''+color[2]+''+color[3]+''+color[3];
	color = color.toUpperCase();

	var hexTodec = function(hex) { //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
		var conversion = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
			'8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15};
		return conversion[hex[0]]*16 + conversion[hex[1]];
	};
	var decToHex = function(dec) { //transforme un nombre décimal de 0 à 255 en hexadécimal
		var conversion = ['0', '1', '2', '3', '4', '5', '6', '7',
			'8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
		return conversion[dec % 16]+conversion[parseInt(dec / 16)];
	}

	var red = 255 - hexTodec(color[1]+color[2]),
		green = 255 - hexTodec(color[3]+color[4]),
		blue = 255 -hexTodec(color[5]+color[6]);

	return '#'+decToHex(red)+decToHex(green)+decToHex(blue);
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
};
