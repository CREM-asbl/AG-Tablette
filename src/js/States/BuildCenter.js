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
BuildCenterState.prototype.click = function(coordinates, selection) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0 && !selection.shape)
        return;
    var shape = selection.shape ? selection.shape : list.pop();

    for(var i=0;i<shape.otherPoints.length;i++) {
        var pos = shape.otherPoints[i].getRelativeCoordinates();
        if(pos.x==0 && pos.y==0) {
            return;
        }
    }
    shape.otherPoints.push(new Point(0, 0, 'center', shape));
    this.makeHistory(shape);
	this.app.canvas.refresh(coordinates);
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
BuildCenterState.prototype.makeHistory = function(shape){
    var data = {
        'shape_id': shape.id
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
BuildCenterState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
        console.log("BuildCenterState.cancelAction: shape not found...");
        callback();
        return;
    }
    for(var i=0;i<shape.otherPoints.length;i++) {
        var pos = shape.otherPoints[i].getRelativeCoordinates();
        if(pos.x==0 && pos.y==0) {
            shape.otherPoints.splice(i, 1);
            callback();
            return;
        }
    }

    console.log("BuildCenterState.cancelAction: point not found...");
    callback();
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
BuildCenterState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [ overflownShape],
        'segments': [],
        'points': []
    };

    return data;
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
