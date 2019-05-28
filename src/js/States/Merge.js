import { hasCommonSegments, isCommonSegment, isSamePoints } from "../Geometry"
import { ShapeStep } from '../ShapeStep'
import { Point } from '../Point'

/**
 * Cette classe permet de fusionner 2 formes (les 2 formes restent intactes, une nouvelle forme (la fusion des 2 formes) est créée)
 */

class MergeState {

    constructor() {
        this.name = "merge_shapes";
        this.firstShape = null;
    }
    /**
     * Réinitialiser l'état
     */
    reset() {
        this.firstShape = null;
    };

    /**
    * Appelée lorsque l'événement click est déclanché sur le canvas
    * @param point: {x: int, y: int}
     */
    click(point, selection) {
        var list = app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
        if (list.length == 0 && !selection.shape)
            return;
        var shape = selection.shape ? selection.shape : list.pop();

        if (!this.firstShape) { //On sélectionne la première forme
            this.firstShape = shape;
            app.canvas.refresh(point);
            return;
        }

        //On sélectionne la seconde forme

        if (shape === this.firstShape) //on ne peut pas fusionner une forme avec elle même
            return;

        //Vérifier que les 2 formes ont des segments communs:
        let shape1 = this.firstShape,
            shape2 = shape

        if (hasCommonSegments(shape1, shape2)) {
            let newBS = [],
                decalage = {
                    'x': shape1.x - shape2.x,
                    'y': shape1.y - shape2.y
                };


            const segmentsOfMergedShape = this.computeSegmentsOfMergedShape(shape1, shape2)

            newBS = this.computeNewBuildSteps(segmentsOfMergedShape)

            //Translation des buildSteps pour qu'elles soient centrées:
            //TODO: fusionner 2 arc de cercles qui sont côte à côte si c'est le même centre ?
            var midX = 0, midY = 0;
            newBS.forEach(function (val, i) {
                if (i == newBS.length - 1) { return; }
                midX += val.x;
                midY += val.y
            });
            midX /= newBS.length - 1;
            midY /= newBS.length - 1;
            newBS.forEach(function (val, i) {
                val.setCoordinates(val.x - midX, val.y - midY);
            });

            //Création de la forme
            var newShape = shape1.getCopy();
            newShape.buildSteps = newBS;
            newShape.__computePoints();
            newShape.color = app.getAverageColor(shape1.color, shape2.color);
            newShape.name = "Custom";
            newShape.familyName = "Custom";

            newShape.otherPoints = []; //Supprime le point au centre (le centre change)
            newShape.segmentPoints = [];
            
            for (var i = 0; i < shape1.segmentPoints.length; i++) {
                var p = shape1.segmentPoints[i].getCopy();
                p.x -= midX;
                p.y -= midY;
                p.shape = newShape;
                newShape.segmentPoints.push(p);
            }

            for (var i = 0; i < shape2.segmentPoints.length; i++) {
                var p = shape2.segmentPoints[i].getCopy();
                p.x -= midX + decalage.x;
                p.y -= midY + decalage.y;
                newShape.segmentPoints.push(p);
            }

            app.workspace.addShape(newShape);
            var coord = newShape.getCoordinates();
            newShape.setCoordinates({ "x": coord.x - 10, "y": coord.y - 10 });

            this.makeHistory(newShape);

            this.reset();
            app.canvas.refresh(point);
        }
    };

    /**
     * Annuler l'action en cours
     */
    abort() {
        if (this.newShape)
            app.workspace.removeShape(this.newShape);
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
            console.log("MergeState.cancelAction: shape not found...");
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
            'shapes': [overflownShape],
            'segments': [],
            'points': []
        };

        return data;
    };

    /**
     * démarrer l'état
     */
    start(params) { };

    computeSegmentsOfMergedShape(shape1, shape2) {

        let segments = [],
            shape1StartPoint = null,
            shape1EndPoint = null,
            shape2StartPoint = null,
            shape2EndPoint = null

        for (let i = 1; i < shape1.buildSteps.length; i++) {
            shape1StartPoint = shape1.buildSteps[i - 1].getFinalPoint(shape1StartPoint);
            shape1StartPoint.x += shape1.x
            shape1StartPoint.y += shape1.y
            shape1EndPoint = shape1.buildSteps[i].getFinalPoint(shape1StartPoint);
            shape1EndPoint.x += shape1.x
            shape1EndPoint.y += shape1.y
            segments.push({ point1: shape1StartPoint, point2: shape1EndPoint })
        }

        for (let i = 1; i < shape2.buildSteps.length; i++) {
            shape2StartPoint = shape2.buildSteps[i - 1].getFinalPoint(shape2StartPoint);
            shape2StartPoint.x += shape2.x
            shape2StartPoint.y += shape2.y
            shape2EndPoint = shape2.buildSteps[i].getFinalPoint(shape2StartPoint);
            shape2EndPoint.x += shape2.x
            shape2EndPoint.y += shape2.y

            const commonsSegments = segments.filter(segment => {
                return isCommonSegment(segment.point1, segment.point2, shape2StartPoint, shape2EndPoint)
                    || isCommonSegment(segment.point1, segment.point2, shape2EndPoint, shape2StartPoint)
            })

            if (commonsSegments.length > 0) {
                segments = segments.filter(segment => !commonsSegments.includes(segment))
            }

            if (commonsSegments.length === 0) {
                segments.push({ point1: shape2StartPoint, point2: shape2EndPoint })
            }
        }
        return segments
    }

    computeNewBuildSteps(segmentsList) {
        let newBuildSteps = []
        let currentPoint
        // propriété pour éviter une boucle infinie
        // Todo : améliorer pour éviter des erreurs de précision
        // Todo : Traiter le cas des formes "percées" 
        let numberOfSegmentsRefused = 0

        while (segmentsList.length > 0 && numberOfSegmentsRefused !== segmentsList.length) {
            const currentSegment = segmentsList.shift()
            if (!currentPoint) {
                currentPoint = currentSegment.point2
                newBuildSteps.push(new ShapeStep('line', currentSegment.point1.x, currentSegment.point1.y))
            }
            else if (isSamePoints(currentSegment.point1, currentPoint)) {
                newBuildSteps.push(new ShapeStep('line', currentSegment.point1.x, currentSegment.point1.y))
                currentPoint = currentSegment.point2
                numberOfSegmentsRefused = 0
            }
            else if (isSamePoints(currentSegment.point1, currentPoint)) {
                const reversedSegment = { point1: currentSegment.point2, point2: currentSegment.point1 }
                newBuildSteps.push(new ShapeStep('line', reversedSegment.point1.x, reversedSegment.point1.y))
                currentPoint = reversedSegment.point2
                numberOfSegmentsRefused = 0
            }
            else {
                segmentsList.push(currentSegment)
                numberOfSegmentsRefused++
            }
        }
        newBuildSteps.push(newBuildSteps[0].getCopy())
        return newBuildSteps
    }

}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => window.app.states.merge_shapes = new MergeState())