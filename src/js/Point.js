

function Point(x, y, type, shape) {

    //Coordonnées relatives:
    this.x = x;
    this.y = y;

    this.type = type; //vertex (sommet), division (voir DivideState), grid (-> shape vaut null), center (BuildCenter)
    this.shape = shape; //La forme de référence.
    this.link = null; //Lien avec un autre point (si une forme est créée en cliquant sur le point d'une autre, lie ce point vers le point de l'autre forme).

    //Si le point est de type division, ces 2 points sont les extrémités du segment qui a été divisé.
    //Peuvent rester null (si c'est un cercle qui a été divisé)
    this.sourcepoint1 = null;
    this.sourcepoint2 = null;
}

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
