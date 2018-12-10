/**
 * Cette classe permet de délier un groupe de formes.
 */
function UnlinkerState(app) {
    this.app = app;
    this.name = "unlink_shapes";
}

App.heriter(UnlinkerState.prototype, State.prototype);

/**
 * Ajoute une forme au groupe (si on clique sur une forme)
 * @param coordinates: {x: int, y: int}
 */
UnlinkerState.prototype.click = function(coordinates) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop();


    var uGroup = this.app.workspace.getShapeGroup(shape, 'user');
    if(!uGroup)
        return;

    var index = this.app.workspace.getGroupIndex(uGroup, 'user');
    this.app.workspace.userShapeGroups.splice(index, 1);

    var uGroupIds = uGroup.map(function(val){ return val.id; });
    this.makeHistory(uGroupIds);

    this.app.canvas.refresh(coordinates);
    return;
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné une forme
 * @param canvas: référence vers la classe Canvas
 * @param mouseCoordinates: coordonnées de la souris
 * @param shape: objet Shape
 */
UnlinkerState.prototype.draw = function(canvas, mouseCoordinates, shape){
    //affiche les user-groups sur les formes (texte)

    var group = this.app.workspace.getShapeGroup(shape, 'user');
    var pos = {"x": shape.x - 25, "y": shape.y};
    if(group!==null) {
        var groupIndex = this.app.workspace.getGroupIndex(group, 'user');
        canvas.drawText("Groupe "+(groupIndex+1), pos, '#000');
    }
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
UnlinkerState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    var uGroup = this.app.workspace.getShapeGroup(overflownShape, 'user');
    if(uGroup) {
        data.shapes = uGroup
    }

    return data;
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
UnlinkerState.prototype.makeHistory = function(deletedGroup){
    var data = {
        'deleted_group': deletedGroup
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
UnlinkerState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shapes = [];
    for(var i=0;i<data.deleted_group.length;i++) {
        var shape = ws.getShapeById(data.deleted_group[i]);
        if(!shape) {
            console.error("UnlinkerState.cancelAction: shape not found...");
            callback();
            return;
        }
        shapes.push(shape);
    }
    this.app.workspace.userShapeGroups.push(shapes);

    callback();
};

/**
 * Réinitialiser l'état
 */
UnlinkerState.prototype.reset = function(){};

/**
 * démarrer l'état
 */
UnlinkerState.prototype.start = function(){};

/**
 * Annuler l'action en cours
 */
UnlinkerState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
UnlinkerState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
UnlinkerState.prototype.mouseup = function(){};
