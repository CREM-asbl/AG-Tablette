/**
 * Cette classe permet d'effectuer une rotation sur une forme (ou un ensemble de formes liées) sur le canvas
 */
class RotateState {
    constructor() {
        this.name = "rotate_shape";

        //La forme que l'on a sélectionnée
        this.selectedShape = null;

        //l'ensemble des formes liées à la forme actuelle.
        this.shapesList = [];

        //coordonnées de la souris lorsque le déplacement a commencé
        this.clickCoordinates = null;
        this.startAngle = null;

        this.isRotating = false;

        this.center = null;
    }

    /**
     * Réinitialiser l'état
     */
    reset() {
        this.selectedShape = null;
        this.shapesList = [];
        this.clickCoordinates = null;
        this.startAngle = null;
        this.isRotating = false;
        this.center = null;
    };

    /**
     * Appelée lorsque l'événement mousedown est déclanché sur le canvas
     */ //TODO: au survol, entourer les formes que l'on va tourner!
    mousedown(point, selection) {
        var list = window.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
        if (list.length > 0 || selection.shape) {
            this.isRotating = true;
            this.clickCoordinates = point;
            this.selectedShape = selection.shape ? selection.shape : list.pop();
            this.center = {
                "x": this.selectedShape.x,
                "y": this.selectedShape.y
            };

            this.startAngle = app.getAngleBetweenPoints(this.selectedShape, point);
            var group = app.workspace.getShapeGroup(this.selectedShape, "system");
            if (group)
                this.shapesList = group.slice();
            else
                this.shapesList = [this.selectedShape];

            var group = app.workspace.getShapeGroup(this.selectedShape, "user");
            if (group) {
                for (var i = 0; i < group.length; i++) {
                    var g = app.workspace.getShapeGroup(group[i], "system");
                    if (g) {
                        for (var j = 0; j < g.length; j++) {
                            if (this.shapesList.indexOf(g[j]) == -1)
                                this.shapesList.push(g[j]);
                        }
                    } else {
                        if (this.shapesList.indexOf(group[i]) == -1)
                            this.shapesList.push(group[i]);
                    }
                }
            }
        }
        app.canvas.refresh(point);
    };

    /**
     * Calcule les nouvelles coordonnées du centre de la forme
     *  ->elles ne changent pas si la forme en question est celle qui a été sélectionnée
     *   pour la rotation, mais changent s'il s'agit d'une forme attachée à cette
     *   dernière.
     * @param shape: Shape
     * @param angle: l'angle de rotation actuel (en radians)
     * Note: utilisée dans Move. en faire une copie dans la classe Move?
     */
    computeNewShapePos(shape, angle, center) {
        if (center == undefined) {
            center = this.center;
        }

        var s = Math.sin(-angle);
        var c = Math.cos(-angle);

        var x = shape.x - center.x;
        var y = shape.y - center.y;

        // effectuer la rotation
        var newX = x * c - y * s + center.x;
        var newY = x * s + y * c + center.y;


        return { "x": newX, "y": newY };
    };

    /**
     * Calculer la nouvelle d'un position d'un point qui a subi une rotation de centre (0,0)
     * @param point: le point ({'x': int, 'y': int})
     * @param angle: l'angle (float, en radians)
     */
    computePointPosition(x, y, angle) {
        var s = Math.sin(-angle);
        var c = Math.cos(-angle);

        // effectuer la rotation
        var newX = x * c - y * s;
        var newY = x * s + y * c;


        return { "x": newX, "y": newY };
    };

    /**
     * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     */
    mouseup(point) {
        if (!this.isRotating)
            return;

        var shapesSave = [];
        var AngleDiff = app.getAngleBetweenPoints(this.center, point) - this.startAngle;
        for (var i = 0; i < this.shapesList.length; i++) {
            shapesSave.push(this.shapesList[i].getSaveData());
            var shape = this.shapesList[i];
            var newPos = this.computeNewShapePos(shape, AngleDiff);
            this.shapesList[i].setCoordinates(newPos);

            for (var j = 0; j < shape.buildSteps.length; j++) {
                var transformation = this.computePointPosition(shape.buildSteps[j].x, shape.buildSteps[j].y, AngleDiff);
                shape.buildSteps[j].setCoordinates(transformation.x, transformation.y);
            }
            shape.recomputePoints();
            for (var j = 0; j < shape.segmentPoints.length; j++) {
                var pos = shape.segmentPoints[j].getRelativeCoordinates();
                var transformation = this.computePointPosition(pos.x, pos.y, AngleDiff);
                shape.segmentPoints[j].setCoordinates(transformation.x, transformation.y);
            }
            for (var j = 0; j < shape.otherPoints.length; j++) {
                var pos = shape.otherPoints[j].getRelativeCoordinates();
                var transformation = this.computePointPosition(pos.x, pos.y, AngleDiff);
                shape.otherPoints[j].setCoordinates(transformation.x, transformation.y);
            }
        }
        this.reset();

        this.makeHistory(shapesSave);
        app.canvas.refresh(point);
    };

    /**
     * Appelée par la fonction de dessin, après avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    draw(canvas, mouseCoordinates) {
        //dessine la forme/le groupe de formes qui est en train d'être tourné

        var AngleDiff = canvas.app.getAngleBetweenPoints(this.selectedShape, mouseCoordinates) - this.startAngle;
        for (var i = 0; i < this.shapesList.length; i++) {
            var pos = this.computeNewShapePos(this.shapesList[i], AngleDiff);
            canvas.drawRotatingShape(this.shapesList[i], pos, AngleDiff);
        }
    };

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory(shapesSave) {
        var data = {
            'shapesSave': shapesSave
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
        for (var i = 0; i < data.shapesSave.length; i++) {
            var shape = ws.getShapeById(data.shapesSave[i].id);
            if (!shape) {
                console.log("RotateState.cancelAction: shape not found... " + i);
                continue;
            }

            shape.setCoordinates({ 'x': data.shapesSave[i].x, 'y': data.shapesSave[i].y });

            for (var j = 0; j < data.shapesSave[i].buildSteps.length; j++) {
                var coords = data.shapesSave[i].buildSteps[j]
                shape.buildSteps[j].setCoordinates(coords.x, coords.y);
            }
            shape.recomputePoints();

            for (var j = 0; j < data.shapesSave[i].segmentPoints.length; j++) {
                var coords = data.shapesSave[i].segmentPoints[j]
                shape.segmentPoints[j].setCoordinates(coords.x, coords.y);
            }
            for (var j = 0; j < data.shapesSave[i].otherPoints.length; j++) {
                var coords = data.shapesSave[i].otherPoints[j]
                shape.otherPoints[j].setCoordinates(coords.x, coords.y);
            }
        }

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
    };

    /**
     * Annuler l'action en cours
     */
    abort() { }

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
addEventListener('app-loaded', () => window.app.states.rotate_shape = new RotateState())