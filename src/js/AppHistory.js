//TODO: s'arranger pour ne pas que des actions soient lancées quand l'historique tourne.

function AppHistory(app) {
    this.app = app;
    this.steps = [];

    this.isRunning = false;
    this.runningState = null;
    this.stepData = null;

    //vaut true si une action de l'historique est en train d'être annulée.
}

/**
 * Ajouter une action/étape à l'historique.
 * @param {String} actionName   Le nom du type d'action
 * @param  {Object} data         Les données servant à annuler l'action. Celles-ci doivent pouvoir être sauvegardées au format JSON (donc pas de boucle de références)
 *
 */
AppHistory.prototype.addStep = function(actionName, data){
    if(this.isRunning) {
        console.log("AppHistory.addStep - erreur: une étape de l'historique est en cours d'annulation");
        return;
    }
    this.steps.push({
        'data': data,
        'actionName': actionName
    });
};

/**
 * Annule la dernière action de l'historique
 */
AppHistory.prototype.cancelLastStep = function () {
    if(this.isRunning || this.steps.length==0)
        return;
    if(this.app.state.name=="reverse_shape" && this.app.state.isReversing)
        return; //Ne pas laisser l'utilisateur annuler une action pendant l'animation.
    this.isRunning = true;

    var step = this.steps.pop(),
        that = this,
        f = function(){
            that.__cancelIsDone();
        };
    this.runningState = step.actionName;
    this.stepData = step.data;
    this.app.states[step.actionName].cancelAction(step.data, f);

};

AppHistory.prototype.__cancelIsDone = function(){
    this.isRunning = false;
    this.runningState = null;
    this.stepData = null;
    this.app.canvas.refreshBackgroundCanvas();
    this.app.canvas.refresh();
};
