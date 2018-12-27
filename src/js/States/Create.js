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
    var size = this.app.settings.get('shapesSize');
    for(var i=0;i<params.shape.buildSteps.length;i++) {
        var step = params.shape.buildSteps[i];
        step.setCoordinates(step.x * size, step.y * size);
    }
    params.shape.refPoint.x *= size;
    params.shape.refPoint.y *= size;

    this.selectedFamily = params.family;
    this.selectedShape = params.shape;
    params.shape.recomputePoints();
};

/**
 * Crée une forme aux coordonnées données
 * @param coordinates: {x: int, y: int}
 */
CreateState.prototype.click = function(coordinates) {
    //move the shape ?
    var pointsNear = this.app.workspace.pointsNearPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1].getAbsoluteCoordinates();
        coordinates = {
            "x": last.x,
            "y": last.y
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
        this.app.settings.get('areShapesPointed'),
        this.app.settings.get('areShapesSided'),
        this.app.settings.get('shapesOpacity'));

    if(pointsNear.length==0 && this.app.settings.get('isGridShown')) {
        var t = this.app.workspace.getClosestGridPoint([shape]);
        var gridCoords = t.grid.getAbsoluteCoordinates(),
            shapeCoords = t.shape.getAbsoluteCoordinates();
        x += gridCoords.x - shapeCoords.x;
        y += gridCoords.y - shapeCoords.y;
        shape.setCoordinates({'x': x, 'y': y});
    }


    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1];
        shape.linkedShape = last.shape;
        var uGroup = this.app.workspace.getShapeGroup(last.shape, 'user');
        if(uGroup) {
            uGroup.push(shape);
        }
    }

    this.app.workspace.addShape(shape);
	this.app.canvas.refresh(coordinates);
    this.makeHistory(shape);
    this.__draw_counter = 0;
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
CreateState.prototype.draw = function(canvas, mouseCoordinates){
    //dessine la forme qui est en train d'être ajoutée
    if(this.__draw_counter===undefined) this.__draw_counter = 0;
    if(this.__draw_counter++<1) return;
    
    canvas.drawMovingShape(this.selectedShape, {
        "x": mouseCoordinates.x - this.selectedShape.refPoint.x,
        "y": mouseCoordinates.y - this.selectedShape.refPoint.y
    });

    //afficher le point sur lequel la forme va se coller le cas échéant
    var pointsNear = this.app.workspace.pointsNearPoint(new Point(mouseCoordinates.x, mouseCoordinates.y, null, null));
    if(pointsNear.length>0) {
        var last = pointsNear[pointsNear.length-1].getAbsoluteCoordinates();
        var pos = {"x": last.x, "y": last.y};
        canvas.drawPoint(pos, "#F00");
        canvas.drawCircle(pos, "#000", 6);
    }
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
CreateState.prototype.makeHistory = function(shape){
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
CreateState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
        console.log("CreateState.cancelAction: shape not found...");
        callback();
        return;
    }
    ws.removeShape(shape);
    callback();
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
CreateState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    return data;
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
