/**
 * La classe principale de l'application
 */
import {Workspace} from './Workspace'
import {Canvas} from './Canvas'

export class App {
	/**
	 * Constructeur, initialise l'application
	 * @param divRef: le <div> contenant l'élément HTML <canvas>
	 * @param canvasRef: l'élément HTML <canvas>
	 */
	constructor(divRef, canvasRef, backgroundCanvasRef) {
		//Classe qui gère le canvas
		this.canvas = new Canvas(divRef, canvasRef, backgroundCanvasRef, this);

		//Classe représentant l'état de l'application
		this.state = { 'name': null };

		//Liste des classes d'états possible
		this.states = {
			"no_state": { "reset": function () { }, 'start': function () { } },
			"delete_shape": new DeleteState(this),
			"border_color": new BorderColorState(this),
			"background_color": new BackgroundColorState(this),
			"link_shapes": new LinkerState(this),
			"reverse_shape": new ReverseState(this),
			"build_shape_center": new BuildCenterState(this),
			"duplicate_shape": new DuplicateState(this),
			"divide_segment": new DivideState(this),
			"unlink_shapes": new UnlinkerState(this),
			"moveplane_state": new MovePlaneState(this)
		};

		//Représente un projet, qui peut être sauvegardé
		this.workspace = new Workspace(this);
		this.workspace.addMenuAFamilies();

		//Liste des événements que l'application transmet à la classe de l'état actuel
		this.events = {
			"click": function () { },
			"mousedown": function () { },
			"mouseup": function () { }
		};

		//Paramètres de l'application
		this.settings = new Settings(this);

		//Sauvegarde du Workspace:
		this.storer = new Storer(this);

		//Souris virtuelle:
		//this.virtualMouse = new VirtualMouse(this);
		//Mise en suspens de la souris virtuelle
		this.virtualMouse = { shown: false }

		this.setState("no_state");
	}

	/**
	 * Transmet les événements à l'état
	 * @param eventName: le nom de l'événement (click, mousedown, ...)
	 * @param eventObj: référence vers l'objet Event
	 */
	handleEvent(eventName, eventObj) {
		this.events[eventName](eventObj, { 'shape': null });
	};

	/**
	 * Définir l'état de l'application. On appelle la méthode abort() de l'état actuel,
	 * on change l'état, et on appelle reset() puis start() du nouvel état.
	 * @param stateName: le nom du nouvel état
	 * @param params: objet envoyé en paramètre à la méthode start() du nouvel état
	 * @param options: {'do_reset': boolean = true, 'do_start': boolean = true}
	 */
	setState(stateName, params, options) {
		if (!options) options = {};

		var that = this;
		if (this.state.name != null) {
			this.state.abort(); //Annuler les actions en cours de l'état courant
		}

		this.state = this.states[stateName];

		if (options.do_reset !== false)
			this.state.reset();
		if (options.do_start !== false)
			this.state.start(params);
		var historyRunning = this.workspace.history.isRunning;

		this.events.click = function (e, selection) {
			if (that.virtualMouse.isShown && that.virtualMouse.isPointOnMouse(new Point(e.x, e.y))) {
				that.virtualMouse.click(e);
				return;
			}
			if (that.state.name && !historyRunning)
				that.state.click(e, selection);
		};
		this.events.mousedown = function (e, selection) {
			if (that.virtualMouse.isShown && that.virtualMouse.isPointOnMouse(new Point(e.x, e.y))) {
				that.virtualMouse.mousedown(e);
				return;
			}
			if (that.state.name && !historyRunning)
				that.state.mousedown(e, selection);
		};
		this.events.mouseup = function (e, selection) {
			if (that.virtualMouse.isShown && that.virtualMouse.isMoving) {
				that.virtualMouse.mouseup(e);
				return;
			}
			if (that.state.name && !historyRunning)
				that.state.mouseup(e, selection);
		};

		this.canvas.refresh();
	};

	/**
	 * Récupérer la version de l'application
	 * @return la version (Chaîne de caractères)
	 */
	getVersion() {
		return "1.0.0";
	};

	/**
	 * Démarre l'application; fonction appelée lorsque la page est chargée
	 */
	start() {
		var that = this;

		//quand la fenêtre est redimensionnée, mettre à jour la taille du canvas
		var f_onresize = function (e) {
			that.canvas.divRef.setCanvasSize();
			window.canvasLeftShift = document.getElementsByTagName("ag-tablette-app")[0].shadowRoot.getElementById("app-canvas-view-toolbar").clientWidth;
			that.canvas.refresh();
			that.canvas.refreshBackgroundCanvas();
		};
		window.onresize = f_onresize;
		window.onorientationchange = f_onresize;

		//Utilisé pour les animations.
		window.requestAnimFrame = (function () {
			return window.requestAnimationFrame
				|| window.webkitRequestAnimationFrame
				|| window.mozRequestAnimationFrame
				|| window.oRequestAnimationFrame
				|| window.msRequestAnimationFrame
				|| function (callback) {
					window.setTimeout(callback, 1000 / 20);
				};
		})();

		//Cacher le popup "settings" quand on appuie sur escape.
		window.onkeyup = function (e) {
			if (e.key == "Escape" || e.key == "Esc" || e.keyCode == 27) {
				document.getElementById('settings-popup-gray').style.display = 'none';
			}
		};

		dispatchEvent(new CustomEvent('app-loaded'))
	};

	/**
	 * Créer un nouvel espace de travail
	 * Todo: Améliorer cette fonctionnalité
	 *	Solution provisoire le temps de proposer une solution plus complète (sauvegarde + "onglets")
	 */
	newWorkspace(do_save_current_ws) {
		if (do_save_current_ws !== false)
			this.saveCurrentWorkspace("Workspace_" + this.storer.getAmountStoredWorkspaces());

		this.workspace = new Workspace(this);
		this.workspace.addMenuAFamilies();
		this.canvas.refresh();
	};

	/**
	 * Sauvegarde l'espace de travail actuel
	 * @param  {String} name Le nom du Workspace. Il peut y avoir plusieurs espaces de travail sauvegardés ayant le même nom.
	 */
	saveCurrentWorkspace(name) {
		if (name === undefined)
			name = "Workspace_" + this.storer.getAmountStoredWorkspaces();
		this.storer.saveWorkspace(this.workspace, name);
	};

	/**
	 * Charge un workspace sauvegardé
	 * @param  {String} uniqid L'id du Workspace
	 */
	restoreWorkspace(uniqid) {
		var ws = this.storer.getWorkspace(uniqid);
		if (!ws) {
			console.log("Workspace non trouvé!");
			return;
		}

		this.workspace = ws;
		this.canvas.refresh();
	}


	/**
	 * OUTILS
	 */

	/**
	 * Générer un identifiant unique
	 * @return {String} id unique.
	 */
	uniqId() {
		return (new Date().getTime() + Math.floor(Math.random() * 100000 + 42)).toString(16);
	};

	/**
	 * Renvoie l'angle correspondant dans l'intervalle ]-PI, PI]
	 * @param  {float} angle l'angle (en radians)
	 * @return {float}       l'angle correspondant
	 */
	getAngle(angle) {
		angle = angle % (Math.PI * 2);
		if (angle < 0)
			angle += Math.PI * 2;
		//on a un angle entre 0 et 2*Math.PI
		if (angle > Math.PI)
			angle -= Math.PI * 2;
		return angle;
	}

	/** //TODO: fonctionne? ne pas l'utiliser ni modifier, supprimer dès que possible.
	 * Récupérer l'angle (en radians) entre 2 points
	 * @param a: premier point ({x: float, y:float})
	 * @param b: second point ({x: float, y:float})
	 * @return: l'angle
	 */
	getAngleBetweenPoints(a, b) {
		var angle = Math.atan2(a.x - b.x, a.y - b.y);
		if (angle < 0)
			angle += 2 * Math.PI;

		return angle;
	};

	/**
	 * Calcule la couleur complémentaire d'une couleur.
	 * @param color: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
	 */
	getComplementaryColor(color) {
		var regex = /^#([0-9a-fA-F]{3}){1,2}$/;
		if (!regex.test(color)) {
			console.error("App.getComplementaryColor: la couleur n'a pas été reconnue: " + color);
			return;
		}
		if (color.length == 4) //transforme #abc en #aabbcc
			color = '#' + color[1] + '' + color[1] + '' + color[2] + '' + color[2] + '' + color[3] + '' + color[3];
		color = color.toUpperCase();

		var hexTodec = function (hex) { //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
			var conversion = {
				'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
				'8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
			};
			return conversion[hex[0]] * 16 + conversion[hex[1]];
		};
		var decToHex = function (dec) { //transforme un nombre décimal de 0 à 255 en hexadécimal
			var conversion = ['0', '1', '2', '3', '4', '5', '6', '7',
				'8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
			return conversion[parseInt(dec / 16)] + conversion[dec % 16];
		}

		var red = 255 - hexTodec(color[1] + color[2]),
			green = 255 - hexTodec(color[3] + color[4]),
			blue = 255 - hexTodec(color[5] + color[6]);

		return '#' + decToHex(red) + decToHex(green) + decToHex(blue);
	};

	/**
	 * Calcule la moyene de 2 couleurs.
	 * @param color1: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
	 * @param color2: couleur (RGB) sous la forme #xxxxxx ou #xxx (lettres minuscules ou majuscules)
	 */
	getAverageColor(color1, color2) {
		var regex = /^#([0-9a-fA-F]{3}){1,2}$/;
		if (!regex.test(color1) || !regex.test(color2)) {
			console.error("App.getAverageColor: une couleur n'a pas été reconnue: " + color1 + " " + color2);
			return;
		}
		if (color1.length == 4) //transforme #abc en #aabbcc
			color1 = '#' + color1[1] + '' + color1[1] + '' + color1[2] + '' + color1[2] + '' + color1[3] + '' + color1[3];
		if (color2.length == 4) //transforme #abc en #aabbcc
			color2 = '#' + color2[1] + '' + color2[1] + '' + color2[2] + '' + color2[2] + '' + color2[3] + '' + color2[3];
		color1 = color1.toUpperCase();
		color2 = color2.toUpperCase();

		var hexTodec = function (hex) { //transforme un nombre hexadécimal à 2 chiffres en un nombre décimal
			var conversion = {
				'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
				'8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
			};
			return conversion[hex[0]] * 16 + conversion[hex[1]];
		};
		var decToHex = function (dec) { //transforme un nombre décimal de 0 à 255 en hexadécimal
			var conversion = ['0', '1', '2', '3', '4', '5', '6', '7',
				'8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
			return conversion[parseInt(dec / 16)] + conversion[dec % 16];
		}

		var red = parseInt((hexTodec(color1[1] + color1[2]) + hexTodec(color2[1] + color2[2])) / 2),
			green = parseInt((hexTodec(color1[3] + color1[4]) + hexTodec(color2[3] + color2[4])) / 2),
			blue = parseInt((hexTodec(color1[5] + color1[6]) + hexTodec(color2[5] + color2[6])) / 2);

		return '#' + decToHex(red) + decToHex(green) + decToHex(blue);
	}

	/**
	 * Renvoie une liste de points qui approximent un arc de cercle (précision: angleStep).
	 * @param  {float} center       coordonnée du centre du cercle
	 * @param  {float} p1         	coordonnées du point de départ
	 * @param  {float} angle     	l'angle de dessin du cercle, en radians
	 * @param  {boolean} direction 	sens de l'arc de cercle
	 * @param  {[type]} step_angle 	la précision de découpage (angle en radians)
	 * @return {[Point]}           	liste des points qui approximent l'arc.
	 */
	getApproximatedArc(center, p1, angle, direction, step_angle) {
		var rayon = Math.sqrt(Math.pow(center.x - p1.x, 2) + Math.pow(center.y - p1.y, 2)),
			start_angle = this.positiveAtan2(p1.y - center.y, p1.x - center.x),
			end_angle = null,
			pointsList = [];
		if (!direction) { //sens horloger
			end_angle = this.positiveAngle(start_angle + angle);
		} else
			end_angle = this.positiveAngle(start_angle - angle);
		if (angle > 6.2831)
			end_angle = start_angle; //pour éviter que end_angle soit un rien plus grand que start_angle (à cause de la précision)

		var cur_angle = start_angle, has_been_mod_2PI = false;
		while (true) {
			//TODO: vérifier si cela fonctionne ? notamment lorsque les bornes sont proches de 0 ou 2 * PI
			var save_cur_angle = cur_angle;
			if (!direction) {
				cur_angle = this.positiveAngle(cur_angle + step_angle);
				if (cur_angle < save_cur_angle) {
					if (has_been_mod_2PI) {
						console.log("angle made 2 rounds...");
						break; //Ne devrait pas arriver, mais évite de boucler indéfiniment si cela arrive.
					}
					has_been_mod_2PI = true;
				}
				if (start_angle < end_angle && (cur_angle >= end_angle || has_been_mod_2PI))
					break;
				if (start_angle >= end_angle && has_been_mod_2PI && cur_angle >= end_angle)
					break;
			} else {
				cur_angle = this.positiveAngle(cur_angle - step_angle);
				if (cur_angle > save_cur_angle) {
					if (has_been_mod_2PI) {
						console.log("angle made 2 rounds...");
						break; //Ne devrait pas arriver, mais évite de boucler indéfiniment si cela arrive.
					}
					has_been_mod_2PI = true;
				}
				if (start_angle > end_angle && (cur_angle <= end_angle || has_been_mod_2PI))
					break;
				if (start_angle <= end_angle && has_been_mod_2PI && cur_angle <= end_angle)
					break;
			}

			var posX = rayon * Math.cos(cur_angle) + center.x,
				posY = rayon * Math.sin(cur_angle) + center.y;

			pointsList.push(new Point(posX, posY, null, this));
		}

		var posX = rayon * Math.cos(end_angle) + center.x,
			posY = rayon * Math.sin(end_angle) + center.y;
		pointsList.push(new Point(posX, posY, null, this));

		return pointsList;
	};

	/**
	 * Renvoie un valeur de atan2 dans l'intervalle [0, 2*Math.PI[ de Math.atan2 . Attention aux arguments: y puis x (comme pour atan2).
	 * @param  {[type]} y premier argument de Math.atan2
	 * @param  {[type]} x second argument de Math.atan2
	 * @return {[type]}	  l'angle en radians entre la partie positive de l'axe des x d'un plan, et le point (x,y) de ce plan.
	 */
	positiveAtan2(y, x) {
		var val = Math.atan2(y, x);
		if (val < 0)
			val += 2 * Math.PI;
		if (2 * Math.PI - val < 0.00001) val = 0;
		return val;
	};

	/**
	 * Vérifie si un angle est entre 2 autres angles
	 * @param  {[type]} srcAngle  angle de départ, en radians, dans l'intervalle [0, 2*Math.PI[
	 * @param  {[type]} dstAngle  angle d'arrivée, en radians, dans l'intervalle [0, 2*Math.PI[
	 * @param  {[type]} direction true si sens anti-horloger, false si sens horloger
	 * @param  {[type]} angle     l'angle, dans l'intervalle [0, 2*Math.PI[
	 * @return {[type]}           true si l'angle est dans l'intervalle, false sinon.
	 * @note: si srcAngle = dstAngle, l'angle est d'office compris entre les 2.
	 */
	isAngleBetweenTwoAngles(srcAngle, dstAngle, direction, angle) {
		if (!direction) { //Sens horloger
			if (dstAngle > srcAngle) { //situation normale
				return (srcAngle <= angle && angle <= dstAngle);
			} else { //l'angle de destination était plus grand que 2*Math.PI
				return (srcAngle <= angle || angle <= dstAngle);
			}
		} else { //Le sens inverse
			if (dstAngle < srcAngle) { //situation normale.
				return (srcAngle >= angle && angle >= dstAngle);
			} else { //l'angle de destination était plus petit que zéro
				return (srcAngle >= angle || angle >= dstAngle);
			}
		}
	};

	/**
	 * Renvoie l'angle équivalent dans l'intervalle [0, 2*Math.PI[
	 * @param  {[type]} angle en radians
	 * @return {[type]}       angle équivalent dans l'intervalle [0, 2*Math.PI[
	 */
	positiveAngle(angle) {
		var val = angle % (2 * Math.PI); //angle dans l'intervalle ]2*Math.PI, 2*Math.PI[
		if (val < 0) val += 2 * Math.PI;
		return (val == 0) ? 0 : val; // éviter de retourner -0.
	};

	/**
	 * Renvoie true si le point est dans le polygone, false sinon.
	 * @param  {[{'x': float, 'y': float}]} polygon Coordonnées des points du polygone
	 * @param  {{'x': float, 'y': float}} point   Coordonnées du point
	 * @return {boolean}         true si le point est dans le polygone
	 * @copyright: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
	 */
	isPointInPolygon(polygon, point) {

		/* Iterate through each line */
		var crossings = 0;
		var nb_pts = polygon.length;

		for (var i = 0; i < nb_pts; i++) {
			var x1, x2;
			/* This is done to ensure that we get the same result when
			   the line goes from left to right and right to left */
			if (polygon[i].x < polygon[(i + 1) % nb_pts].x) {
				x1 = polygon[i].x;
				x2 = polygon[(i + 1) % nb_pts].x;
			} else {
				x1 = polygon[(i + 1) % nb_pts].x;
				x2 = polygon[i].x;
			}

			/* First check if the ray is possible to cross the line */
			if (point.x > x1 && point.x <= x2 && (point.y < polygon[i].y || point.y <= polygon[(i + 1) % nb_pts].y)) {
				var eps = 0.000001;

				/* Calculate the equation of the line */
				var dx = polygon[(i + 1) % nb_pts].x - polygon[i].x;
				var dy = polygon[(i + 1) % nb_pts].y - polygon[i].y;
				var k;

				if (Math.abs(dx) < eps) {
					k = Infinity;   // math.h
				} else {
					k = dy / dx;
				}

				var m = polygon[i].y - k * polygon[i].x;

				/* Find if the ray crosses the line */
				var y2 = k * point.x + m;
				if (point.y <= y2) {
					crossings++;
				}
			}
		}
		if (crossings % 2 == 1) {
			return true;
		}
		return false;
	}
}