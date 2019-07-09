import {Point} from '../Point'
/**
 * Cette classe permet de délier un groupe de formes.
 */
class UnlinkerState {
    constructor() {
        this.name = "ungroup_shapes";
    }

    /**
     * Ajoute une forme au groupe (si on clique sur une forme)
     * @param coordinates: {x: int, y: int}
     */
    click(coordinates, selection) {
        var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
        if (list.length == 0 && !selection.shape)
            return;
        var shape = selection.shape ? selection.shape : list.pop();

        var uGroup = app.workspace.getShapeGroup(shape, 'user');
        if (!uGroup)
            return;

        var index = app.workspace.getGroupIndex(uGroup, 'user');
        app.workspace.userShapeGroups.splice(index, 1);

        var uGroupIds = uGroup.map(function (val) { return val.id; });
        this.makeHistory(uGroupIds);

        app.canvas.refresh(coordinates);
        return;
    }

    /**
     * Appelée par la fonction de dessin, après avoir dessiné une forme
     * @param canvas: référence vers la classe Canvas
     * @param mouseCoordinates: coordonnées de la souris
     * @param shape: objet Shape
     */
    draw(canvas, mouseCoordinates, shape) {
        //affiche les user-groups sur les formes (texte)

        var group = app.workspace.getShapeGroup(shape, 'user');
        var pos = { "x": shape.x - 25, "y": shape.y }
        if (group !== null) {
            var groupIndex = app.workspace.getGroupIndex(group, 'user');
            canvas.drawText("Groupe " + (groupIndex + 1), pos, '#000');
        }
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
        if (uGroup) {
            data.shapes = uGroup
        }

        return data;
    }

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory(deletedGroup) {
        var data = {
            'deleted_group': deletedGroup
        }
        app.workspace.history.addStep(this.name, data);
    }

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        var ws = app.workspace;
        var shapes = [];
        for (var i = 0; i < data.deleted_group.length; i++) {
            var shape = ws.getShapeById(data.deleted_group[i]);
            if (!shape) {
                console.error("UnlinkerState.cancelAction: shape not found...");
                callback();
                return;
            }
            shapes.push(shape);
        }
        app.workspace.userShapeGroups.push(shapes);

        callback();
    }

    /**
     * Réinitialiser l'état
     */
    reset() { }

    /**
     * démarrer l'état
     */
    start() { }

    /**
     * Annuler l'action en cours
     */
    abort() { }

    /**
    * Appelée lorsque l'événement mousedown est déclanché sur le canvas
     */
    mousedown() { }

    /**
    * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     */
    mouseup() { }
}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => app.states.ungroup_shapes = new UnlinkerState())