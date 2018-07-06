/**
 * Cette classe permet d'ajouter une forme au canvas
 */
function CreateState(app) {
   State.call(this, app, "create_shape");

   //La famille sélectionnée dans le menu de gauche
   this.selectedFamily = null;

   //La forme que l'on souhaite ajouter
   this.selectedShape = null;
 }

App.heriter(CreateState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
CreateState.prototype.reset = function(){
  console.log("reseeet");
  this.selectedFamily = null;
  this.selectedShape = null;
};

/**
 * Annuler l'action en cours
 */
CreateState.prototype.abort = function(){};


/**
 * démarrer l'état
 */
CreateState.prototype.start = function(params){
  this.setFamily(params.family);
  this.setShape(params.shape);
  console.log("staaart");
  console.log(params);
  console.log(this.selectedFamily);
  console.log(this.selectedShape);
};

/**
 * Crée une forme aux coordonnées données
 * @param coordinates: {x: int, y: int}
 */
CreateState.prototype.click = function(coordinates) {

  console.log(this.selectedFamily);
  console.log(this.selectedShape);
  console.log(this);
	var shape = new Shape(
		this.selectedFamily.name, this.selectedShape.name,
		coordinates.x, coordinates.y,
		this.selectedShape.buildSteps, this.selectedShape.color);
	this.app.workspace.addShape(shape);
	this.app.getCanvas().refresh(coordinates);
};

/**
 * Défini la famille sélectionnée
 * @param family: objet de type Family
 */
CreateState.prototype.setFamily = function(family) {
  this.selectedFamily = family;
};

/**
 * Défini la forme sélectionnée
 * @param shape: objet de type Shape
 */
CreateState.prototype.setShape = function(shape) {
  this.selectedShape = shape;
};
