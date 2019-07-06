/**
 * Cette classe abstraite représente un état possible de l'application
 */
export class State {
    constructor(name) {
        if(this.constructor === State) {
            throw new TypeError('Abstract class "State" cannot be instantiated directly');
        }
        this.name = name;
    }





    //Événements:
    /*
    onClick(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onMouseDown(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onMouseUp(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onMouseMove(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onTouchStart(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onTouchMove(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onTouchEnd(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onTouchLeave(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    onTouchCancel(mouseCoordinates, event) { throw new TypeError("method not implemented"); }
    */




    //TODO: vérifier ces fonctions.
    /**
     * Appelée lorsqu'un autre état va être lancé et qu'il faut annuler l'action en cours
     */
    abort() {
        console.log("abort() not implemented");
    };

    /**
     * Appelée pour réinitialiser l'état (réinitialiser les valeurs des variables d'instance de l'état)
     */
    reset() {
        console.log("reset() not implemented");
    };

    /**
     * Appelée pour démarrer l'état
     * @param params: tableau associatif/objet pouvant contenir des paramètres
     */
    start(params) {
        console.log("start() not implemented");
    };

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory() {
        console.log("makeHistory() not implemented");
        //this.app.workspace.history.addStep(this.name, data);
    };

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        console.log("cancelAction() not implemented");
        //callback();
    };

    /** //N'est pas utilisée dans la version tablette!
     * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
     * @param  {Shape} overflownShape La forme qui est survolée par la souris
     * @param {{'x': float, 'y': float}} clickCoordinates Les coordonnées de la souris
     * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
     */
    getElementsToHighlight(overflownShape, clickCoordinates) {
        console.log("getElementsToHighlight() not implemented");
    }
}
