/**
 * Cette classe permet de déplacer le plan (le canvas)
 */
class MovePlaneState {
    constructor() {
        this.name = "moveplane_state";

        //coordonnées de la souris lorsque le déplacement a commencé
        this.clickCoordinates = null;

        this.isMoving = false;

        this.originalOffset = null;
    }

    /**
     * Réinitialiser l'état
     */
    reset() {
        this.clickCoordinates = null;
        this.isMoving = false;
        this.originalOffset = null;
    }

    /**
    * Appelée lorsque l'événement mousedown est déclanché sur le canvas
     */
    mousedown(point) {
        this.clickCoordinates = point;
        this.clickCoordinatesWithoutOffset = { 'x': this.clickCoordinates.x + app.workspace.translateOffset.x, 'y': this.clickCoordinates.y + app.workspace.translateOffset.y }
        this.isMoving = true;
        this.originalOffset = { 'x': app.workspace.translateOffset.x, 'y': app.workspace.translateOffset.y }
    }


    /**
     * Appelée par la fonction de dessin, avant avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    updateOffset(canvas, mouseCoordinates) {

        var mCoords = { 'x': mouseCoordinates.x + app.workspace.translateOffset.x, 'y': mouseCoordinates.y + app.workspace.translateOffset.y }

        var x = this.originalOffset.x + (mCoords.x - this.clickCoordinatesWithoutOffset.x),
            y = this.originalOffset.y + (mCoords.y - this.clickCoordinatesWithoutOffset.y);

        app.workspace.translateOffset = { 'x': x, 'y': y }
    }


    /**
    * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     */
    mouseup(point) {
        if (!this.isMoving)
            return;

        this.isMoving = false;
        this.makeHistory(this.originalOffset); //TODO
        this.reset();
        app.canvas.refresh();

    }

    /**
     * Appelée par la fonction de dessin, après avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    draw(canvas, mouseCoordinates) { }

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory(originalOffset) {
        var data = {
            'originalOffset': originalOffset
        }
        app.workspace.history.addStep(this.name, data);
    }

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        app.workspace.translateOffset = { 'x': data.originalOffset.x, 'y': data.originalOffset.y }

        callback();
    }

    /**
     * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
     * @param  {Shape} overflownShape La forme qui est survolée par la souris
     * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
     */
    getElementsToHighlight(overflownShape) {
        var data = {
            'shapes': [],
            'segments': [],
            'points': []
        }

        var uGroup = app.workspace.getShapeGroup(overflownShape, 'user');
        var sGroup = app.workspace.getShapeGroup(overflownShape, 'system');
        if (uGroup) {
            data.shapes = uGroup
        } else if (sGroup) {
            data.shapes = sGroup;
        } else {
            data.shapes.push(overflownShape);
        }

        return data;
    }

    /**
     * Annuler l'action en cours
     */
    abort() { } //TODO?

    /**
     * démarrer l'état
     */
    start() { }

    /**
     * Appelée lorsque l'événement click est déclanché sur le canvas
     */
    click() { }
}
// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => app.states.moveplane_state = new MovePlaneState())