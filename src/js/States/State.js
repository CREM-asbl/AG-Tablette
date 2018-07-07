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
 */
State.prototype.click = function(){
    console.log("click() not implemented");
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
State.prototype.mousedown = function(){
    console.log("mousedown() not implemented");
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
State.prototype.mouseup = function(){
    console.log("mouseup() not implemented");
};
