/**
 * Représente la souris virtuelle, un outil d'aide à la sélection de formes.
 */

/**
 * Constructeur
 * @param app: Référence vers l'application (App)
 */
function VirtualMouse(app) {
    this.app = app;

    //True si la souris virtuelle est activée (et donc visible à l'écran), false sinon.
    this.isShown = false; //TODO: transformer ça en paramètre de l'app ? ou pas?

    //Taille de la souris virtuelle (float).
    this.size = 1.5; //TODO: transformer ça en paramètre de l'app
    // this.app.settings.get('virtualMouseSize')

    //Coordonnées de la souris virtuelle.
    this.position = {
        'x': 0,
        'y': 0
    };

    //Coordonnées des sommets de la souris. Ne pas utiliser directement!
    this.coordinates = [
        {'x': 0, 'y': 0},
        {'x': 30, 'y': 10},
        {'x': 15, 'y': 10},
        {'x': 20, 'y': 15},
        {'x': 60, 'y': 15},
        {'x': 60, 'y': 60},
        {'x': 15, 'y': 60},
        {'x': 15, 'y': 20},
        {'x': 10, 'y': 15},
        {'x': 10, 'y': 30},
        {'x': 0, 'y': 0}
    ];

    //True si la souris virtuelle est en train d'être déplacée
    this.isMoving = false;

    this.movingData = {
        'startPos': null
    };
}

/**
 * Cette méthode est appelée lorsque l'utilisateur clique sur la souris.
 * @param  {{'x': float, 'y': float}} coords coordonnées de la souris
 */
VirtualMouse.prototype.click = function (coords) {

};

/**
 * Cette méthode est appelée lorsque l'événement mousedown est appelé sur la souris
 * @param  {{'x': float, 'y': float}} coords coordonnées de la souris
 */
VirtualMouse.prototype.mousedown = function (coords) {
    this.isMoving = true;
    this.movingData.startPos = coords;
    this.movingData.initialState = this.app.state.name;

    this.app.setState("no_state");
};

/**
 * Cette méthode est appelée lorsque l'événement mouseup est appelé sur la souris
 * @param  {{'x': float, 'y': float}} coords coordonnées de la souris
 */
VirtualMouse.prototype.mouseup = function (coords) {
    this.isMoving = false;
    this.position = {
        'x': this.position.x + coords.x - this.movingData.startPos.x,
        'y': this.position.y + coords.y - this.movingData.startPos.y
    };
    if(this.movingData.initialState)
        this.app.setState(this.movingData.initialState, undefined, {'do_reset': false, 'do_start': false});
};

/**
 * Calcule et renvoie les coordonnées des sommets de la souris
 * @return {[{'x': float, 'y': float}]} Tableau des coordonnées
 */
VirtualMouse.prototype.getCoordinates = function(){
    var size = this.size;

    if(size === this._getCoordinates_size && this._getCoordinates_coords)
        return this._getCoordinates_coords;

    this._getCoordinates_size = size;
    this._getCoordinates_coords = this.coordinates.map(function(val){
        return {'x': val.x*size, 'y': val.y*size};
    });
    return this._getCoordinates_coords;
};

/**
 * Renvoie true si le point est situé sur la souris, false sinon.
 * @param  {{'x': float, 'y': float}} point coordonnées du point
 * @return {boolean}                        true si le point est sur la souris
 */
VirtualMouse.prototype.isPointOnMouse = function(point){
    var vMousePos = this.getPosition(),
        pointAbsCoords = point.getAbsoluteCoordinates();
    //calculer les coordonnées relatives du point
	point = {"x": pointAbsCoords.x - vMousePos.x, "y": pointAbsCoords.y - vMousePos.y};

    return window.app.isPointInPolygon(this.getCoordinates(), point);
};

/**
 * Renvoie les coordonnées de la souris
 * @return {{'x': float, 'y': float}} position de la souris
 */
VirtualMouse.prototype.getPosition = function(){
    return {'x': this.position.x, 'y': this.position.y};
};

/**
 * Activer/ouvrir la souris virtuelle.
 */
VirtualMouse.prototype.show = function(){
    this.isShown = true;
    this.position.x = 100;
    this.position.y = 100;

    this.app.canvas.refresh();
};

/**
 * Désactiver/fermer la souris virtuelle.
 */
VirtualMouse.prototype.hide = function(){
    this.isShown = false;
    this.app.canvas.refresh();
};

/**
 * Cette méthode est appelée lorsque la fenêtre du navigateur est redimensionnée
 * ou lorsque le plan est translaté.
 * La souris virtuelle, lorsqu'elle est affichée (isShown), doit toujours être
 * visible à l'écran. Lorsque la fenêtre du navigateur est rétrécie, il est
 * possible que la souris devienne invisible à l'écran (car elle serait en
 * dehors de l'écran). Cette méthode se charge de déplacer si nécessaire la
 * souris virtuelle afin qu'elle soit visible.
 */
VirtualMouse.prototype.adaptMousePosition = function() {
    //TODO à implémenter.
    //TODO devrait être appelée quand on zoom/translate le plan non?
};
