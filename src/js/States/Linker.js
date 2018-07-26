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
LinkerState.prototype.click = function(coordinates) {
    var list = window.app.workspace.shapesOnPoint(coordinates);
    if(list.length==0)
        return;
    var shape = list.pop();

    var group = this.app.workspace.getShapeGroup(shape, 'user');
    if(group!=null) { //La nouvelle forme fait déjà partie d'un groupe
        if(this.group!=null) { //On a déjà créé un nouveau groupe.
            var index1 = this.app.workspace.getGroupIndex(this.group, 'user');
            var index2 = this.app.workspace.getGroupIndex(group, 'user');
            if(index1==index2) { //La forme fait déjà partie du groupe
                return;
            } else if(index1>index2) {
                var t = this.group;
                this.group = group;
                group = t;

                t = index1;
                index1 = index2;
                index2 = t;
            }
            //this.group référence le groupe que l'on va garder, et index1 son index.

            //on fusionne les 2 groupes.
            this.app.workspace.userShapeGroups[index1] = this.app.workspace.userShapeGroups[index1].concat(group);
            this.group = this.app.workspace.userShapeGroups[index1];
            this.app.workspace.userShapeGroups.splice(index2, 1); //on supprime l'autre groupe.
        } else if(this.firstShape!=null) { //On avait déjà sélectionné une première forme.
            this.group = group;
            this.group.push(this.firstShape);
            this.firstShape = null;
        } else {
            this.group = group;
        }
    } else {
        if(this.group!=null) {
            this.group.push(shape);
        } else if(this.firstShape==null) {
            this.firstShape = shape;
        } else {
            //On crée un nouveau groupe.
            var uSG = this.app.workspace.userShapeGroups;
            uSG.push([this.firstShape, shape]);
            this.group = uSG[uSG.length-1];
            this.firstShape = null;
        }
    }

    this.app.getCanvas().refresh(coordinates);
    return;
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
