

function Point(x, y, type, shape) {

    //Coordonnées relatives:
    this.x = x;
    this.y = y;

    this.type = type; //vertex (sommet), division (voir DivideState), grid (-> shape vaut null), center (BuildCenter)
    this.shape = shape; //La forme de référence.
    this.uniqId = window.app.uniqId();

    //Si le point est de type division, ces 2 points sont les extrémités du segment qui a été divisé.
    //Peuvent rester null (si c'est un cercle qui a été divisé par exemple)
    this.sourcepoint1 = null;
    this.sourcepoint2 = null;
}

/**
 * Méthode statique. Crée un objet Point à partir d'une sauvegarde (getSaveData).
 * @param  {Object} saveData les données de sauvegarde
 * @return {Point}          le nouvel objet
 */
Point.createFromSaveData = function(saveData) {
    var ws = window.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
        console.log("Point.createFromSaveData: shape not found...");
        return;
    }
	var point = new Point(saveData.x, saveData.y, saveData.type, shape);
    point.uniqId = saveData.uniqId;

    //sourcepoint1:
    shape = ws.getShapeById(data.sourcepoint1.shape_id);
    if(!shape) {
        console.log("Point.createFromSaveData: shape not found... (2)");
        return;
    }
    var sourcepoint1 = shape.getPointByUniqId(data.sourcepoint1.uniq_id);
    if(!sourcepoint1) {
        console.log("Point.createFromSaveData: point not found...");
        return;
    }
    point.sourcepoint1 = sourcepoint1;

    //sourcepoint2:
    shape = ws.getShapeById(data.sourcepoint2.shape_id);
    if(!shape) {
        console.log("Point.createFromSaveData: shape not found... (3)");
        return;
    }
    var sourcepoint2 = shape.getPointByUniqId(data.sourcepoint2.uniq_id);
    if(!sourcepoint2) {
        console.log("Point.createFromSaveData: point not found... (2)");
        return;
    }
    point.sourcepoint2 = sourcepoint2;

    return point;
}

/**
 * Renvoie toutes les informations nécessaires pour recréer ce Point. L'information nécessaire doit pouvoir être encodée en JSON.
 * @return {Object} les données sur le point.
 */
Point.prototype.getSaveData = function(){
    //sourcepoints:
    var sourcepoint1 = null;
    if(this.sourcepoint1) {
        sourcepoint1 = {
            'shape_id': this.sourcepoint1.shape.id,
            'uniq_id': this.sourcepoint1.uniqId
        };
    }
    var sourcepoint2 = null;
    if(this.sourcepoint2) {
        sourcepoint2 = {
            'shape_id': this.sourcepoint2.shape.id,
            'uniq_id': this.sourcepoint2.uniqId
        };
    }

	return {
		'type': this.type,
		'x': this.x,
		'y': this.y,
		'shape': this.shape,
        'uniq_id': this.uniqId,
		'sourcepoint1': sourcepoint1,
		'sourcepoint2': sourcepoint2
	};
};

Point.prototype.setCoordinates = function(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype.getRelativeCoordinates = function(){
    return {'x': this.x, 'y': this.y};
};

Point.prototype.getAbsoluteCoordinates = function(){
    if(!this.shape)
        return this.getRelativeCoordinates();
    var shapePos = this.shape.getCoordinates();
    return {'x': shapePos.x + this.x, 'y': shapePos.y + this.y};
};
