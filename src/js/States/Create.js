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
    //update the shape size:
    var size = this.app.workspace.shapesSize;
    for(var i=0;i<params.shape.buildSteps.length;i++) {
        var step = params.shape.buildSteps[i];
        step.x *= size;
        step.y *= size;
    }
    params.shape.refPoint.x *= size;
    params.shape.refPoint.y *= size;

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

    var buildStepsCopy = [];
    for(var i=0;i<this.selectedShape.buildSteps.length;i++) {
        buildStepsCopy.push(this.selectedShape.buildSteps[i].getCopy());
    }

	var shape = new Shape(
		this.selectedFamily.name, this.selectedShape.name,
		x, y,
		buildStepsCopy, this.selectedShape.color, "#000",
        {"x": this.selectedShape.refPoint.x, "y": this.selectedShape.refPoint.y},
        this.app.workspace.areShapesPointed,
        this.app.workspace.areShapesSided,
        this.app.workspace.shapesOpacity);


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
	this.app.canvas.refresh(coordinates);
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
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
CreateState.prototype.draw = function(canvas, mouseCoordinates){
    //dessine la forme qui est en train d'être ajoutée

    canvas.drawMovingShape(this.selectedShape, {
        "x": mouseCoordinates.x - this.selectedShape.refPoint.x,
        "y": mouseCoordinates.y - this.selectedShape.refPoint.y
    });

    //afficher le point sur lequel la forme va se coller le cas échéant
    var pointsNear = canvas.app.workspace.pointsNearPoint(mouseCoordinates);
    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1];
        var pos = {"x": last.absX, "y": last.absY};
        canvas.drawPoint(pos, "#F00");
        canvas.drawCircle(pos, "#000", 6);
    }
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
