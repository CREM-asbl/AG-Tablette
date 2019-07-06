import {Point} from '../Point'
/**
 * Cette classe permet de supprimer une forme du canvas
 */
class DeleteState {
    constructor() {
        this.name = "delete_shape";
    }

    /**
     * Supprime la forme aux coordonnées indiquées (s'il y en a une)
     * @param coordinates: {x: int, y: int}
     */
    click(coordinates, selection) {
        var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
        if (list.length == 0 && !selection.shape)
            return;
        var shape = selection.shape ? selection.shape : list.pop();
        //TODO: au survol, entourer les formes que l'on va supprimer!


        var data = app.workspace.removeShape(shape);
        this.makeHistory(data);
        app.canvas.refresh(coordinates);
    };

    /**
     * Ajoute l'action qui vient d'être effectuée dans l'historique
     */
    makeHistory(data2) {
        var data = {
            'shapes': [],
            'userGroupInfo': data2.userGroupInfo
        };
        for (var i = 0; i < data2.shapesInfo.length; i++) {
            data.shapes.push(data2.shapesInfo[i].getSaveData());
        }
        app.workspace.history.addStep(this.name, data);
    };

    /**
     * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
     * @param  {Object} data        les données envoyées à l'historique par makeHistory
     * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
     */
    cancelAction(data, callback) {
        var ws = app.workspace,
            newShapesList = [];

        for (var i = 0; i < data.shapes.length; i++) {
            var shape = Shape.createFromSaveData(data.shapes[i]);
            newShapesList.push(shape);
            ws.addShape(shape, shape.id);
        }

        //Recrée le user group: (le systemGroup est recréé dans addShape s'il existait)
        //Si les formes étaient dans un systemGroup, elles faisaient partie du même userGroup (dans le cas où elles faisaient partie d'un userGroup)
        if (data.userGroupInfo.exists) {
            var group = null;
            if (data.userGroupInfo.ids.length <= 1) {
                //il faut recréer le groupe
                group = [];
                if (data.userGroupInfo.ids.length == 1) {
                    var shape = ws.getShapeById(data.userGroupInfo.ids[0]);
                    if (!shape) {
                        console.log("DeleteState.cancelAction: last shape of group not found...");
                        callback();
                        return;
                    }
                    group.push(shape);
                }
                app.workspace.userShapeGroups.push(group);
            } else {
                for (var i = 0; i < app.workspace.userShapeGroups.length; i++) {
                    var g = app.workspace.userShapeGroups[i];
                    //est-ce ce groupe ?
                    for (var k = 0; k < data.userGroupInfo.ids.length; k++) { //pour chaque élément qui peut être dans le groupe
                        for (var l = 0; l < g.length; l++) {
                            if (g[l].id == data.userGroupInfo.ids[k]) {
                                group = g;
                                break;
                            }
                        }
                        if (group)
                            break;
                    }

                    if (group)
                        break;
                }
                if (!group) {
                    console.log("DeleteState.cancelAction: group not found...");
                    callback();
                    return;
                }
            }

            for (var i = 0; i < newShapesList.length; i++) {
                group.push(newShapesList[i]);
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
            'shapes': [overflownShape],
            'segments': [],
            'points': []
        };

        var that = this;
        var findLinkedShapes = function (list, srcShape) {
            var to_visit = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].linkedShape == srcShape) { //la forme est liée à la forme supprimée (srcShape)
                    data.shapes.push(list[i]);

                    to_visit.push(list[i]); //ajouter la forme pour la récursion

                }
            }
            for (var i = 0; i < to_visit.length; i++)
                findLinkedShapes(list, to_visit[i])
        };

        for (var i = 0; i < app.workspace.systemShapeGroups.length; i++) {
            var group = app.workspace.systemShapeGroups[i];
            //parcours d'un groupe:
            var found = false;
            for (var j = 0; j < group.length; j++) {
                if (group[j] == overflownShape) { //on a trouvé la forme dans le groupe
                    findLinkedShapes(group, overflownShape);
                    return data;
                }
            }
        }

        return data;
    };

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

    /**
     * Réinitialiser l'état
     */
    reset() { }

    /**
     * démarrer l'état
     */
    start() { }
}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => window.app.states.delete_shape = new DeleteState())