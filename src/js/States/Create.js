/**
 * Cette classe permet d'ajouter une forme au canvas
 */

class CreateState {
    constructor() {
        this.name = "create_shape";

        //La famille sélectionnée dans le menu de gauche
        this.selectedFamily = null;

        //La forme que l'on souhaite ajouter
        this.selectedShape = null;
    }

    /**
     * Réinitialiser l'état
     */
    reset() {
        this.selectedFamily = null;
        this.selectedShape = null;
    };

    /**
     * démarrer l'état
     * @param params: {family: Family, shape: Shape}
     */
    start(params) {
        //update the shape size:
        var size = app.settings.get('shapesSize');
        for (var i = 0; i < params.shape.buildSteps.length; i++) {
            var step = params.shape.buildSteps[i];
            step.setCoordinates(step.x * size, step.y * size);
        }
        params.shape.refPoint.x *= size;
        params.shape.refPoint.y *= size;

        this.selectedFamily = params.family;
        this.selectedShape = params.shape;
        params.shape.recomputePoints();
    };

    /**
     * Crée une forme aux coordonnées données
     * @param coordinates: {x: int, y: int}
     */
    click(coordinates) {
        //move the shape ?
        var pointsNear = app.workspace.pointsNearPoint(new Point(coordinates.x, coordinates.y, null, null));
        if (pointsNear.length > 0) {
            var last = pointsNear[pointsNear.length - 1].getAbsoluteCoordinates();
            coordinates = {
                "x": last.x,
                "y": last.y
            };
        }
        //coordonnées de la forme: ajouter le décalage entre le centre et le point de référence.
        //les coordonnées de base sont celles du point en bas à gauche, et non celles
        //du centre de la forme.
        var x = coordinates.x - this.selectedShape.refPoint.x;
        var y = coordinates.y - this.selectedShape.refPoint.y;

        var buildStepsCopy = [];
        for (var i = 0; i < this.selectedShape.buildSteps.length; i++) {
            buildStepsCopy.push(this.selectedShape.buildSteps[i].getCopy());
        }

        var shape = new Shape(
            this.selectedFamily.name, this.selectedShape.name,
            x, y,
            buildStepsCopy, this.selectedShape.color, "#000",
            { "x": this.selectedShape.refPoint.x, "y": this.selectedShape.refPoint.y },
            app.settings.get('areShapesPointed'),
            app.settings.get('areShapesSided'),
            app.settings.get('shapesOpacity'));

        if (pointsNear.length == 0 && app.settings.get('isGridShown')) {
            var t = app.workspace.getClosestGridPoint([shape]);
            var gridCoords = t.grid.getAbsoluteCoordinates(),
                shapeCoords = t.shape.getAbsoluteCoordinates();
            x += gridCoords.x - shapeCoords.x;
            y += gridCoords.y - shapeCoords.y;
            shape.setCoordinates({ 'x': x, 'y': y });
        }


        if (pointsNear.length > 0) {
            var last = pointsNear[pointsNear.length - 1];
            shape.linkedShape = last.shape;
            var uGroup = app.workspace.getShapeGroup(last.shape, 'user');
            if (uGroup) {
                uGroup.push(shape);
            }
        }

        app.workspace.addShape(shape);
        app.canvas.refresh(coordinates);
        this.makeHistory(shape);
    };

    /**
     * Appelée par la fonction de dessin, après avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    draw(canvas, mouseCoordinates) {
        //afficher le point sur lequel la forme va se coller le cas échéant
        var pointsNear = app.workspace.pointsNearPoint(new Point(mouseCoordinates.x, mouseCoordinates.y, null, null));
        if (pointsNear.length > 0) {
            var last = pointsNear[pointsNear.length - 1].getAbsoluteCoordinates();
            var pos = { "x": last.x, "y": last.y };
            canvas.drawPoint(pos, "#F00");
            canvas.drawCircle(pos, "#000", 6);
        }
    };

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory(shape) {
        var data = {
            'shape_id': shape.id
        };
        app.workspace.history.addStep(this.name, data);
    };

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        var ws = app.workspace;
        var shape = ws.getShapeById(data.shape_id)
        if (!shape) {
            console.log("CreateState.cancelAction: shape not found...");
            callback();
            return;
        }
        ws.removeShape(shape);
        callback();
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
    }

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
addEventListener('app-loaded', () => window.app.states.create_shape = new CreateState())