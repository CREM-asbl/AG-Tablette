/**
 * Cette classe permet de supprimer une forme du canvas
 */
function DeleteState(app) {
    this.app = app;
    this.name = "delete_shape";
 }

App.heriter(DeleteState.prototype, State.prototype);

/**
 * Supprime la forme aux coordonnées indiquées (s'il y en a une)
 * @param coordinates: {x: int, y: int}
 */
DeleteState.prototype.click = function(coordinates) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop(); //TODO: utiliser l'ordre d'affichage ?
    //TODO: au survol, entourer les formes que l'on va supprimer!


    var data = this.app.workspace.removeShape(shape);
    this.makeHistory(data);
	this.app.canvas.refresh(coordinates);
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
DeleteState.prototype.makeHistory = function(data2){
    var data = {
        'shapes': [],
        'userGroupInfo': data2.userGroupInfo
    };
    for(var i=0;i<data2.shapesInfo.length;i++) {
        data.shapes.push(data2.shapesInfo[i].getSaveData());
    }
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
DeleteState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;

    for(var i=0;i<data.shapes.length;i++) {
        var shape = Shape.createFromSaveData(data.shapes[i]);
        ws.addShape(shape, shape.id);
    }

    /**
     * TODO HERE!
     * Quand on supprime une forme, on supprime aussi toutes les formes qui sont liées (directement ou indirectement) à cette forme.
     * -> pour chacune des formes supprimées: elles font peut être partie d'un userShapeGroup, si c'est le cas il faut enregistrer la liste des ids
     *      qui sont dans ce userShapeGroup au moment où on supprime la forme de ce groupe. quand on recrée la forme, on retrouve/recrée ce groupe.
     */

    //User group: (le systemGroup est recréé dans addShape s'il existait)
    if(data.userGroupInfo.exists) {
        var group = null;
        if(data.userGroupInfo.ids.length<=1){
            //il faut recréer le groupe
            group = [];
            if(data.userGroupInfo.ids.length==1) {
                var shape = ws.getShapeById(data.userGroupInfo.ids[0]);
                if(!shape) {
                    console.log("DeleteState.cancelAction: last shape of group not found...");
                    callback();
                    return;
                }
                group.push(shape);
            }
            this.app.workspace.userShapeGroups.push(group);
        } else {
            for(var i=0;i<this.app.workspace.userShapeGroups.length;i++) {
                var g = this.app.workspace.userShapeGroups[i];
                //est-ce ce groupe ?
                for(var k=0;k<data.userGroupInfo.ids.length;k++) { //pour chaque élément qui peut être dans le groupe
                    for(var l=0;l<g.length;l++) {
                        if(g[l].id==data.userGroupInfo.ids[k]) {
                            group = g;
                            break;
                        }
                    }
                    if(group)
                        break;
                }

                if(group)
                    break;
            }
            if(!group) {
                console.log("DeleteState.cancelAction: group not found...");
                callback();
                return;
            }
        }


    }

    /* //TODO à supprimer
    //groupes:
    for(var i=0;i<data.groupsInfo.length;i++) {
        var ginfo = data.groupsInfo[i];
        var groupsList = this.app.workspace[ ginfo.gtype ]; //'systemShapeGroups', 'userShapeGroups'

        //récupérer le groupe
        var group = null;
        if(ginfo.deleted) {
            group = []; //nouveau groupe
            if(ginfo.remaining_shapes.length==1) {
                var shape = this.app.workspace.getShapeById(ginfo.remaining_shapes[0])
                if(!shape) {
                    console.log("DeleteState.cancelAction: shape to add in group not found...");
                    callback();
                    return;
                }
                group.push(shape);
            }
            groupsList.push(group);
        } else {
            for(var j=0;j<groupsList.length;j++) { //pour chaque groupe possible:
                //est-ce ce groupe ?
                var group_ok = true;
                for(var k=0;k<ginfo.remaining_shapes.length;k++) { //pour chaque élément qui doit être dans le groupe
                    var elem_found = false;
                    for(var l=0;l<groupsList[j].length;l++) {
                        if(groupsList[j][l].id==ginfo.remaining_shapes[k]) {
                            elem_found = true;
                            break;
                        }
                    }
                    if(!elem_found) { //un élément devant être dans le groupe n'a pas été trouvé, ce n'est donc pas ce groupe.
                        group_ok = false;
                        break;
                    }
                }

                if(group_ok) {
                    group = groupsList[j];
                    break;
                }
            }
        }
        if(!group){
            console.log("DeleteState.cancelAction: group not found...");
            callback();
            return;
        }

        //Ajouter les formes au groupe.
        for(var j=0;j<ginfo.deleted_ids.length;j++) {
            var shape = this.app.workspace.getShapeById(ginfo.deleted_ids[j])
            if(!shape) {
                console.log("DeleteState.cancelAction: recreated shape not found...");
                callback();
                return;
            }
            group.push(shape);
        }
    }
    */

    callback();
};

/**
 * Annuler l'action en cours
 */
DeleteState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
DeleteState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
DeleteState.prototype.mouseup = function(){};

/**
 * Réinitialiser l'état
 */
DeleteState.prototype.reset = function(){};

/**
 * démarrer l'état
 */
DeleteState.prototype.start = function(){};
