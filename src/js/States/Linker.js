/**
 * Cette classe permet de lier des formes entre elles.
 */
class LinkerState {
    constructor() {
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

/**
 * Réinitialiser l'état
 */
reset(){
  this.group = null;
  this.firstShape = null;
}

/**
 * démarrer l'état
 */
start(){}

/**
 * Ajoute une forme au groupe (si on clique sur une forme)
 * @param coordinates: {x: int, y: int}
 */
click(coordinates, selection) {
    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0 && !selection.shape)
        return;
    var shape = selection.shape ? selection.shape : list.pop();

    //Sauvegarde des userShapeGroups:
    var data = [];
    for(var i=0;i<app.workspace.userShapeGroups.length;i++) {
        var groupSave = [],
            gRef = app.workspace.userShapeGroups[i];
        for(var j=0;j<gRef.length;j++) {
            groupSave.push(gRef[j].id);
        }
        data.push(groupSave);
    }

    var shapesToAdd = [shape];
    var sysGroup = app.workspace.getShapeGroup(shape, 'system');
    if(sysGroup) {
        shapesToAdd = [];
        for(var i=0;i<sysGroup.length;i++)
            shapesToAdd.push(sysGroup[i]);
    }

    var hasDoneAnything = false;

    for(var i=0;i<shapesToAdd.length;i++) { //Pour chaque forme à ajouter au groupe:
        var shape = shapesToAdd[i];
        var uGroup = app.workspace.getShapeGroup(shape, 'user');

        if(uGroup!=null) { //La nouvelle forme fait déjà partie d'un groupe
            if(this.group!=null) { //On a déjà créé un nouveau groupe.
                var index1 = app.workspace.getGroupIndex(this.group, 'user');
                var index2 = app.workspace.getGroupIndex(uGroup, 'user');
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
                app.workspace.userShapeGroups[index1] = app.workspace.userShapeGroups[index1].concat(uGroup);
                this.group = app.workspace.userShapeGroups[index1];
                app.workspace.userShapeGroups.splice(index2, 1); //on supprime l'autre groupe.
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
                var uSG = app.workspace.userShapeGroups;
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

    app.canvas.refresh(coordinates);
    return;
}

/**
 * Appelée par la fonction de dessin, après avoir dessiné une forme
 * @param canvas: référence vers la classe Canvas
 * @param mouseCoordinates: coordonnées de la souris
 * @param shape: objet Shape
 */
draw(canvas, mouseCoordinates, shape){
    //affiche les user-groups sur les formes (texte)

    var group = app.workspace.getShapeGroup(shape, 'user');
    var pos = {"x": shape.x - 25, "y": shape.y}
    if(group!==null) {
        var groupIndex = app.workspace.getGroupIndex(group, 'user');
        canvas.drawText("Groupe "+(groupIndex+1), pos, '#000');
    } else if(shape==this.firstShape) {
        canvas.drawText("Groupe "+(app.workspace.userShapeGroups.length+1), pos, '#666');
    }
}

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
getElementsToHighlight(overflownShape){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    }

    var uGroup = app.workspace.getShapeGroup(overflownShape, 'user');
    var sGroup = app.workspace.getShapeGroup(overflownShape, 'system');
    if(uGroup) {
        data.shapes = uGroup
    } else if(sGroup) {
        data.shapes = sGroup;
    } else {
        data.shapes.push(overflownShape);
    }

    return data;
}

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
makeHistory(userGroupSave){
    var data = {
        'user_groups': userGroupSave
    }
    app.workspace.history.addStep(this.name, data);
}

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
cancelAction(data, callback){
    var ws = app.workspace;
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
}

/**
 * Annuler l'action en cours
 */
abort(){}

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
mousedown(){}

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
mouseup(){}
}

// Todo: à supprimer quand l'import de toutes les classes sera en place
addEventListener('app-loaded', () => app.states.link_shapes = new LinkerState())