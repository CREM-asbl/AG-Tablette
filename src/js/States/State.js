/**
 * Cette classe abstraite représente un état possible de l'application
 */
function State() {
    console.log("Error: State() should not be instancied");
    this.app = null;
    this.name = null;
}

/**
 * Appelée lorsqu'un autre état va être lancé et qu'il faut annuler l'action en cours
 */
State.prototype.abort = function(){
    console.log("abort() not implemented");
};

/**
 * Appelée pour réinitialiser l'état (réinitialiser les valeurs des variables d'instance de l'état)
 */
State.prototype.reset = function(){
    console.log("reset() not implemented");
};

/**
 * Appelée pour démarrer l'état
 * @param params: tableau associatif/objet pouvant contenir des paramètres
 */
State.prototype.start = function(params){
    console.log("start() not implemented");
};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 * @param coordinates: {x: int, y: int}
 * @param selection: {shape: Shape}. Objet sélectionné lors du clic.
 */
State.prototype.click = function(coordinates, selection){
    console.log("click() not implemented");
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
* @param coordinates: {x: int, y: int}
 */
State.prototype.mousedown = function(coordinates, selection){
    console.log("mousedown() not implemented");
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
* @param coordinates: {x: int, y: int}
 */
State.prototype.mouseup = function(coordinates, selection){
    console.log("mouseup() not implemented");
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
State.prototype.makeHistory = function(){
    console.log("makeHistory() not implemented");
    //this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
State.prototype.cancelAction = function(data, callback){
    console.log("cancelAction() not implemented");
    //callback();
};

/** //N'est pas utilisée dans la version tablette!
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @param {{'x': float, 'y': float}} clickCoordinates Les coordonnées de la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
State.prototype.getElementsToHighlight = function (overflownShape, clickCoordinates) {
    console.log("getElementsToHighlight() not implemented");
};
