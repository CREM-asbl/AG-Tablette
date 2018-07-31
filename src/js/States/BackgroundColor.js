/**
 * Cette classe permet de modifier la couleur de fond de formes
 */
function BackgroundColorState(app) {
    this.app = app;
    this.name = "background_color";

    //La couleur sélectionnée
    this.selectedColor = null;
}

App.heriter(BackgroundColorState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
BackgroundColorState.prototype.reset = function(){
    this.selectedColor = null;
};

/**
 * démarrer l'état
 */
BackgroundColorState.prototype.start = function(){
    var that = this;
    this.app.colorpicker.start(function(color){
        that.setColor(color);
    });
};

/**
 * Colorie la forme
 * @param coordinates: {x: int, y: int}
 */
BackgroundColorState.prototype.click = function(coordinates) {
    if(this.selectedColor == null)
        return;
    var list = window.app.workspace.shapesOnPoint(coordinates);
    if(list.length>0) {
        var shape = list.pop();
        shape.color = this.selectedColor;
    }
	this.app.canvas.refresh(coordinates);
};

/**
 * Défini la couleur sélectionnée
 * @param color: la couleur ("#xxxxxx")
 */
BackgroundColorState.prototype.setColor = function(color) {
    this.selectedColor = color;
};

/**
 * Annuler l'action en cours
 */
BackgroundColorState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
BackgroundColorState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
BackgroundColorState.prototype.mouseup = function(){};
