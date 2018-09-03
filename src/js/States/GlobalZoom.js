/**
 * Cette classe permet de modifier le niveau de zoom du canvas
 */
function GlobalZoomState(app) {
    this.app = app;
    this.name = "global_zoom";

    //coordonnées de la souris lorsque le déplacement a commencé
    this.clickCoordinates = null;
    this.baseDistance = null;
    this.isZooming = false;
    this.originalZoomLevel = null;

}

App.heriter(GlobalZoomState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
GlobalZoomState.prototype.reset = function(){
    this.clickCoordinates = null;
    this.baseDistance = null;
    this.isZooming = false;
    this.originalZoomLevel = null;
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
GlobalZoomState.prototype.mousedown = function(point){
    this.isZooming = true;
    this.clickCoordinates = point;
    this.baseDistance = Math.sqrt( Math.pow(point.x, 2) + Math.pow(point.y, 2));
    this.originalZoomLevel = this.app.workspace.zoomLevel;
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
GlobalZoomState.prototype.mouseup = function(point){
    if(this.isZooming) {
        this.makeHistory(this.originalZoomLevel);
        this.reset();
    }
};

/**
 * Appelée par la fonction de dessin, avant avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
GlobalZoomState.prototype.updateZoomLevel = function(canvas, mouseCoordinates){
    var newDist = Math.sqrt( Math.pow(mouseCoordinates.x, 2) + Math.pow(mouseCoordinates.y, 2));
    var oldDist = this.baseDistance;

    if(newDist==0) newDist=0.001;
    if(oldDist==0) oldDist=0.001;

    var baseZoom = this.app.workspace.zoomLevel * newDist/oldDist;
    this.app.workspace.setZoomLevel(baseZoom, false);
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
GlobalZoomState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    return data;
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
GlobalZoomState.prototype.makeHistory = function(originalZoomLevel){
    var data = {
        'original_zoom': originalZoomLevel
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
GlobalZoomState.prototype.cancelAction = function(data, callback){
    this.app.workspace.setZoomLevel(data.original_zoom, true);
    callback();
};

/**
 * Annuler l'action en cours
 */
GlobalZoomState.prototype.abort = function(){}; //TODO: restaurer le zoom original ?

/**
 * démarrer l'état
 */
GlobalZoomState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
GlobalZoomState.prototype.click = function(){};
