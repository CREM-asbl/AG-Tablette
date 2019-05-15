import {Point} from '../Point'
/**
 * Cette classe permet de dupliquer une forme au canvas
 */
class DuplicateState {
    constructor() {
        this.name = "duplicate_shape";

        this.reset()
    }

    /**
     * Réinitialiser l'état
     */
    reset() {
        this.isDuplicating = false;
        this.duplicatedShapes = [];
        this.clickCoordinates = null;
    }

    /**
     * Duplique la forme aux coordonnées données (s'il y en a une)
     * @param point: {x: int, y: int}
     */
    mousedown(point, selection) {
        var list = window.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
        if (list.length == 0 && !selection.shape)
            return;
        this.isDuplicating = true;
        this.clickCoordinates = point;

        var sourceShape = selection.shape ? selection.shape : list.pop();

        let group = app.workspace.getShapeGroup(sourceShape, 'user')

        this.duplicatedShapes = group ? this.duplicateGroup(group) : [this.duplicateShape(sourceShape)]

        app.canvas.refresh(point);
    }

    /**
     * Annuler l'action en cours
     */
    abort() {
        this.duplicatedShapes.forEach(shape => app.workspace.removeShape(shape))
    }


    computeMouseMoveGap(startPoint, endPoint) {
        let gap = {}
        gap.x = endPoint.x - startPoint.x
        gap.y = endPoint.y - startPoint.y
        return gap
    }

    duplicateGroup(group) {
        let duplicatedGroup = []
        group.forEach(shape => {
            let duplicatedShape = this.duplicateShape(shape)
            duplicatedGroup.push(duplicatedShape)
        })
        app.workspace.userShapeGroups.push(duplicatedGroup)
        return duplicatedGroup
    }

    duplicateShape(shape) {
        let duplicatedShape = shape.getCopy()
        app.workspace.addShape(duplicatedShape)
        return duplicatedShape
    }

    /**
    * Appelée lorsque l'événement mouseup est déclenché sur le canvas
     */
    mouseup(point) {

        if (this.isDuplicating) {

            let gap = this.computeMouseMoveGap(this.clickCoordinates, point)

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
    draw(canvas, mouseCoordinates) {

        let gap = this.computeMouseMoveGap(this.clickCoordinates, mouseCoordinates)

        this.duplicatedShapes.forEach(shape => {
            var newX = shape.x + gap.x
            var newY = shape.y + gap.y;

            canvas.drawMovingShape(shape, { "x": newX, "y": newY })
        })
    }

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory() {
        let data = []
        this.duplicatedShapes.forEach(shape => data.push({ shape_id: shape.id }))
        app.workspace.history.addStep(this.name, data);
    }

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        var ws = app.workspace;
        data.forEach(duplicatedData => {
            let shape = ws.getShapeById(duplicatedData.shape_id)
            ws.removeShape(shape);
        })
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
    * Appelée lorsque l'événement mousedown est déclanché sur le canvas
     */
    click() { }

    /**
     * démarrer l'état
     */
    start(params) { }
}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => app.states.duplicate_shape = new DuplicateState())