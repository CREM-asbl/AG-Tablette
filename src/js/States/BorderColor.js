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
    var list = window.app.workspace.shapesOnPoint(coordinates);
    if(list.length>0) {
        var shape = list.pop();
        shape.borderColor = this.selectedColor;
    }
	this.app.getCanvas().refresh(coordinates);
};

/**
 * Défini la couleur sélectionnée
 * @param color: la couleur ("#xxxxxx")
 */
BorderColorState.prototype.setColor = function(color) {
  this.selectedColor = color;
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
