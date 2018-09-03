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
            's1_index1': null,
            's1_index2': null,
            's2_index1': null,
            's2_index2': null
        },
        maxSquareDist = Math.pow(this.app.settings.get('precision'), 2),
        shape1 = this.firstShape,
        shape2 = shape;

    for(var i=0;i<shape1.buildSteps.length-1;i++) {
        if(shape1.buildSteps[i].type!='line') continue;
        var s1BS = {'x': shape1.x + shape1.buildSteps[i].x, 'y': shape1.y+shape1.buildSteps[i].y};

        for(var j=0;j<shape2.buildSteps.length-1;j++) {
            if(shape2.buildSteps[j].type != 'line') continue;
            var s2BS = {'x': shape2.x + shape2.buildSteps[j].x, 'y': shape2.y+shape2.buildSteps[j].y};

            var nextI = (i==shape1.buildSteps.length-2) ? 0 : i+1,
                nextJ = (j==shape2.buildSteps.length-2) ? 0 : j+1,
                prevI = i==0 ? shape1.buildSteps.length-2 : i-1,
                prevJ = j==0 ? shape2.buildSteps.length-2 : j-1;

            if(maxSquareDist >= Math.pow(s1BS.x - s2BS.x, 2) + Math.pow(s1BS.y - s2BS.y, 2)) {
                //Les 2 points sont au même endroit. Y a-t-il un segment commun à cet endroit ?
                var s1BSprev = {'x': shape1.x+shape1.buildSteps[prevI].x, 'y': shape1.y+shape1.buildSteps[prevI].y},
                    s1BSnext = {'x': shape1.x+shape1.buildSteps[nextI].x, 'y': shape1.y+shape1.buildSteps[nextI].y},
                    s2BSprev = {'x': shape2.x+shape2.buildSteps[prevJ].x, 'y': shape2.y+shape2.buildSteps[prevJ].y},
                    s2BSnext = {'x': shape2.x+shape2.buildSteps[nextJ].x, 'y': shape2.y+shape2.buildSteps[nextJ].y};
                if(maxSquareDist >= Math.pow(s1BSprev.x - s2BSprev.x, 2) + Math.pow(s1BSprev.y - s2BSprev.y, 2)) {
                    commonSegmentFound = true;
                    commonSegment = {
                        's1_index1': i,
                        's1_index2': prevI,
                        's2_index1': j,
                        's2_index2': prevJ
                    };
                } else if(maxSquareDist >= Math.pow(s1BSprev.x - s2BSnext.x, 2) + Math.pow(s1BSprev.y - s2BSnext.y, 2)) {
                    commonSegmentFound = true;
                    commonSegment = {
                        's1_index1': i,
                        's1_index2': prevI,
                        's2_index1': j,
                        's2_index2': nextJ
                    };
                } else if(maxSquareDist >= Math.pow(s1BSnext.x - s2BSprev.x, 2) + Math.pow(s1BSnext.y - s2BSprev.y, 2)) {
                    commonSegmentFound = true;
                    commonSegment = {
                        's1_index1': i,
                        's1_index2': nextI,
                        's2_index1': j,
                        's2_index2': prevJ
                    };
                } else if(maxSquareDist >= Math.pow(s1BSnext.x - s2BSnext.x, 2) + Math.pow(s1BSnext.y - s2BSnext.y, 2)) {
                    commonSegmentFound = true;
                    commonSegment = {
                        's1_index1': i,
                        's1_index2': nextI,
                        's2_index1': j,
                        's2_index2': nextJ
                    };
                }
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

        //TODO: fusionner 2 arc de cercles qui sont côte à côte si c'est le même centre ?
        if(Math.abs(commonSegment.s1_index1-commonSegment.s1_index2)<=1) {
            //Début forme 1:
            for(var i=0; i<=Math.min(commonSegment.s1_index1,commonSegment.s1_index2); i++)
                newBS.push(shape1.buildSteps[i].getCopy());

            //Forme 2:
            var firstIndex = commonSegment.s1_index1 < commonSegment.s1_index2 ? commonSegment.s2_index1 : commonSegment.s2_index2;
            var secondIndex = commonSegment.s1_index1 < commonSegment.s1_index2 ? commonSegment.s2_index2 : commonSegment.s2_index1;
            if(Math.abs(commonSegment.s2_index1-commonSegment.s2_index2)<=1) {
                if(firstIndex<secondIndex) {
                    for(var i=firstIndex-1; i>=0; i--) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    for(var i=shape2.buildSteps.length-2; i>=secondIndex; i--) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case1");
                } else {
                    for(var i=firstIndex+1; i<shape2.buildSteps.length; i++) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    for(var i=1; i<secondIndex; i++) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case2");
                }
            } else {
                if(firstIndex<secondIndex) { //firstIndex = 0, secondIndex = shape2.buildSteps.length - 2
                    for(var i=1; i<shape2.buildSteps.length-2; i++) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case3");
                } else {
                    for(var i=shape2.buildSteps.length-3; i>=1; i--) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case4");
                }
            }

            //Fin forme 1:
            for(var i=Math.max(commonSegment.s1_index1,commonSegment.s1_index2); i<shape1.buildSteps.length; i++)
                newBS.push(shape1.buildSteps[i].getCopy());
        } else {
            //index{1,2} = 0, index{2,1} = shape1.buildSteps.length - 2

            //Début forme 1:
            for(var i=0; i<=Math.max(commonSegment.s1_index1, commonSegment.s1_index2); i++)
                newBS.push(shape1.buildSteps[i].getCopy());

            //Forme 2:
            var firstIndex = commonSegment.s1_index1 < commonSegment.s1_index2 ? commonSegment.s2_index2 : commonSegment.s2_index1;
            var secondIndex = commonSegment.s1_index1 < commonSegment.s1_index2 ? commonSegment.s2_index1 : commonSegment.s2_index2;
            if(Math.abs(commonSegment.s2_index1-commonSegment.s2_index2)<=1) {
                if(firstIndex<secondIndex) {
                    for(var i=firstIndex-1; i>=0; i--) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    for(var i=shape2.buildSteps.length-2; i>secondIndex; i--) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case5");
                } else {
                    for(var i=firstIndex+1; i<shape2.buildSteps.length; i++) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    for(var i=1; i<secondIndex; i++) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case6");
                }
            } else {
                if(firstIndex<secondIndex) { //firstIndex = 0, secondIndex = shape2.buildSteps.length - 2
                    for(var i=1; i<shape2.buildSteps.length-2; i++) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case7");
                } else {
                    for(var i=shape2.buildSteps.length-3; i>=1; i--) {
                        var b = shape2.buildSteps[i].getCopy();
                        b.setCoordinates(b.x - decalage.x, b.y - decalage.y);
                        newBS.push(b);
                    }
                    //console.log("case8");
                }
            }

            //Fin forme1:
            newBS.push(shape1.buildSteps[0].getCopy());
        }

        //Translation des buildSteps pour qu'elles soient centrées:
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
