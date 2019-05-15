/**
 * Cette classe abstraite représente un état possible de l'application
 * // Todo :  est-elle encore utile ?
 */
class State {
    constructor() {
        this.app = null;
        this.name = null;
    }

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
     * Appelée lorsque l'événement click est déclanché sur le canvas
     * @param coordinates: {x: int, y: int}
     * @param selection: {shape: Shape}. Objet sélectionné lors du clic.
     */
    click(coordinates, selection) {
        console.log("click() not implemented");
    };

    /**
    * Appelée lorsque l'événement mousedown est déclanché sur le canvas
    * @param coordinates: {x: int, y: int}
     */
    mousedown(coordinates, selection) {
        console.log("mousedown() not implemented");
    };

    /**
    * Appelée lorsque l'événement mouseup est déclanché sur le canvas
    * @param coordinates: {x: int, y: int}
     */
    mouseup(coordinates, selection) {
        console.log("mouseup() not implemented");
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
