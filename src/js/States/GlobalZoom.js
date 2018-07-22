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

 }

App.heriter(GlobalZoomState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
GlobalZoomState.prototype.reset = function(){
    this.clickCoordinates = null;
    this.baseDistance = null;
    this.isZooming = false;
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
GlobalZoomState.prototype.mousedown = function(point){
    this.isZooming = true;
    this.clickCoordinates = point;
    this.baseDistance = Math.sqrt( Math.pow(point.x, 2) + Math.pow(point.y, 2));
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
GlobalZoomState.prototype.mouseup = function(point){
    if(this.isZooming) {
        //this.app.workspace.
        this.reset();
    }
};

/**
 * Annuler l'action en cours
 */
GlobalZoomState.prototype.abort = function(){};

/**
 * démarrer l'état
 */
GlobalZoomState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
GlobalZoomState.prototype.click = function(){};
