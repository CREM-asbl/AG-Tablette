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
 */
RotateState.prototype.mousedown = function(point){
    var list = window.app.workspace.shapesOnPoint(point);
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
            this.shapesList = group;
        else
            this.shapesList = [this.selectedShape];
    }
};

/**
 * Calcule les nouvelles coordonnées du centre de la forme
 *  ->elles ne changent pas si la forme en question est celle qui a été sélectionnée
 *   pour la rotation, mais elles changent s'il s'agit d'une forme attachée à cette
 *   dernière.
 * @param shape: Shape
 * @param angle: l'angle de rotation actuel (en radians)
 */
RotateState.prototype.computeNewShapePos = function(shape, angle){
    var s = Math.sin(-angle);
    var c = Math.cos(-angle);

    var x = shape.x - this.center.x;
    var y = shape.y - this.center.y;

    // effectuer la rotation
    var newX = x * c - y * s + this.center.x;
    var newY = x * s + y * c + this.center.y;


    return {"x": newX, "y": newY};
};

/**
 * Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
RotateState.prototype.mouseup = function(point){
    if(this.isRotating) {
        var AngleDiff = this.app.getAngleBetweenPoints(this.center, point) - this.startAngle;
        for(var i=0;i<this.shapesList.length;i++) {
            var newPos = this.computeNewShapePos(this.shapesList[i], AngleDiff);
            this.shapesList[i].setCoordinates(newPos);
            this.shapesList[i].rotateAngle += AngleDiff;

            this.shapesList[i].recomputePoints(AngleDiff);
        }
        this.reset();
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
