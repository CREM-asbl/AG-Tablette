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
 * démarrer l'état
 * @param params: {family: Family, shape: Shape}
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
    var pointsNear = this.app.workspace.pointsNearPoint(coordinates);
    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1];
        coordinates = {
            "x": last.absX,
            "y": last.absY
        };
    }
    //coordonnées de la forme: ajouter le décalage entre le centre et le point de référence.
    //les coordonnées de base sont celles du point en bas à gauche, et non celles
    //du centre de la forme.
    var x = coordinates.x-this.selectedShape.refPoint.x;
    var y = coordinates.y-this.selectedShape.refPoint.y;

	var shape = new Shape(
		this.selectedFamily.name, this.selectedShape.name,
		x, y,
		this.selectedShape.buildSteps, this.selectedShape.color,
        {"x": this.selectedShape.refPoint.x, "y": this.selectedShape.refPoint.y});


    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1];
        shape.linkedShape = last.shape;
        //lier le point correspondant dans la nouvelle forme à ce point
        var linked = false;
        for(var i=0;i<shape.points.length;i++) {
            if(shape.points[i].x-this.selectedShape.refPoint.x==0 && shape.points[i].y-this.selectedShape.refPoint.y==0) {
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

/**
 * Annuler l'action en cours
 */
CreateState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
 CreateState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
 CreateState.prototype.mouseup = function(){};
