/**
 * Cette classe permet de supprimer une forme du canvas
 */
function DeleteState(app) {
    this.app = app;
    this.name = "delete_shape";
 }

App.heriter(DeleteState.prototype, State.prototype);

/**
 * Supprime la forme aux coordonnées indiquées (s'il y en a une)
 * @param coordinates: {x: int, y: int}
 */
DeleteState.prototype.click = function(coordinates) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop(); //TODO: utiliser l'ordre d'affichage ?
    //TODO: au survol, entourer les formes que l'on va supprimer!

    this.app.workspace.removeShape(shape);
	this.app.canvas.refresh(coordinates);
};

/**
 * Annuler l'action en cours
 */
DeleteState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
DeleteState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
DeleteState.prototype.mouseup = function(){};

/**
 * Réinitialiser l'état
 */
DeleteState.prototype.reset = function(){};

/**
 * démarrer l'état
 */
DeleteState.prototype.start = function(){};
