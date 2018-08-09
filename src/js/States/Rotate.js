/**
 * Cette classe permet d'effectuer une rotation sur une forme (ou un ensemble de formes liées) sur le canvas
 */
function RotateState(app) {
    this.app = app;
    this.name = "rotate_shape";

    //La forme que l'on a sélectionnée
    this.selectedShape = null;

    //l'ensemble des formes liées à la forme actuelle.
    this.shapesList = [];

    //coordonnées de la souris lorsque le déplacement a commencé
    this.clickCoordinates = null;
    this.startAngle = null;

    this.isRotating = false;

    this.center = null;
}

App.heriter(RotateState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
RotateState.prototype.reset = function(){
    this.selectedShape = null;
    this.shapesList = [];
    this.clickCoordinates = null;
    this.startAngle = null;
    this.isRotating = false;
    this.center = null;
};

/**
 * Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */ //TODO: au survol, entourer les formes que l'on va tourner!
RotateState.prototype.mousedown = function(point){
    var list = window.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
    if(list.length>0) {
        this.isRotating = true;
        this.clickCoordinates = point;
        this.selectedShape = list.pop();
        this.center = {
            "x": this.selectedShape.x,
            "y": this.selectedShape.y
        };

        this.startAngle = this.app.getAngleBetweenPoints(this.selectedShape, point);
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
    }
    this.app.canvas.refresh(point);
};

/**
 * Calcule les nouvelles coordonnées du centre de la forme
 *  ->elles ne changent pas si la forme en question est celle qui a été sélectionnée
 *   pour la rotation, mais changent s'il s'agit d'une forme attachée à cette
 *   dernière.
 * @param shape: Shape
 * @param angle: l'angle de rotation actuel (en radians)
 * Note: utilisée dans Move. en faire une copie dans la classe Move?
 */
RotateState.prototype.computeNewShapePos = function(shape, angle, center){
    if(center==undefined) {
        center = this.center;
    }

    var s = Math.sin(-angle);
    var c = Math.cos(-angle);

    var x = shape.x - center.x;
    var y = shape.y - center.y;

    // effectuer la rotation
    var newX = x * c - y * s + center.x;
    var newY = x * s + y * c + center.y;


    return {"x": newX, "y": newY};
};

/**
 * Calculer la nouvelle d'un position d'un point qui a subi une rotation de centre (0,0)
 * @param point: le point ({'x': int, 'y': int})
 * @param angle: l'angle (float, en radians)
 */
RotateState.prototype.computePointPosition = function(x, y, angle) {
    var s = Math.sin(-angle);
    var c = Math.cos(-angle);

    // effectuer la rotation
    var newX = x * c - y * s;
    var newY = x * s + y * c;


    return {"x": newX, "y": newY};
};

/**
 * Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
RotateState.prototype.mouseup = function(point){
    if(this.isRotating) {
        var AngleDiff = this.app.getAngleBetweenPoints(this.center, point) - this.startAngle;
        for(var i=0;i<this.shapesList.length;i++) {
            var shape = this.shapesList[i];
            var newPos = this.computeNewShapePos(shape, AngleDiff);
            this.shapesList[i].setCoordinates(newPos);

        	for(var j=0;j<shape.buildSteps.length;j++) {
        		var transformation = this.computePointPosition(shape.buildSteps[j].x, shape.buildSteps[j].y, AngleDiff);
        		shape.buildSteps[j].setCoordinates(transformation.x, transformation.y);
        	}
        	shape.recomputePoints();
        	for(var j=0;j<shape.segmentPoints.length;j++) {
        		var pos = shape.segmentPoints[j].getRelativeCoordinates();
        		var transformation = this.computePointPosition(pos.x, pos.y, AngleDiff);
        		shape.segmentPoints[j].setCoordinates(transformation.x, transformation.y);
        	}
        	for(var j=0;j<shape.otherPoints.length;j++) {
        		var pos = shape.otherPoints[j].getRelativeCoordinates();
        		var transformation = this.computePointPosition(pos.x, pos.y, AngleDiff);
        		shape.otherPoints[j].setCoordinates(transformation.x, transformation.y);
        	}
        }
        this.reset();
    }
    this.app.canvas.refresh(point);
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
RotateState.prototype.draw = function(canvas, mouseCoordinates){
    //dessine la forme/le groupe de formes qui est en train d'être tourné

    var AngleDiff = canvas.app.getAngleBetweenPoints(this.selectedShape, mouseCoordinates) - this.startAngle;
    for(var i=0;i<this.shapesList.length;i++) {
        var pos = this.computeNewShapePos(this.shapesList[i], AngleDiff);
        canvas.drawRotatingShape(this.shapesList[i], pos, AngleDiff);
    }
};

/**
 * Annuler l'action en cours
 */
RotateState.prototype.abort = function(){};

/**
 * démarrer l'état
 */
RotateState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
RotateState.prototype.click = function(){};
