/**
 * Cette classe permet de déplacer une forme (ou un ensemble de formes liées) sur le canvas
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
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */ //TODO: au survol, entourer les formes que l'on va déplacer!
MoveState.prototype.mousedown = function(point){
    var list = window.app.workspace.shapesOnPoint(point);
    if(list.length>0) {
        this.isMoving = true;
        this.clickCoordinates = point;
        this.selectedShape = list.pop();
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
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
MoveState.prototype.mouseup = function(point){
    if(this.isMoving) {
        for(var i=0;i<this.shapesList.length;i++) {
            //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
            var xDiff = this.clickCoordinates.x - this.shapesList[i].x;
            var yDiff = this.clickCoordinates.y - this.shapesList[i].y;

            //nouvelles coordonnées de la forme: la position de la souris - le décalage.
            var newX = point.x - xDiff;
			var newY = point.y - yDiff;

            this.shapesList[i].setCoordinates({"x": newX, "y": newY});
            this.shapesList[i].recomputePoints();
        }
        this.reset();
    }
};

/**
 * Annuler l'action en cours
 */
MoveState.prototype.abort = function(){};

/**
 * démarrer l'état
 */
MoveState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
MoveState.prototype.click = function(){};
