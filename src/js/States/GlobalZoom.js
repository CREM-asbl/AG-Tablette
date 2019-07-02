import { distanceBetweenTwoPoints } from "../Geometry";

/**
 * Cette classe permet de modifier le niveau de zoom du canvas
 */

class GlobalZoomState {

    constructor() {
        this.name = "global_zoom";

        //coordonnées de la souris lorsque le déplacement a commencé
        this.clickCoordinates = null;
        this.baseDistance = null;
        this.isZooming = false;
        this.originalZoomLevel = null;
        addEventListener('touchmove', this.touchMove.bind(this))
        addEventListener('touchend', this.touchEnd.bind(this))
    }

    /**
     * Réinitialiser l'état
     */
    reset() {
        this.clickCoordinates = null;
        this.baseDistance = null;
        this.isZooming = false;
        this.originalZoomLevel = null;
    };

    /**
    * Appelée lorsque l'événement mousedown est déclanché sur le canvas
     */
    mousedown(point) {
        this.isZooming = true;
        this.clickCoordinates = point;
        this.baseDistance = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
        this.originalZoomLevel = app.workspace.zoomLevel;
    };

    /**
    * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     */
    mouseup(point) {
        if (this.isZooming) {
            this.makeHistory(this.originalZoomLevel);
            this.reset();
        }
    };

    /**
     * Appelée par la fonction de dessin, avant avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    updateZoomLevel(mouseCoordinates) {
        var newDist = Math.sqrt(Math.pow(mouseCoordinates.x, 2) + Math.pow(mouseCoordinates.y, 2));
        var oldDist = this.baseDistance;

        if (newDist == 0) newDist = 0.001;
        if (oldDist == 0) oldDist = 0.001;

        var baseZoom = app.workspace.zoomLevel * newDist / oldDist;
        app.workspace.setZoomLevel(baseZoom, false);
    };

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
        };

        return data;
    };

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory(originalZoomLevel) {
        var data = {
            'original_zoom': originalZoomLevel
        };
        app.workspace.history.addStep(this.name, data);
    };

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        app.workspace.setZoomLevel(data.original_zoom, true);
        callback();
    };

    /**
     * Annuler l'action en cours
     */
    abort() { }; //TODO: restaurer le zoom original ?

    /**
     * démarrer l'état
     */
    start() { };

    /**
     * Appelée lorsque l'événement click est déclanché sur le canvas
     */
    click() { };

    touchMove(event) {
        if (event.touches.length === 2) {
            let point1 = { x: event.touches[0].clientX, y: event.touches[0].clientY }
            let point2 = { x: event.touches[1].clientX, y: event.touches[1].clientY }
            let distance = distanceBetweenTwoPoints(point1, point2)
            if (!this.baseDistance) {
                app.setState('no_state')
                this.isZooming = true
                this.originalZoomLevel = app.workspace.zoomLevel
                this.baseDistance = distance
                return
            }
            let ratio = (distance / this.baseDistance) * this.originalZoomLevel
            console.log(`${distance}, ${this.baseDistance}, ${this.originalZoomLevel} => ${ratio}`)
            app.workspace.setZoomLevel(ratio, false);
        }
    }

    touchEnd() {
        if (this.isZooming) {
            this.makeHistory(this.originalZoomLevel)
            this.reset();
        }
    }
}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => window.app.states.global_zoom = new GlobalZoomState())