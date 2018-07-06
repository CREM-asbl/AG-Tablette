/**
 * Cette classe permet de déplacer une forme (ou un ensemble de formesl iées) sur le canvas
 */
function MoveState(app) {
    this.app = app;
    this.name = "move_shape";

    //La forme que l'on a sélectionnée
    this.selectedShape = null;

    //l'ensemble des formes liées à la forme actuelle.
    this.shapesList = [];

    //coordonnées de la souris lorsque le déplacement a commencé
    this.clickCoordinates = null;

    this.isMoving = false;
 }

App.heriter(MoveState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
MoveState.prototype.reset = function(){
    this.selectedShape = null;
    this.shapesList = [];
    this.clickCoordinates = null;
    this.isMoving = false;
};

/**
 * Annuler l'action en cours
 */
MoveState.prototype.abort = function(){};


/**
 * démarrer l'état
 */
MoveState.prototype.start = function(){};


MoveState.prototype.click = function(){};


MoveState.prototype.mousedown = function(point){
    var list = window.app.workspace.shapesOnPoint(point);
    console.log(list);
    if(list.length>0) {
        this.isMoving = true;
        this.clickCoordinates = point;
        this.selectedShape = list.pop();
        var group = this.app.workspace.getShapeGroup(this.selectedShape, "system");
        if(group)
            this.shapesList = group;
        else
            this.shapesList = [this.selectedShape];
        console.log(this.shapesList);
    }
};

MoveState.prototype.mouseup = function(point){
    if(this.isMoving) {
        for(var i=0;i<this.shapesList.length;i++) {
            //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
            var xDiff = this.clickCoordinates.x - this.shapesList[i].x;
            var yDiff = this.clickCoordinates.y - this.shapesList[i].y;

            var newX = point.x - xDiff;
			var newY = point.y - yDiff;
            console.log("old: "+this.shapesList[i].x+" "+this.shapesList[i].y);

            this.shapesList[i].setCoordinates({"x": newX, "y": newY});
            this.shapesList[i].recomputePoints();
            console.log("new: "+this.shapesList[i].x+" "+this.shapesList[i].y);
        }
        this.reset();
    }
};
