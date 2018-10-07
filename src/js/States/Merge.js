/**
 * Cette classe permet de fusionner 2 formes (les 2 formes restent intactes, une nouvelle forme (la fusion des 2 formes) est créée)
 */
function MergeState(app) {
    this.app = app;
    this.name = "merge_shapes";

    this.firstShape = null;
}

App.heriter(MergeState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
MergeState.prototype.reset = function(){
    this.firstShape = null;
};

/**
* Appelée lorsque l'événement click est déclanché sur le canvas
* @param point: {x: int, y: int}
 */
MergeState.prototype.click = function(point){
    var list = this.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop();

    if(!this.firstShape) { //On sélectionne la première forme
        this.firstShape = shape;
        return;
    }

    //On sélectionne la seconde forme

    if(shape==this.firstShape) //on ne peut pas fusionner une forme avec elle même
        return;

    //Vérifier que les 2 formes ont un segment commun:
    var commonSegmentFound = false,
        commonSegment = {
            's1_index1': null, //index de la buildstep dont le finalpoint est le début du segment
            's1_index2': null, //index de la buildstep dont le finalpoint est la fin du segment
            's2_index1': null,
            's2_index2': null
        },
        maxSquareDist = Math.pow(this.app.settings.get('precision'), 2),
        shape1 = this.firstShape,
        shape2 = shape,
        shape1StartPoint = null,
        shape1EndPoint = null,
        shape2StartPoint = null,
        shape2EndPoint = null;

    for(var i=1;i<shape1.buildSteps.length;i++) {
        shape1StartPoint = shape1.buildSteps[i-1].getFinalPoint(shape1StartPoint);
        shape1EndPoint = shape1.buildSteps[i].getFinalPoint(shape1StartPoint);
        if(shape1.buildSteps[i].type!='line') continue;

        for(var j=1;j<shape2.buildSteps.length;j++) {
            shape2StartPoint = shape2.buildSteps[j-1].getFinalPoint(shape2StartPoint);
            shape2EndPoint = shape2.buildSteps[j].getFinalPoint(shape2StartPoint);
            if(shape2.buildSteps[j].type != 'line') continue;

            if(maxSquareDist >= Math.pow(shape1.x+shape1StartPoint.x-shape2.x-shape2StartPoint.x, 2) + Math.pow(shape1.y+shape1StartPoint.y-shape2.y-shape2StartPoint.y, 2)
              && maxSquareDist >= Math.pow(shape1.x+shape1EndPoint.x-shape2.x-shape2EndPoint.x, 2) + Math.pow(shape1.y+shape1EndPoint.y-shape2.y-shape2EndPoint.y, 2)) {
                commonSegmentFound = true;
                commonSegment = {
                    's1_index1': i-1,
                    's1_index2': i,
                    's2_index1': j-1,
                    's2_index2': j
                };
            } else if(maxSquareDist >= Math.pow(shape1.x+shape1StartPoint.x-shape2.x-shape2EndPoint.x, 2) + Math.pow(shape1.y+shape1StartPoint.y-shape2.y-shape2EndPoint.y, 2)
              && maxSquareDist >= Math.pow(shape1.x+shape1EndPoint.x-shape2.x-shape2StartPoint.x, 2) + Math.pow(shape1.y+shape1EndPoint.y-shape2.y-shape2StartPoint.y, 2)) {
                commonSegmentFound = true;
                commonSegment = {
                    's1_index1': i-1,
                    's1_index2': i,
                    's2_index1': j,
                    's2_index2': j-1
                };
            }

            if(commonSegmentFound) break;
        }
        if(commonSegmentFound) break;
    }

    if(commonSegmentFound) {
        var newBS = [],
            decalage = {
                'x': shape1.x - shape2.x,
                'y': shape1.y - shape2.y
            };

        //Début forme 1:
        for(var i=0; i<=commonSegment.s1_index1; i++) {
            newBS.push(shape1.buildSteps[i].getCopy());
            //console.log(shape1.buildSteps[i]);
        }

        //console.log("next1");

        //Forme 2:
        if(commonSegment.s2_index1<commonSegment.s2_index2) {
            for(var i=commonSegment.s2_index1; i>0; i--) { //pas >=0 ? pas index1-1 ?
                var b = shape2.buildSteps[i].getCopy();
                b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                if(b.type=="arc") {
                    b.direction = !b.direction;
                    newBS.push(ShapeStep.getLine(b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                    //console.log("new:");
                    //console.log(ShapeStep.getLine(b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                }
                newBS.push(b);
                //console.log(b);
            }
            //console.log("next2");
            for(var i=shape2.buildSteps.length-1; i>=commonSegment.s2_index2; i--) {
                var b = shape2.buildSteps[i].getCopy();
                b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                if(b.type=="arc") {
                    b.direction = !b.direction;
                    newBS.push(ShapeStep.getLine(b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                    //console.log("new:");
                    //console.log(ShapeStep.getLine(b.__finalPoint.x - decalage.x, b.__finalPoint.y - decalage.y));
                }
                newBS.push(b);
                //console.log(b);
            }
            //console.log("case1");
        } else {
            for(var i=commonSegment.s2_index1+1; i<shape2.buildSteps.length; i++) {
                var b = shape2.buildSteps[i].getCopy();
                b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                newBS.push(b);
                //console.log(b);
            }
            //console.log("next2");
            for(var i=1; i<=commonSegment.s2_index2; i++) { // = ?
                var b = shape2.buildSteps[i].getCopy();
                b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                newBS.push(b);
                //console.log(b);
            }
            //console.log("case2");
        }

        //Fin forme 1:
        for(var i=commonSegment.s1_index2; i<shape1.buildSteps.length; i++) {
            newBS.push(shape1.buildSteps[i].getCopy());
            console.log(shape1.buildSteps[i]);
        }

        //TODO: supprimer 2 buildstep "line" qui se suivent si elles sont identiques (ou quasi identique - précision)
        //Translation des buildSteps pour qu'elles soient centrées:
        //TODO: fusionner 2 arc de cercles qui sont côte à côte si c'est le même centre ?
        var midX = 0, midY = 0;
        newBS.forEach(function(val, i){
            if(i==newBS.length-1){ return; }
            midX += val.x;
            midY += val.y
        });
        midX /= newBS.length-1;
        midY /= newBS.length-1;
        newBS.forEach(function(val, i){
            val.setCoordinates(val.x - midX, val.y - midY);
        });

        //Création de la forme
        var newShape = shape1.getCopy();
        newShape.buildSteps = newBS;
        newShape.__computePoints();
        newShape.color = this.app.getAverageColor(shape1.color, shape2.color);
        newShape.name = "Custom";
        newShape.familyName = "Custom";

        newShape.otherPoints = []; //Supprime le point au centre (le centre change)
        newShape.segmentPoints = [];
        for(var i=0;i<shape1.segmentPoints.length;i++) {
            var p = shape1.segmentPoints[i].getCopy();
            p.x -= midX;
            p.y -= midY;
            p.shape = newShape;
            newShape.segmentPoints.push(p);
        }
        for(var i=0;i<shape2.segmentPoints.length;i++) {
            var p = shape2.segmentPoints[i].getCopy();
            p.x -= midX + decalage.x;
            p.y -= midY + decalage.y;
            newShape.segmentPoints.push(p);
        }
        //TODO: supprimer les segmentPoints qui se trouvent sur le segment qui se fusionne (vu qu'il disparait)

        this.app.workspace.addShape(newShape);
        var coord = newShape.getCoordinates();
        newShape.setCoordinates({"x": coord.x - 30, "y": coord.y - 30});

        this.makeHistory(newShape);

        this.reset();
        this.app.canvas.refresh(point);
    }
};

/**
 * Annuler l'action en cours
 */
MergeState.prototype.abort = function(){
    if(this.newShape)
        this.app.workspace.removeShape(this.newShape);
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
MergeState.prototype.mouseup = function(point){};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
MergeState.prototype.makeHistory = function(shape){
    var data = {
        'shape_id': shape.id
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
MergeState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
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
MergeState.prototype.getElementsToHighlight = function(overflownShape){
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
MergeState.prototype.draw = function(canvas, mouseCoordinates){};

/**
 * démarrer l'état
 */
MergeState.prototype.start = function(params){};

MergeState.prototype.mousedown = function(point) {};
