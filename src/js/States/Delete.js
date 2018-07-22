/**
 * Cette classe permet de supprimer une forme du canvas
 */
function DeleteState(app) {
    this.app = app;
    this.name = "delete_shape";
 }

App.heriter(DeleteState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
DeleteState.prototype.reset = function(){
};

/**
 * démarrer l'état
 */
DeleteState.prototype.start = function(){};

/**
 * Supprime la forme aux coordonnées indiquées (s'il y en a une)
 * @param coordinates: {x: int, y: int}
 */
DeleteState.prototype.click = function(coordinates) {
    var list = window.app.workspace.shapesOnPoint(coordinates);
    if(list.length==0)
        return;
    var shape = list.pop(); //TODO: utiliser l'ordre d'affichage ?

    this.app.workspace.removeShape(shape);
	this.app.getCanvas().refresh(coordinates);
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
