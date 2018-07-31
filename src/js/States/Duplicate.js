/**
 * Cette classe permet de dupliquer une forme au canvas
 */
function DuplicateState(app) {
    this.app = app;
    this.name = "duplicate_shape";

    this.isDuplicating = false;
    this.newShape = null;
    this.clickCoordinates = null;
}

App.heriter(DuplicateState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
DuplicateState.prototype.reset = function(){
    this.isDuplicating = false;
    this.newShape = null;
    this.clickCoordinates = null;
};

/**
 * Duplique la forme aux coordonnées données (s'il y en a une)
 * @param point: {x: int, y: int}
 */
DuplicateState.prototype.mousedown = function(point) {
    var list = window.app.workspace.shapesOnPoint(point);
    if(list.length==0)
        return;
    this.isDuplicating = true;
    this.clickCoordinates = point;

    var sourceShape = list.pop();
    this.newShape = sourceShape.getCopy();

    this.app.workspace.addShape(this.newShape);
	this.app.canvas.refresh(point);
};

/**
 * Annuler l'action en cours
 */
DuplicateState.prototype.abort = function(){
    if(this.newShape)
        this.app.workspace.removeShape(this.newShape);
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
DuplicateState.prototype.mouseup = function(point){
    if(this.isDuplicating) {
        if(point.x==this.clickCoordinates.x && point.y==this.clickCoordinates.y) {
            //cancel duplicate
            this.abort();
        } else {
            var xDiff = this.clickCoordinates.x - this.newShape.x;
            var yDiff = this.clickCoordinates.y - this.newShape.y;

            //nouvelles coordonnées de la forme: la position de la souris - le décalage.
            var newX = point.x - xDiff;
			var newY = point.y - yDiff;

            this.newShape.setCoordinates({"x": newX, "y": newY});
            this.newShape.recomputePoints();
        }
        this.reset();
    }
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
DuplicateState.prototype.draw = function(canvas, mouseCoordinates){
    //dessine la forme qui est en train d'être bougée lors d'une duplication

    //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
    var xDiff = this.clickCoordinates.x - this.newShape.x;
    var yDiff = this.clickCoordinates.y - this.newShape.y;

    var newX = mouseCoordinates.x - xDiff;
    var newY = mouseCoordinates.y - yDiff;

    canvas.drawMovingShape(this.newShape, {"x": newX, "y": newY});
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
DuplicateState.prototype.click = function(){};

/**
 * démarrer l'état
 */
DuplicateState.prototype.start = function(params){};
