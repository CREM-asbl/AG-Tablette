/**
 * La classe principale de l'application
 */

/**
 * Constructeur, initialise l'application
 * @param divRef: le <div> contenant l'élément HTML <canvas>
 * @param canvasRef: l'élément HTML <canvas>
 */
function App(divRef, canvasRef, backgroundCanvasRef) {
	//Classe qui gère le canvas
	this.canvas = new Canvas(divRef, canvasRef, backgroundCanvasRef, this);

	//Classe représentant l'état de l'application
	this.state = {'name': null};

	//Liste des classes d'états possible
	this.states = {
		"create_shape": new CreateState(this),
		"delete_shape": new DeleteState(this),
		"move_shape": new MoveState(this),
		"rotate_shape": new RotateState(this),
		"global_zoom": new GlobalZoomState(this),
		"border_color": new BorderColorState(this),
		"background_color": new BackgroundColorState(this),
		"link_shapes": new LinkerState(this),
		"reverse_shape": new ReverseState(this),
		"build_shape_center": new BuildCenterState(this),
		"duplicate_shape": new DuplicateState(this),
		"divide_segment": new DivideState(this),
		"unlink_shapes": new UnlinkerState(this),
		"merge_shapes": new MergeState(this)
	};

	//Représente un projet, qui peut être sauvegardé
	this.workspace = new Workspace(this);
	this.workspace.addMenuAFamilies();

	//Liste des événements que l'application transmet à la classe de l'état actuel
	this.events = {
		"click": function(){},
		"mousedown": function(){},
		"mouseup": function(){}
	};

	//Classe permettant de sélectionner visuellement une couleur
	this.colorpicker = new ColorPicker(this);

	//Paramètres de l'application
	this.settings = new Settings(this);
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
	var historyRunning = this.workspace.history.isRunning

	this.events.click = function(e){ if(that.state.name && !historyRunning) that.state.click(e); };
	this.events.mousedown = function(e){ if(that.state.name && !historyRunning) that.state.mousedown(e); };
	this.events.mouseup = function(e){ if(that.state.name && !historyRunning) that.state.mouseup(e); };

	this.canvas.refresh();
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
	var f_onresize = function(e){
		that.canvas.divRef.setCanvasSize();
		that.canvas.refresh();
		that.canvas.refreshBackgroundCanvas();
	};
	window.onresize = f_onresize;
	window.onorientationchange = f_onresize;

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

	//Cacher le popup "settings" quand on appuie sur escape.
	window.onkeyup = function(e){
		if(e.key == "Escape" || e.key == "Esc" || e.keyCode == 27) {
			document.getElementById('settings-popup-gray').style.display='none';
		}
	};

};


/**
 * OUTILS
 */


App.prototype.uniqId = function() {
 	return (new Date().getTime() + Math.floor(Math.random() * 100000 + 42)).toString(16);
};

/**
 * Renvoie l'angle correspondant dans l'intervalle ]-PI, PI]
 * @param  {float} angle l'angle (en radians)
 * @return {float}       l'angle correspondant
 */
App.prototype.getAngle = function(angle) {
	angle = angle % (Math.PI*2);
	if(angle<0)
		angle += Math.PI*2;
	//on a un angle entre 0 et 2*Math.PI
	if(angle>Math.PI)
		angle -= Math.PI*2;
	return angle;
}

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
		return conversion[parseInt(dec / 16)]+conversion[dec % 16];
	}

	var red = 255 - hexTodec(color[1]+color[2]),
		green = 255 - hexTodec(color[3]+color[4]),
		blue = 255 -hexTodec(color[5]+color[6]);

	return '#'+decToHex(red)+decToHex(green)+decToHex(blue);
};

/**
 * Calcule la moyene de 2 couleurs.
 * @param color1: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 * @param color2: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
 */
App.prototype.getAverageColor = function(color1, color2) {
	var regex = /^#([0-9a-fA-F]{3}){1,2}$/;
	if(!regex.test(color1) || !regex.test(color2)) {
		console.log("App.getAverageColor: une couleur n'a pas été reconnue: "+color1+" "+color2);
		return;
	}
	if(color1.length==4) //transforme #abc en #aabbcc
		color1 = '#'+color1[1]+''+color1[1]+''+color1[2]+''+color1[2]+''+color1[3]+''+color1[3];
	if(color2.length==4) //transforme #abc en #aabbcc
		color2 = '#'+color2[1]+''+color2[1]+''+color2[2]+''+color2[2]+''+color2[3]+''+color2[3];
	color1 = color1.toUpperCase();
	color2 = color2.toUpperCase();

	var hexTodec = function(hex) { //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
		var conversion = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
			'8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15};
		return conversion[hex[0]]*16 + conversion[hex[1]];
	};
	var decToHex = function(dec) { //transforme un nombre décimal de 0 à 255 en hexadécimal
		var conversion = ['0', '1', '2', '3', '4', '5', '6', '7',
			'8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
		return conversion[parseInt(dec / 16)]+conversion[dec % 16];
	}

	var red = parseInt((hexTodec(color1[1]+color1[2]) + hexTodec(color2[1]+color2[2]))/2),
		green = parseInt((hexTodec(color1[3]+color1[4]) + hexTodec(color2[3]+color2[4]))/2),
		blue = parseInt((hexTodec(color1[5]+color1[6]) + hexTodec(color2[5]+color2[6]))/2);

	return '#'+decToHex(red)+decToHex(green)+decToHex(blue);
}

/**
 * Renvoie une liste de points qui approximent un arc de cercle (précision: angleStep).
 * @param  {float} center       coordonnée du centre du cercle
 * @param  {float} p1         	coordonnées du point de départ
 * @param  {float} angle     	l'angle de dessin du cercle (en degrés!)
 * @param  {boolean} direction 	sens de l'arc de cercle
 * @param  {[type]} angleStep 	la précision de découpage (angle, en degrés)
 * @return {[{'x': float, 'y': float}]}           	liste des points qui approximent l'arc.
 */
App.prototype.getApproximatedArc = function(center, p1, angle, direction, angleStep) {
	var rayon = Math.sqrt(Math.pow(center.x - p1.x, 2) + Math.pow(center.y - p1.y, 2)),
		start_angle = this.getAngleBetweenPoints(p1, center),
		end_angle = start_angle+angle*Math.PI/180,
		step_angle = angleStep *Math.PI/180,
		pointsList = [];

	if(direction) {
		step_angle = -step_angle;
		end_angle = start_angle-angle*Math.PI/180
	}

	var cur_angle = start_angle;
	while((!direction && cur_angle+step_angle < end_angle) || (direction && cur_angle-step_angle > end_angle)) {
		cur_angle += step_angle;

		var posX = rayon * Math.sin(cur_angle) + center.x,
			posY = rayon * Math.cos(cur_angle) + center.y;

		pointsList.push(new Point(posX, posY, null, this));

	}
	var posX = rayon * Math.sin(end_angle) + center.x,
		posY = rayon * Math.cos(end_angle) + center.y;
	pointsList.push(new Point(posX, posY, null, this));

	return pointsList;
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
