import { getCommonsSegments, isCommonSegment } from "../Geometry"
import {ShapeStep} from '../ShapeStep'
import {Point} from '../Point'

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

        //Vérifier que les 2 formes ont un segment commun:
        // Todo: remplacer par le code du dessous, si on doit retirer tous les segments communs
        console.log(getCommonsSegments(this.firstShape, shape))
        var commonSegmentFound = false,
            commonSegment = {
                's1_index1': null, //index de la buildstep dont le finalpoint est le début du segment
                's1_index2': null, //index de la buildstep dont le finalpoint est la fin du segment
                's2_index1': null,
                's2_index2': null
            },
            shape1 = this.firstShape,
            shape2 = shape,
            shape1StartPoint = null,
            shape1EndPoint = null,
            shape2StartPoint = null,
            shape2EndPoint = null;

        for (var i = 1; i < shape1.buildSteps.length; i++) {
            if (shape1.buildSteps[i].type != 'line') continue;
            shape1StartPoint = shape1.buildSteps[i - 1].getFinalPoint(shape1StartPoint);
            shape1StartPoint.x += shape1.x
            shape1StartPoint.y += shape1.y
            shape1EndPoint = shape1.buildSteps[i].getFinalPoint(shape1StartPoint);
            shape1EndPoint.x += shape1.x
            shape1EndPoint.y += shape1.y

            for (var j = 1; j < shape2.buildSteps.length; j++) {
                if (shape2.buildSteps[j].type != 'line') continue;
                shape2StartPoint = shape2.buildSteps[j - 1].getFinalPoint(shape2StartPoint);
                shape2StartPoint.x += shape2.x
                shape2StartPoint.y += shape2.y
                shape2EndPoint = shape2.buildSteps[j].getFinalPoint(shape2StartPoint);
                shape2EndPoint.x += shape2.x
                shape2EndPoint.y += shape2.y

                if (isCommonSegment(shape1StartPoint, shape1EndPoint, shape2StartPoint, shape2EndPoint)) {
                    commonSegmentFound = true;
                    commonSegment = {
                        's1_index1': i - 1,
                        's1_index2': i,
                        's2_index1': j - 1,
                        's2_index2': j
                    };
                } else if (isCommonSegment(shape1StartPoint, shape1EndPoint, shape2EndPoint, shape2StartPoint)) {
                    commonSegmentFound = true;
                    commonSegment = {
                        's1_index1': i - 1,
                        's1_index2': i,
                        's2_index1': j,
                        's2_index2': j - 1
                    };
                }
                if (commonSegmentFound) break;
            }
            if (commonSegmentFound) break;
        }

        if (commonSegmentFound) {
            var newBS = [],
                decalage = {
                    'x': shape1.x - shape2.x,
                    'y': shape1.y - shape2.y
                };

            //Début forme 1:
            for (var i = 0; i <= commonSegment.s1_index1; i++) {
                newBS.push(shape1.buildSteps[i].getCopy());
                //console.log(shape1.buildSteps[i]);
            }

            //console.log("next1");

            //Forme 2:
            if (commonSegment.s2_index1 < commonSegment.s2_index2) {
                for (var i = commonSegment.s2_index1; i > 0; i--) { //pas >=0 ? pas index1-1 ?
                    var b = shape2.buildSteps[i].getCopy();
                    b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                    if (b.type == "arc") {
                        b.direction = !b.direction;
                        newBS.push(new ShapeStep('line', b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                        //console.log("new:");
                        //console.log(new ShapeStep('line', b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                    }
                    newBS.push(b);
                    //console.log(b);
                }
                //console.log("next2");
                for (var i = shape2.buildSteps.length - 1; i >= commonSegment.s2_index2; i--) {
                    var b = shape2.buildSteps[i].getCopy();
                    b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                    if (b.type == "arc") {
                        b.direction = !b.direction;
                        newBS.push(new ShapeStep('line', b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                        //console.log("new:");
                        //console.log(new ShapeStep('line', b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                    }
                    newBS.push(b);
                    //console.log(b);
                }
                //console.log("case1");
            } else {
                for (var i = commonSegment.s2_index1 + 1; i < shape2.buildSteps.length; i++) {
                    var b = shape2.buildSteps[i].getCopy();
                    b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                    newBS.push(b);
                    //console.log(b);
                }
                //console.log("next2");
                for (var i = 1; i <= commonSegment.s2_index2; i++) { // = ?
                    var b = shape2.buildSteps[i].getCopy();
                    b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                    newBS.push(b);
                    //console.log(b);
                }
                //console.log("case2");
            }

            //Fin forme 1:
            for (var i = commonSegment.s1_index2; i < shape1.buildSteps.length; i++) {
                newBS.push(shape1.buildSteps[i].getCopy());
                //console.log(shape1.buildSteps[i]);
            }

            // for (let i = 0; i < shape1.buildSteps.length; i++) {
            //     newBS.push(shape1.buildSteps[i].getCopy());
            // }

            // for (let i = 0; i < shape2.buildSteps.length; i++) {
            //     let b = shape2.buildSteps[i].getCopy();
            //     b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
            //     newBS.push(b);
            // }
            // console.log(newBS)

            //TODO: supprimer (fusionner??) 2 buildstep "line" qui se suivent si elles sont identiques (ou quasi identique - précision)
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
            //TODO: supprimer les segmentPoints qui se trouvent sur le segment qui se fusionne (vu qu'il disparait)

            app.workspace.addShape(newShape);
            var coord = newShape.getCoordinates();
            newShape.setCoordinates({ "x": coord.x - 30, "y": coord.y - 30 });

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
    * Appelée lorsque l'événement mouseup est déclanché sur le canvas
     */
    mouseup(point) { };

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
     * Appelée par la fonction de dessin, après avoir dessiné les formes
     * @param canvas: référence vers la classe Canvas
     */
    draw(canvas, mouseCoordinates) { };

    /**
     * démarrer l'état
     */
    start(params) { };

    mousedown(point) { };
}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => window.app.states.merge_shapes = new MergeState())