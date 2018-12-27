/**
 * Cette classe permet de lier des formes entre elles.
 */
function LinkerState(app) {
    this.app = app;
    this.name = "link_shapes";

    /**
     * Contient une référence vers le groupe auquel on est en train d'ajouter des formes.
     * Vaut null si le groupe n'a pas encore été créé. S'il n'est pas null, la variable
     * this.firstShape vaut null.
     */
    this.group = null;
    /**
     * Sert à stocker la première forme que l'on ajoute, dans le cas où elle ne fait
     * pas déjà partie d'un groupe. Le nouveau groupe sera alors créé lors de l'ajout
     * de la seconde forme.
     * Vaut null lorsqu'elle n'est pas utilisée, sinon contient un objet Shape.
     */
    this.firstShape = null;
}

App.heriter(LinkerState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
LinkerState.prototype.reset = function(){
  this.group = null;
  this.firstShape = null;
};

/**
 * démarrer l'état
 */
LinkerState.prototype.start = function(){};

/**
 * Ajoute une forme au groupe (si on clique sur une forme)
 * @param coordinates: {x: int, y: int}
 */
LinkerState.prototype.click = function(coordinates, selection) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0 && !selection.shape)
        return;
    var shape = selection.shape ? selection.shape : list.pop();

    //Sauvegarde des userShapeGroups:
    var data = [];
    for(var i=0;i<this.app.workspace.userShapeGroups.length;i++) {
        var groupSave = [],
            gRef = this.app.workspace.userShapeGroups[i];
        for(var j=0;j<gRef.length;j++) {
            groupSave.push(gRef[j].id);
        }
        data.push(groupSave);
    }

    var shapesToAdd = [shape];
    var sysGroup = this.app.workspace.getShapeGroup(shape, 'system');
    if(sysGroup) {
        shapesToAdd = [];
        for(var i=0;i<sysGroup.length;i++)
            shapesToAdd.push(sysGroup[i]);
    }

    var hasDoneAnything = false;

    for(var i=0;i<shapesToAdd.length;i++) { //Pour chaque forme à ajouter au groupe:
        var shape = shapesToAdd[i];
        var uGroup = this.app.workspace.getShapeGroup(shape, 'user');

        if(uGroup!=null) { //La nouvelle forme fait déjà partie d'un groupe
            if(this.group!=null) { //On a déjà créé un nouveau groupe.
                var index1 = this.app.workspace.getGroupIndex(this.group, 'user');
                var index2 = this.app.workspace.getGroupIndex(uGroup, 'user');
                if(index1==index2) { //La forme fait déjà partie du groupe
                    continue;
                } else if(index1>index2) {
                    var t = this.group;
                    this.group = uGroup;
                    uGroup = t;

                    t = index1;
                    index1 = index2;
                    index2 = t;
                }
                //this.group référence le groupe que l'on va garder, et index1 son index.

                //on fusionne les 2 groupes.
                this.app.workspace.userShapeGroups[index1] = this.app.workspace.userShapeGroups[index1].concat(uGroup);
                this.group = this.app.workspace.userShapeGroups[index1];
                this.app.workspace.userShapeGroups.splice(index2, 1); //on supprime l'autre groupe.
                hasDoneAnything = true;
            } else if(this.firstShape!=null) { //On avait déjà sélectionné une première forme.
                this.group = uGroup;
                this.group.push(this.firstShape);
                this.firstShape = null;
                hasDoneAnything = true;
            } else {
                this.group = uGroup;
            }
        } else {
            if(this.group!=null) { //on a déjà créé un groupe.
                this.group.push(shape);
                hasDoneAnything = true;
            } else if(this.firstShape==null) {
                this.firstShape = shape;
            } else {
                //On crée un nouveau groupe.
                var uSG = this.app.workspace.userShapeGroups;
                uSG.push([this.firstShape, shape]);
                this.group = uSG[uSG.length-1];
                this.firstShape = null;
                hasDoneAnything = true;
            }
        }
    }

    if(hasDoneAnything) {
        this.makeHistory(data);
    }

    this.app.canvas.refresh(coordinates);
    return;
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné une forme
 * @param canvas: référence vers la classe Canvas
 * @param mouseCoordinates: coordonnées de la souris
 * @param shape: objet Shape
 */
LinkerState.prototype.draw = function(canvas, mouseCoordinates, shape){
    //affiche les user-groups sur les formes (texte)

    var group = this.app.workspace.getShapeGroup(shape, 'user');
    var pos = {"x": shape.x - 25, "y": shape.y};
    if(group!==null) {
        var groupIndex = this.app.workspace.getGroupIndex(group, 'user');
        canvas.drawText("Groupe "+(groupIndex+1), pos, '#000');
    } else if(shape==this.firstShape) {
        canvas.drawText("Groupe "+(this.app.workspace.userShapeGroups.length+1), pos, '#666');
    }
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
LinkerState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    var uGroup = this.app.workspace.getShapeGroup(overflownShape, 'user');
    var sGroup = this.app.workspace.getShapeGroup(overflownShape, 'system');
    if(uGroup) {
        data.shapes = uGroup
    } else if(sGroup) {
        data.shapes = sGroup;
    } else {
        data.shapes.push(overflownShape);
    }

    return data;
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
LinkerState.prototype.makeHistory = function(userGroupSave){
    var data = {
        'user_groups': userGroupSave
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
LinkerState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    ws.userShapeGroups.splice(0);

    for(var i=0;i<data.user_groups.length;i++) {
        var group = [];
        for(var j=0;j<data.user_groups[i].length;j++) {
            var shape = ws.getShapeById(data.user_groups[i][j]);
            if(!shape) {
                console.log("LinkerState.cancelAction: shape not found...");
                callback();
                return;
            }
            group.push(shape);
        }
        ws.userShapeGroups.push(group);
    }

    callback();
};

/**
 * Annuler l'action en cours
 */
LinkerState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
LinkerState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
LinkerState.prototype.mouseup = function(){};
