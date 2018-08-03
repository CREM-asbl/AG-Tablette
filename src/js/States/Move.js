/**
 * Cette classe permet de déplacer une forme (ou un ensemble de formes liées) sur le canvas
 */
function MoveState(app) {
    this.app = app;
    this.name = "move_shape";

    //La forme que l'on a sélectionnée
    this.selectedShape = null;

    //l'ensemble des formes liées à la forme actuelle.
    this.shapesList = [];

    //coordonnées de la souris lorsque le déplacement a commencé
    this.clickCoordinates = null;

    this.isMoving = false;
}

App.heriter(MoveState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
MoveState.prototype.reset = function(){
    this.selectedShape = null;
    this.shapesList = [];
    this.clickCoordinates = null;
    this.isMoving = false;
};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
MoveState.prototype.mousedown = function(point){
    var list = window.app.workspace.shapesOnPoint(point);
    if(list.length>0) {
        this.isMoving = true;
        this.clickCoordinates = point;
        this.selectedShape = list.pop();
        var group = this.app.workspace.getShapeGroup(this.selectedShape, "system");
        if(group)
            this.shapesList = group.slice();
        else
            this.shapesList = [this.selectedShape];

        var group = this.app.workspace.getShapeGroup(this.selectedShape, "user");
        if(group) {
            for(var i=0;i<group.length;i++) {
                var g = this.app.workspace.getShapeGroup(group[i], "system");
                if(g) {
                    for(var j=0;j<g.length;j++) {
                        if(this.shapesList.indexOf(g[j])==-1)
                            this.shapesList.push(g[j]);
                    }
                } else {
                    if(this.shapesList.indexOf(group[i])==-1)
                        this.shapesList.push(group[i]);
                }
            }
        }
    }
};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
MoveState.prototype.mouseup = function(point){
    if(this.isMoving) {
        for(var i=0;i<this.shapesList.length;i++) {
            //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
            var xDiff = this.clickCoordinates.x - this.shapesList[i].x;
            var yDiff = this.clickCoordinates.y - this.shapesList[i].y;

            //nouvelles coordonnées de la forme: la position de la souris - le décalage.
            var newX = point.x - xDiff;
			var newY = point.y - yDiff;



            this.shapesList[i].setCoordinates({"x": newX, "y": newY});
            this.shapesList[i].recomputePoints();
        }

        if(this.app.workspace.isGridShown) {
            var t = this.app.workspace.getClosestGridPoint(this.shapesList);
            for(var i=0;i<this.shapesList.length;i++) {
                this.shapesList[i].x += t.grid.x - t.shape.x;
                this.shapesList[i].y += t.grid.y - t.shape.y;
                this.shapesList[i].recomputePoints();
            }
        } else if(this.app.workspace.automaticAdjustment) {
            var bestSegment = null; //segment du groupe de forme qui va être rapproché d'un segment d'une forme externe.
            var otherShapeSegment = null; //le segment de la forme externe correspondante.
            var segmentScore = 1000*1000*1000; //somme des carrés des distances entre les sommets des 2 segments ci-dessus.

            var total_elligible_segments = 0;
            for(var i=0;i<this.shapesList.length;i++) { //Pour chacune des formes en cours de déplacement:
                var shape = this.shapesList[i];
                var p1;
                var p2 = this.app.workspace.pointsNearPoint(this.app.workspace.points, {'x': shape.points[0].absX, 'y': shape.points[0].absY});
                shape.points.push(shape.points[0]);
                for(var j=1; j<shape.points.length; j++) { //pour chaque segment de la forme
                    p1 = p2;
                    p2 = this.app.workspace.pointsNearPoint(this.app.workspace.points, {'x': shape.points[j].absX, 'y': shape.points[j].absY});

                    var seg_length = Math.sqrt(Math.pow(shape.points[j].absX - shape.points[j-1].absX, 2) + Math.pow(shape.points[j].absY - shape.points[j-1].absY, 2));
                    for(var k=0;k<p1.length;k++) { //pour chacun des points proches du premier point du segment (points[j-1])
                        if(this.shapesList.indexOf(p1[k].shape)!=-1)
                            continue;
                        for(var l=0;l<p2.length;l++) { //pour chacun des points proches du second point du segment (points[j])
                            if(this.shapesList.indexOf(p2[l].shape)!=-1)
                                continue;
                            if(p1[k].shape==p2[l].shape) {
                                var len = Math.sqrt(Math.pow(p1[k].absX - p2[l].absX, 2) + Math.pow(p1[k].absY - p2[l].absY, 2));
                                var diff = Math.abs(len-seg_length);
                                if(diff<=2) {
                                    //Segment élligible.
                                    total_elligible_segments++;

                                    var score = Math.pow(p1[k].absX - shape.points[j-1].absX, 2) + Math.pow(p1[k].absY - shape.points[j-1].absY, 2);
                                    score    += Math.pow(p2[l].absX - shape.points[j].absX, 2) + Math.pow(p2[l].absY - shape.points[j].absY, 2);

                                    if(score < segmentScore) {
                                        segmentScore = score;
                                        otherShapeSegment = [
                                            {'x': p1[k].absX, 'y': p1[k].absY},
                                            {'x': p2[l].absX, 'y': p2[l].absY}
                                        ];
                                        bestSegment = [
                                            {'x': shape.points[j-1].absX, 'y': shape.points[j-1].absY},
                                            {'x': shape.points[j].absX, 'y': shape.points[j].absY}
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }
                shape.points.pop();
            }

            //Déplacer si nécessaire
            if(bestSegment) { //On déplace la forme pour que bestSegment et otherShapeSegment deviennent identiques.
                //Translater le groupe de formes pour que les 2 segments aient un point en commun
                for(var i=0;i<this.shapesList.length;i++) {
                    this.shapesList[i].x += otherShapeSegment[0].x - bestSegment[0].x;
                    this.shapesList[i].y += otherShapeSegment[0].y - bestSegment[0].y;

                    this.shapesList[i].recomputePoints();
                }

                //Faire une rotation du groupe de formes, ayant pour centre otherShapeSegment[0]
                //F
                bestSegment[1].x -= bestSegment[0].x;
                bestSegment[1].y -= bestSegment[0].y;
                var t = {'x': otherShapeSegment[1].x-otherShapeSegment[0].x, 'y': otherShapeSegment[1].y-otherShapeSegment[0].y};
                var a = this.app.getAngleBetweenPoints({'x': 0, 'y': 0}, t);
                var b = this.app.getAngleBetweenPoints({'x': 0, 'y': 0}, bestSegment[1]);
                var angle = a-b;

                for(var i=0;i<this.shapesList.length;i++) {
                    var n = this.app.states.rotate_shape.computeNewShapePos(this.shapesList[i], angle, otherShapeSegment[0]);
                    this.shapesList[i].x = n.x;
                    this.shapesList[i].y = n.y;

                    for(var j=0;j<this.shapesList[i].buildSteps.length;j++) {
                		var transformation = this.app.states.rotate_shape.computePointPosition(this.shapesList[i].buildSteps[j], angle, otherShapeSegment[0]);
                		this.shapesList[i].buildSteps[j].x = transformation.x;
                		this.shapesList[i].buildSteps[j].y = transformation.y;
                	}
                    this.shapesList[i].recomputePoints();
                }

            }
        }

        this.reset();
        this.app.canvas.refresh();
    }
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
MoveState.prototype.draw = function(canvas, mouseCoordinates){
    //dessine la forme/le groupe de formes qui est en train d'être bougé
    for(var i=0;i<this.shapesList.length;i++) {
        //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
        var xDiff = this.clickCoordinates.x - this.shapesList[i].x;
        var yDiff = this.clickCoordinates.y - this.shapesList[i].y;

        var newX = mouseCoordinates.x - xDiff;
        var newY = mouseCoordinates.y - yDiff;

        canvas.drawMovingShape(this.shapesList[i], {"x": newX, "y": newY});
    }
};

/**
 * Annuler l'action en cours
 */
MoveState.prototype.abort = function(){};

/**
 * démarrer l'état
 */
MoveState.prototype.start = function(){};

/**
 * Appelée lorsque l'événement click est déclanché sur le canvas
 */
MoveState.prototype.click = function(){};
