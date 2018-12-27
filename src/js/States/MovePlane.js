/**
 * Cette classe permet de déplacer le plan (le canvas)
 */
function MovePlaneState(app) {
    this.app = app;
    this.name = "moveplane_state";

    //coordonnées de la souris lorsque le déplacement a commencé
    this.clickCoordinates = null;

    this.isMoving = false;

    this.originalOffset = null;
}

App.heriter(MovePlaneState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
MovePlaneState.prototype.reset = function(){
    this.clickCoordinates = null;
    this.isMoving = false;
    this.originalOffset = null;
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
MovePlaneState.prototype.mousedown = function(point){
    this.clickCoordinates = point;
    this.clickCoordinatesWithoutOffset = {'x': this.clickCoordinates.x+this.app.workspace.translateOffset.x, 'y': this.clickCoordinates.y+this.app.workspace.translateOffset.y};
    this.isMoving = true;
    this.originalOffset = {'x': this.app.workspace.translateOffset.x, 'y': this.app.workspace.translateOffset.y};
};


/**
 * Appelée par la fonction de dessin, avant avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
MovePlaneState.prototype.updateOffset = function(canvas, mouseCoordinates){

    var mCoords = {'x': mouseCoordinates.x+this.app.workspace.translateOffset.x, 'y': mouseCoordinates.y+this.app.workspace.translateOffset.y};

    var x = this.originalOffset.x + (mCoords.x-this.clickCoordinatesWithoutOffset.x),
        y = this.originalOffset.y + (mCoords.y-this.clickCoordinatesWithoutOffset.y);

    this.app.workspace.translateOffset = {'x': x, 'y': y};
};


/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
MovePlaneState.prototype.mouseup = function(point){
    if(!this.isMoving)
        return;

    this.isMoving = false;
    this.makeHistory(this.originalOffset); //TODO
    this.reset();
    this.app.canvas.refresh();

};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
MovePlaneState.prototype.draw = function(canvas, mouseCoordinates){};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
MovePlaneState.prototype.makeHistory = function(originalOffset){
    var data = {
        'originalOffset': originalOffset
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
MovePlaneState.prototype.cancelAction = function(data, callback){
    this.app.workspace.translateOffset = {'x': data.originalOffset.x, 'y': data.originalOffset.y};

    callback();
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
MovePlaneState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    var uGroup = this.app.workspace.getShapeGroup(overflownShape, 'user');
    var sGroup = this.app.workspace.getShapeGroup(overflownShape, 'system');
    if(uGroup) {
        data.shapes = uGroup
    } else if(sGroup) {
        data.shapes = sGroup;
    } else {
        data.shapes.push(overflownShape);
    }

    return data;
};

/**
 * Annuler l'action en cours
 */
MovePlaneState.prototype.abort = function(){}; //TODO?

/**
 * démarrer l'état
 */
MovePlaneState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
MovePlaneState.prototype.click = function(){};
