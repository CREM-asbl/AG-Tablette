/**
 * Cette classe permet d'ajouter une forme au canvas
 */
function CreateState(app) {
    this.app = app;
    this.name = "create_shape";

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
};

/**
 * Crée une forme aux coordonnées données
 * @param coordinates: {x: int, y: int}
 */
CreateState.prototype.click = function(coordinates) {
    console.log(this);
    var pointsNear = this.app.workspace.pointsNearPoint(coordinates);
    if(pointsNear.length>0) {
        console.log("points near found!");
        var last = pointsNear[pointsNear.length-1];
        coordinates = {
            "x": last.absX,
            "y": last.absY
        };
    }

	var shape = new Shape(
		this.selectedFamily.name, this.selectedShape.name,
		coordinates.x, coordinates.y,
		this.selectedShape.buildSteps, this.selectedShape.color);


    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1];
        shape.linkedShape = last.shape;
        //lier le point correspondant dans la nouvelle forme à ce point
        var linked = false;
        for(var i=0;i<shape.points.length;i++) {
            if(shape.points[i].x==0 && shape.points[i].y==0) {
                linked = true;
                shape.points[i].link = last;
            }
        }
        if(linked==false) {
            console.log("CreateState.click() error: point of the new shape to link with the other shape has not been found");
        }
    }

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



CreateState.prototype.mousedown = function(){};
CreateState.prototype.mouseup = function(){};
