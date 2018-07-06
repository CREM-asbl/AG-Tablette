/**
 * This abstract class represents a possible state of the application
 */
function State(app, name) {
  this.app = app;
  this.name = name;
}

/**
 * Appelée lorsqu'un autre état va être lancé et qu'il faut annuler l'action en cours
 */
State.prototype.abort = function(){
  console.log("abort() not implemented");
};

/**
 * Appelée pour réinitialiser l'état (réinitialiser les valeurs des paramètres de l'état)
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
 * Appelée lorsque l'utilisateur clique sur le canvas
 */
State.prototype.click = function(){
  console.log("click() not implemented");
};
