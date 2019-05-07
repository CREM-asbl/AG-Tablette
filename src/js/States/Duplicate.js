/**
 * Cette classe permet de dupliquer une forme au canvas
 */
function DuplicateState(app) {
    this.app = app;
    this.name = "duplicate_shape";

    this.reset()
}

App.heriter(DuplicateState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
DuplicateState.prototype.reset = function () {
    this.isDuplicating = false;
    this.duplicatedShapes = [];
    this.clickCoordinates = null;
};

/**
 * Duplique la forme aux coordonnées données (s'il y en a une)
 * @param point: {x: int, y: int}
 */
DuplicateState.prototype.mousedown = function (point, selection) {
    var list = window.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
    if (list.length == 0 && !selection.shape)
        return;
    this.isDuplicating = true;
    this.clickCoordinates = point;

    var sourceShape = selection.shape ? selection.shape : list.pop();

    let group = this.app.workspace.getShapeGroup(sourceShape, 'user')

    this.duplicatedShapes = group ? this.duplicateGroup(group) : [this.duplicateShape(sourceShape)]

    this.app.canvas.refresh(point);
};

/**
 * Annuler l'action en cours
 */
DuplicateState.prototype.abort = function () {
    this.duplicatedShapes.forEach(shape => this.app.workspace.removeShape(shape))
};


DuplicateState.prototype.computeMouseMoveGap = (startPoint, endPoint) => {
    let gap = {}
    gap.x = endPoint.x - startPoint.x
    gap.y = endPoint.y - startPoint.y
    return gap
}

DuplicateState.prototype.duplicateGroup = group => {
    let duplicatedGroup = []
    group.forEach(shape => {
        //Todo: remplacer par this.duplicateShape(shape)
        let duplicatedShape = shape.getCopy()
        this.app.workspace.addShape(duplicatedShape)
        duplicatedGroup.push(duplicatedShape)
    })
    this.app.workspace.userShapeGroups.push(duplicatedGroup)
    return duplicatedGroup
}

DuplicateState.prototype.duplicateShape = shape => {
    let duplicatedShape = shape.getCopy()
    this.app.workspace.addShape(duplicatedShape)
    return duplicatedShape
}

/**
* Appelée lorsque l'événement mouseup est déclenché sur le canvas
 */
DuplicateState.prototype.mouseup = function (point) {

    if (this.isDuplicating) {

        gap = this.computeMouseMoveGap(this.clickCoordinates, point)

        if (gap.x === 0 && gap.y === 0) {
            this.abort()
        }
        else {

            this.duplicatedShapes.forEach(shape => {
                var newX = shape.x + gap.x
                var newY = shape.y + gap.y;
                shape.setCoordinates({ "x": newX, "y": newY });
            })
            this.makeHistory();
        }
    }

    this.reset();
}


/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
DuplicateState.prototype.draw = function (canvas, mouseCoordinates) {

    let gap = this.computeMouseMoveGap(this.clickCoordinates, mouseCoordinates)

    this.duplicatedShapes.forEach(shape => {
        var newX = shape.x + gap.x
        var newY = shape.y + gap.y;

        canvas.drawMovingShape(shape, { "x": newX, "y": newY })
    })
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
DuplicateState.prototype.makeHistory = function () {
    let data = []
    this.duplicatedShapes.forEach(shape => data.push({ shape_id: shape.id }))
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
DuplicateState.prototype.cancelAction = function (data, callback) {
    var ws = this.app.workspace;
    data.forEach(duplicatedData => {
        let shape = ws.getShapeById(duplicatedData.shape_id)
        ws.removeShape(shape);
    })
    callback();
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
DuplicateState.prototype.getElementsToHighlight = function (overflownShape) {
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    var uGroup = this.app.workspace.getShapeGroup(overflownShape, 'user');
    var sGroup = this.app.workspace.getShapeGroup(overflownShape, 'system');
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
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
DuplicateState.prototype.click = function () { };

/**
 * démarrer l'état
 */
DuplicateState.prototype.start = function (params) { };
