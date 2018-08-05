/**
 * Cette classe permet d'effectuer un retournement d'une une forme (ou d'un ensemble de formes liées) sur le canvas
 */
function ReverseState(app) {
    this.app = app;
    this.name = "reverse_shape";

    //Durée en secondes de l'animation de retournement
    this.duration = 4;

    //La forme que l'on a sélectionnée
    this.selectedShape = null;

    //l'ensemble des formes liées à la forme actuelle.
    this.shapesList = [];

    //coordonnées de la souris lorsque le déplacement a commencé
    this.clickCoordinates = null;

    //Vaut vrai si une animation est en cours
    this.isReversing = false;

    /**
     * Représente l'axe de la symétrie orthogonale.
     * axe.type: type de l'axe (String): H (horizontal: - ), V (vertical: | ), NW (nord-west: \ ) ou SW (sud-west: / ).
     * axe.center: le 'centre' de l'axe
     * axe.p1: un point sur l'axe ({'x': int, 'y': int} - coordonnées relatives au centre)
     * axe.p2: un autre point sur l'axe ({'x': int, 'y': int} - coordonnées relatives au centre)
     */
    this.axe = null;

    //timestamp en milliseconde du démarrage de l'animation
    this.startTime = null;
}

App.heriter(ReverseState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
ReverseState.prototype.reset = function(){
    this.selectedShape = null;
    this.shapesList = [];
    this.clickCoordinates = null;
    this.isReversing = false;
    this.axe = null;
    this.startTime = null;
    window.cancelAnimationFrame(this.requestAnimFrameId);
};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 * @param point: les coordonnées du click
 */
ReverseState.prototype.click = function(point){
    var list = window.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
    if(list.length==0)
        return;
    this.selectedShape = list.pop();
    this.isReversing = true;
    this.clickCoordinates = point;
    this.axe = {
        'type': null,
        'center': {'x': null, 'y': null},
        'p1': {'x': null, 'y': null},
        'p2': {'x': null, 'y': null}
    };
    this.startTime = Date.now();

    var angle = this.app.getAngleBetweenPoints(point, this.selectedShape);
    if(angle>Math.PI) angle -= Math.PI;
    this.axe.center = {'x': this.selectedShape.x, 'y': this.selectedShape.y};
    if(angle<=Math.PI/8 || angle >7*Math.PI/8) {
        this.axe.type = 'V';
        this.axe.p1 = {'x': 0, 'y': -1};
        this.axe.p2 = {'x': 0, 'y': 1};
    } else if(angle>Math.PI/8 && angle<=3*Math.PI/8) {
        this.axe.type = 'NW';
        this.axe.p1 = {'x': -1, 'y': -1};
        this.axe.p2 = {'x': 1, 'y': 1};
    } else if(angle>3*Math.PI/8 && angle<=5*Math.PI/8) {
        this.axe.type = 'H';
        this.axe.p1 = {'x': -1, 'y': 0};
        this.axe.p2 = {'x': 1, 'y': 0};
    } else { //if(angle>5*Math.PI/8 && angle<=7*Math.PI/8)
        this.axe.type = 'SW';
        this.axe.p1 = {'x': -1, 'y': 1};
        this.axe.p2 = {'x': 1, 'y': -1};
    }

    var group = this.app.workspace.getShapeGroup(this.selectedShape, "system");
    if(group)
        this.shapesList = group.slice();
    else
        this.shapesList = [this.selectedShape];

    var group = this.app.workspace.getShapeGroup(this.selectedShape, "user");
    if(group) {
        for(var i=0;i<group.length;i++) {
            var g = this.app.workspace.getShapeGroup(group[i], "system");
            if(g) {
                for(var j=0;j<g.length;j++) {
                    if(this.shapesList.indexOf(g[j])==-1)
                        this.shapesList.push(g[j]);
                }
            } else {
                if(this.shapesList.indexOf(group[i])==-1)
                    this.shapesList.push(group[i]);
            }
        }
    }

    //start animation:
    this.animate();
};

/**
 * Fonction appelée de nombreuses fois par seconde (nombre défini par le
 * navigateur: voir App.start -> RequestAnimFrame) pour faire l'animation.
 * Une fois l'animation terminée, elle appelle la fonction reverseShapes().
 */
ReverseState.prototype.animate = function(){
    this.app.canvas.refresh();

    if(Date.now()-this.startTime < this.duration*1000 && this.isReversing) {
        var that = this;
        this.requestAnimFrameId = window.requestAnimFrame(function(){
            that.animate();
        });
    } else if(this.isReversing) { //effectuer le retournement.
        this.reverseShapes();
    }
};

/**
 * Modifie effectivement les coordonnées des formes.
 */
ReverseState.prototype.reverseShapes = function () {
    for(var i=0;i<this.shapesList.length;i++) {
        var shape = this.shapesList[i];
        var saveAxeCenter = this.axe.center;
        var newShapeCenter = this.computePointPosition(shape.x, shape.y, this.axe, 1);
        this.axe.center = {'x': 0, 'y': 0};
    	shape.x = newShapeCenter.x;
    	shape.y = newShapeCenter.y;

        for(var j=0;j<shape.buildSteps.length;j++) {
    		var transformation = this.computePointPosition(shape.buildSteps[j].x, shape.buildSteps[j].y, this.axe, 1);
    		shape.buildSteps[j].setCoordinates(transformation.x, transformation.y);
    	}
    	shape.recomputePoints();

    	for(var j=0;j<shape.segmentPoints.length;j++) {
    		var pos = shape.segmentPoints[j].getRelativeCoordinates();
    		var transformation = this.computePointPosition(pos.x, pos.y, this.axe, 1);
    		shape.segmentPoints[j].setCoordinates(transformation.x, transformation.y);
    	}
    	for(var j=0;j<shape.otherPoints.length;j++) {
    		var pos = shape.otherPoints[j].getRelativeCoordinates();
    		var transformation = this.computePointPosition(pos.x, pos.y, this.axe, 1);
    		shape.otherPoints[j].setCoordinates(transformation.x, transformation.y);
    	}

        this.axe.center = saveAxeCenter;
        shape.isReversed = !shape.isReversed;

    }
    this.reset();
    this.app.canvas.refresh();
};

/**
 * Calcule les coordonnées des extrémités du segment représentant l'axe de symétrie.
 * @param shape: la forme dont l'axe de symétrie passe par le centre
 * @param mouseCoordonates: les coordonnées de la souris.
 * @return: renvoie l'axe de symétrie à utiliser ([ {'x': int, 'y': int}, {'x': int, 'y': int} ])
 */
ReverseState.prototype.getSymmetryAxis = function(shape, mouseCoordinates) {
    var angle = this.app.getAngleBetweenPoints(mouseCoordinates, shape);
    if(angle>Math.PI) angle -= Math.PI;
    if(angle<=Math.PI/8 || angle >7*Math.PI/8) {
        return [{'x': shape.x, 'y': shape.y-100}, {'x': shape.x, 'y': shape.y+100}];
    } else if(angle>Math.PI/8 && angle<=3*Math.PI/8) {
        return [{'x': shape.x-68.3, 'y': shape.y-68.3}, {'x': shape.x+68.3, 'y': shape.y+68.3}];
    } else if(angle>3*Math.PI/8 && angle<=5*Math.PI/8) {
        return [{'x': shape.x-100, 'y': shape.y}, {'x': shape.x+100, 'y': shape.y}];
    } else { //if(angle>5*Math.PI/8 && angle<=7*Math.PI/8)
        return [{'x': shape.x-68.3, 'y': shape.y+68.3}, {'x': shape.x+68.3, 'y': shape.y-68.3}];
    }
};

/**
 * Calcule les nouvelles coordonnées d'un point lors de l'animation d'une symétrie axiale.
 * @param point: le point de départ ({'x': int, 'y': int})
 * @param axe: l'axe de symétrie (Object, voir ReverseState.axe)
 * @param progress: l'avancement de l'animation (float, entre 0 et 1)
 */
ReverseState.prototype.computePointPosition = function(x, y, axe, progress) {
    var center;
    var p1x = axe.center.x + axe.p1.x,
        p1y = axe.center.y + axe.p1.y,
        p2x = axe.center.x + axe.p2.x,
        p2y = axe.center.y + axe.p2.y;

    //Calculer la projection du point sur l'axe.
    if(axe.type=='V') {
        center = {'x': p1x, 'y': y};
    } else if(axe.type=='H') {
        center = {'x': x, 'y': p1y};
    } else { // axe.type=='NW' || axe.type=='SW'
        var f_a = (p1y - p2y) / (p1x - p2x);
        var f_b = p2y - f_a * p2x;
        var x2 = (x + y*f_a - f_a*f_b) / (f_a*f_a +1);
        var y2 = f_a * x2 + f_b;
        center = {
            'x': x2,
            'y': y2
        };
    }
    //Calculer la nouvelle position du point à partir de l'ancienne et de la projection.
    var transformation = {
        'x': x + (2* (center.x - x) * progress),
        'y': y + (2* (center.y - y) * progress)
    };
    return transformation;
};

/**
 * Renvoie l'avancement de l'animation.
 * @return (float): entre 0 et 1. Renvoie null si une animation n'est pas en cours.
 */
ReverseState.prototype.getProgress = function () {
    if(!this.isReversing)
        return null;
    return Math.min((Date.now()-this.startTime)/(this.duration*1000), 1);
};

/**
 * Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
ReverseState.prototype.mouseup = function(point){};

/**
 * Annuler l'action en cours
 */
ReverseState.prototype.abort = function(){
    window.cancelAnimationFrame(this.requestAnimFrameId);
    this.isReversing = false;
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
ReverseState.prototype.draw = function(canvas, mouseCoordinates){
	if(!this.isReversing) {
        //Dessine l'axe de symétrie
		var list = window.app.workspace.shapesOnPoint(new Point(mouseCoordinates.x, mouseCoordinates.y, null, null));
	    if(list.length>0) {
			var shape = list.pop();
			var axis = this.getSymmetryAxis(shape, mouseCoordinates);
			canvas.drawLine(axis[0], axis[1]);
		}
	} else {
        //Dessiner les formes:
		for(var i=0;i<this.shapesList.length;i++) {
			canvas.drawReversingShape(this.shapesList[i], this.axe, this.getProgress());
		}

		//Dessiner l'axe de symétrie:
		var shape = this.selectedShape;
		var axis = this.getSymmetryAxis(shape, this.clickCoordinates);
		canvas.drawLine(axis[0], axis[1]);
    }
};

/**
 * démarrer l'état
 */
ReverseState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
ReverseState.prototype.mousedown = function(){};
