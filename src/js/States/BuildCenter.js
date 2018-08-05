/**
 * Cette classe permet de rendre visible le centre d'une forme du canvas
 */
function BuildCenterState(app) {
    this.app = app;
    this.name = "build_shape_center";
}

App.heriter(BuildCenterState.prototype, State.prototype);

/**
 * Créer le centre de la forme aux coordonnées indiquées (s'il y en a une)
 * @param coordinates: {x: int, y: int}
 */
BuildCenterState.prototype.click = function(coordinates) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop(); //TODO: utiliser l'ordre d'affichage ?

    for(var i=0;i<shape.otherPoints.length;i++) {
        var pos = shape.otherPoints[i].getRelativeCoordinates();
        if(pos.x==0 && pos.y==0) {
            return;
        }
    }
    shape.otherPoints.push(new Point(0, 0, 'center', shape));
	this.app.canvas.refresh(coordinates);
};

/**
 * Annuler l'action en cours
 */
BuildCenterState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
BuildCenterState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
BuildCenterState.prototype.mouseup = function(){};

/**
 * Réinitialiser l'état
 */
BuildCenterState.prototype.reset = function(){};

/**
 * démarrer l'état
 */
BuildCenterState.prototype.start = function(){};
