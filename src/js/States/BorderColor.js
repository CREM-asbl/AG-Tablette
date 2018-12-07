/**
 * Cette classe permet de modifier la couleur de fond de formes
 */
function BorderColorState(app) {
    this.app = app;
    this.name = "border_color";

   //La couleur sélectionnée
   this.selectedColor = null;
}

App.heriter(BorderColorState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
BorderColorState.prototype.reset = function(){
    this.selectedColor = null;
};

/**
 * démarrer l'état
 */
BorderColorState.prototype.start = function(){
    var that = this;
    this.app.colorpicker.start(function(color){
        that.setColor(color);
    });
};

/**
 * Colorie les bords de la forme
 * @param coordinates: {x: int, y: int}
 */
BorderColorState.prototype.click = function(coordinates) {
    if(this.selectedColor == null)
        return;
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length>0) {
        var shape = list.pop(),
            oldColor = shape.borderColor;
        shape.borderColor = this.selectedColor;
        this.app.canvas.refresh(coordinates);
        this.makeHistory(shape, oldColor);
    }

};

/**
 * Défini la couleur sélectionnée
 * @param color: la couleur ("#xxxxxx")
 */
BorderColorState.prototype.setColor = function(color) {
    this.selectedColor = color;
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
BorderColorState.prototype.makeHistory = function(shape, oldColor){
    var data = {
        'shape_id': shape.id,
        'old_color': oldColor
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
BorderColorState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
        console.log("BorderColorState.cancelAction: shape not found...");
        callback();
        return;
    }
    shape.borderColor = data.old_color;
    callback();
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
BorderColorState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [overflownShape],
        'segments': [],
        'points': []
    };

    return data;
};

/**
 * Annuler l'action en cours
 */
BorderColorState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
BorderColorState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
BorderColorState.prototype.mouseup = function(){};
