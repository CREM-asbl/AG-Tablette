/**
 * Cette classe permet de modifier la couleur de fond de formes
 */
function BorderColorState(app) {
    this.app = app;
    this.name = "border_color";

   //La couleur sélectionnée
   this.selectedColor = null;
}

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
    //Fix Edge (click ne fonctionne pas directement sur le input)
    document.querySelector("#color-picker-label").click()
};

/**
 * Colorie les bords de la forme
 * @param coordinates: {x: int, y: int}
 */
BorderColorState.prototype.click = function(coordinates, selection) {
    
    this.selectedColor = document.querySelector('#color-picker').value 

    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(selection.shape || list.length>0) {
        var shape = selection.shape ? selection.shape : list.pop()
        let uGroup = this.app.workspace.getShapeGroup(shape, 'user') || [shape]
        let history = []
        uGroup.forEach(s => {
            history.push({
                'shape_id': s.id,
                'old_color': s.borderColor
            })
            s.borderColor = this.selectedColor
        })
        this.app.canvas.refresh(coordinates)
        this.makeHistory(history)
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
BorderColorState.prototype.makeHistory = function(history){
    this.app.workspace.history.addStep(this.name, history);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
BorderColorState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    data.forEach(modification => {
        var shape = ws.getShapeById(modification.shape_id)
        if (!shape) {
            console.log("BackgroundColorState.cancelAction: shape not found...");
        }
        shape.borderColor = modification.old_color;
    })
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
