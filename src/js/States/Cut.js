/**
 * Cette classe permet de dupliquer une forme au canvas
 */
function CutState(app) {
    this.app = app;
    this.name = "cut_shape";

    this.shape = null;
    this.firstPoint = null;
    this.centerPoint = null;
    this.lastPoint = null;
}

App.heriter(CutState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
CutState.prototype.reset = function(){
    this.shape = null;
    this.firstPoint = null;
    this.centerPoint = null;
    this.lastPoint = null;
};

/**
 * Click sur le canvas
 * @param point: {x: int, y: int}
 */
CutState.prototype.click = function(point) {
    //On sélectionne la forme
    if(!this.shape) {
        var list = this.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
        if(list.length==0)
            return;
        this.shape = list.pop();
        return;
    }

    var list = this.app.workspace.pointsNearPoint(new Point(point.x, point.y, null, null))
    if(list.length==0)
        return;
    var pointObj = list.pop();

    //On ajoute le premier point (ce doit être un point sur un segment).
    if(!this.firstPoint && !this.centerPoint) {
        if(pointObj.type=="vertex" || pointObj.type=="division") {
            this.firstPoint = pointObj;
        }
        return;
    }

    //On ajoute un second point qui est le centre
    if(!this.centerPoint && pointObj.type=="center") {
        this.centerPoint = pointObj;
        return;
    }

    //On ajoute le dernier point:
    if(pointObj.type!="vertex" && pointObj.type!="division")
        return;
    if(pointObj == this.firstPoint)
        return;
    this.lastPoint = pointObj;

    this.cutShape(); //Le découpage peut ne pas se faire dans certains cas, voir le détail dans la fonction.
};

/**
 * Effectue le découpage.
 */
CutState.prototype.cutShape = function() {
    this.shape.__computeFinalBuildStepsPoints();

    //Générer la liste ordonnée des points autour de la forme (sommets, et points sur les segments/arcs)
    var shapePointsList = [ this.shape.buildSteps[0] ], //Contiens des BuildStep et des Point.
        precision = this.app.settings.get('precision'),
        prevBSPoint = null;
    for(var i=1; i<this.shape.buildSteps.length;i++) {
        var start_pos = this.shape.buildSteps[i-1].getFinalPoint(prevBSPoint); //vaut null la première fois, pas grave car non utilisé cette fois là.
        prevBSPoint = start_pos;
        var bs = this.shape.buildSteps[i],
            pt1 = bs,
            pt2 = prevBSPoint,
            spList = [];

        if(bs.type=="line") {
            //Trouver les points qui se trouvent sur le segment actuel:
            for(var j=0; j<this.shape.segmentPoints.length; j++) {
                var isOnSeg = false,
                    sp = this.shape.segmentPoints[j],
                    dist = Math.sqrt(Math.pow(sp.x - bs.x, 2) + Math.pow(sp.y - bs.y, 2)),
                    pt3 = sp;
                if(Math.abs((pt3.x-pt1.x) * (pt2.y-pt1.y) - (pt2.x-pt1.x) * (pt3.y-pt1.y))<precision) { //pt1,2,3 alignés
                    //déterminant de (AB, AC) est nul!
                    if((pt1.x-pt3.x) * (pt2.x-pt3.x) + (pt1.y-pt3.y) * (pt2.y-pt3.y) <= precision) { //pt3 entre pt1 et pt2
                        //produit scalaire de CA, CB est négatif ou nul!
                        spList.push({
                            'point': sp,
                            'dist': dist
                        });
                    }
                }
            }
            //Les trier
            spList.sort(function(a, b){
                if(a.dist > b.dist)
                    return -1; //Trier a avant b.
                return 1; //Trier a après b.
            });

        }
        else if(bs.type=="arc") {
            //Trouver les points qui se trouvent sur l'arc de cercle actuel:

            var center = {'x': bs.x, 'y': bs.y},
    			start_angle = window.app.positiveAtan2(start_pos.y-center.y, start_pos.x-center.x),
    			end_angle = null,
                rayon = Math.sqrt(Math.pow((start_pos.x - center.x), 2) + Math.pow((start_pos.y - center.y), 2));
    		if(bs.direction) { //sens anti-horloger
    			end_angle = window.app.positiveAngle(start_angle + bs.angle);
    		} else {
    			end_angle = window.app.positiveAngle(start_angle - bs.angle);
    		}

            for(var j=0; j<this.shape.segmentPoints.length; j++) {
                var sp = this.shape.segmentPoints[j],
                    dist = Math.sqrt(Math.pow((sp.x - center.x), 2) + Math.pow((sp.y - center.y), 2)),
                    spAngle = window.app.positiveAtan2(sp.y-center.y, sp.x-center.x);

                if(dist - rayon <= precision && window.app.isAngleBetweenTwoAngles(start_angle, end_angle, bs.direction, spAngle)) {
                    spList.push({
                        'point': sp,
                        'spAngle': spAngle
                    });
                }
            }

            //Les trier
            spList.sort(function(a, b){
                if(bs.direction) { //Sens anti-horloger (sens trigonométrique)
                    var tmp = end_angle + 2*Math.PI;
                    return (tmp - b.spAngle) - (tmp - a.spAngle); // si négatif, trie a avant b.
            	} else { //Le sens inverse
                    var tmp = end_angle - 2*Math.PI;
                    return (b.spAngle - tmp) - (a.spAngle - tmp);
            	}
            });
        } else {
            console.log("unknown type");
        }
        if(bs.type=="arc")
            shapePointsList.push(this.shape.buildSteps[i]); //Ajouter l'arc (pour avoir la référence vers l'arc).
        //Ajouter les points
        spList.forEach(function(val){
            shapePointsList.push(val.point);
        });
        if(bs.type=="line")
            shapePointsList.push(this.shape.buildSteps[i]); //Ajouter le sommet
    }

    console.log(shapePointsList);

    //Retrouver le point de début et de fin du découpage:
    var indexFirstPoint = -1,
        indexLastPoint = -1;

    var tmpSegId = -1, isOnSameSegment = false, firstSegId = -1, that = this;
    shapePointsList.forEach(function(val, index){
        if(val.type=="arc") return;
        if(val.type=="vertex") tmpSegId++;

        if(val.x==that.firstPoint.x && val.y==that.firstPoint.y)
            indexFirstPoint = index;
        if(val.x==that.lastPoint.x && val.y==that.lastPoint.y)
            indexLastPoint = index;

        if(val==that.lastPoint || val==that.firstPoint) {
            if(firstSegId<0)
                firstSegId = tmpSegId;
            else if(firstSegId==tmpSegId || (val.type=="vertex" && firstSegId==tmpSegId-1))
                isOnSameSegment = true;
        }

    });
    if(indexFirstPoint<0 || indexLastPoint<0) {
        console.log("CutShape: point not found...");
        return;
    }

    if(isOnSameSegment && !this.centerPoint) { //Si les 2 points sont sur le même segment et qu'on ne passe pas par le centre.
        return;
    }

    if(indexFirstPoint > indexLastPoint) { //On inverse les 2 points.
        var tmp = indexFirstPoint;
        indexFirstPoint = indexLastPoint;
        indexLastPoint = tmp;
        tmp = this.firstPoint;
        this.firstPoint = this.lastPoint;
        this.lastPoint = tmp;
    }

    //#####################
    //Construire la forme 1
    //#####################

    var shape1BS = [], //buildsteps
        shape1SP = [], //segmentpoints
        lastBS = null, //la dernière buildStep à avoir été ajoutée à la forme1. il y en a d'office une!
        prevLastBS = null,
        firstCoords = null;
    //Première BuildStep
    if(shapePointsList[indexFirstPoint] instanceof ShapeStep) { //Ce ne peut pas être un arc de cercle (car pas d'extrémité sélectionnable)
        var cp = shapePointsList[indexFirstPoint].getCopy();
        shape1BS.push(cp);
        lastBS = cp;
        firstCoords = {'x': cp.x, 'y': cp.y};
    } else {
        var relCoordFirstPoint = shapePointsList[indexFirstPoint].getRelativeCoordinates();
        shape1BS.push(ShapeStep.getLine(relCoordFirstPoint.x, relCoordFirstPoint.y));

        //Trouver la buildStep précédente:
        var prevBS = null, prevPrevBS = null;
        for(var i=indexFirstPoint-1;i>=0;i--) {
            if(prevBS) {
                if(shapePointsList[i] instanceof ShapeStep) {
                    prevPrevBS = shapePointsList[i];
                    break;
                }
                continue;
            }
            if(shapePointsList[i] instanceof ShapeStep) {
                prevBS = shapePointsList[i];
            }
        }
        if(!prevBS) {
            console.log("CutState: buildStep not found!");
            return;
        }

        if(prevBS.type=="line") {
            var cp = prevBS.getCopy();
            //shape1BS.push(cp);
            //lastBS = cp; //TODO ?? il devrait d'office y avoir un lastBS.
            firstCoords = {'x': relCoordFirstPoint.x, 'y': relCoordFirstPoint.y};
        } else { //arc
            var arc = prevBS.getCopy();
            lastBS = arc;
            prevLastBS = prevPrevBS;
            //Le centre ne change pas. Il faut juste diminuer l'angle.
            var center = {'x': prevBS.x, 'y': prevBS.y},
    			start_angle = window.app.positiveAtan2(prevPrevBS.__finalPoint.y-center.y, prevPrevBS.__finalPoint.x-center.x),
                new_angle = window.app.positiveAtan2(relCoordFirstPoint.y-center.y, relCoordFirstPoint.x-center.x),
    			end_angle = null,
                angle = prevBS.angle;
    		if(prevBS.direction) { //sens anti-horloger
    			end_angle = window.app.positiveAngle(start_angle + prevBS.angle);
                if(new_angle >= start_angle) {
                    angle -= (new_angle - start_angle);
                } else {
                    angle = end_angle - new_angle;
                }
    		} else {
    			end_angle = window.app.positiveAngle(start_angle - prevBS.angle);
                if(new_angle <= start_angle) {
                    angle -= (start_angle - new_angle);
                } else {
                    angle = new_angle - end_angle;
                }
    		}
            arc.angle = angle;
            shape1BS.push(arc);
            firstCoords = {'x': prevPrevBS.__finalPoint.x, 'y': prevPrevBS.__finalPoint.y};
        }
    }

    //BuildSteps suivantes (il peut y en avoir 0)
    for(var i=indexFirstPoint+1; i<indexLastPoint; i++) {
        if(shapePointsList[i] instanceof ShapeStep) {
            var cp = shapePointsList[i].getCopy();
            shape1BS.push(cp);
            prevLastBS = lastBS;
            lastBS = cp;
        } else
            shape1SP.push(shapePointsList[i]);
    }

    if(shapePointsList[indexLastPoint] instanceof ShapeStep) { //ne peut pas être un arc (car pas d'extrémité sélectionnable)
        var cp = shapePointsList[i].getCopy();
        shape1BS.push(cp);
        prevLastBS = lastBS;
        lastBS = cp;
    } else if(!lastBS || lastBS.type=="line") {
        var relCoordLastPoint = shapePointsList[indexLastPoint].getRelativeCoordinates();
        shape1BS.push(ShapeStep.getLine(relCoordLastPoint.x, relCoordLastPoint.y));
    }

    //Modifier si nécessaire la dernière buildStep:
    if(!(shapePointsList[indexLastPoint] instanceof ShapeStep) && lastBS && lastBS.type=="arc") {
        //Le centre ne change pas. Il faut juste diminuer l'angle.
        var relCoordLastPoint = shapePointsList[indexLastPoint].getRelativeCoordinates(),
            center = {'x': lastBS.x, 'y': lastBS.y},
            start_angle = window.app.positiveAtan2(prevLastBS.__finalPoint.y-center.y, prevLastBS.__finalPoint.x-center.x),
            end_angle = null,
            new_angle = window.app.positiveAtan2(relCoordLastPoint.y-center.y, relCoordLastPoint.x-center.x),
            angle = lastBS.angle;
        if(lastBS.direction) { //sens anti-horloger
            end_angle = window.app.positiveAngle(start_angle + lastBS.angle);
            if(new_angle <= end_angle) {
                angle -= (end_angle - new_angle);
            } else {
                angle -= (end_angle + (2*Math.PI - new_angle));
            }
        } else {
            end_angle = window.app.positiveAngle(start_angle - lastBS.angle);
            if(new_angle >= end_angle) {
                angle -= (new_angle - end_angle);
            } else {
                angle -= (new_angle + (2*Math.PI - end_angle));
            }
        }
        lastBS.angle = angle;
    }

    if(this.centerPoint) {
        shape1BS.push(ShapeStep.getLine(this.centerPoint.x, this.centerPoint.y));
    }

    shape1BS.push(ShapeStep.getLine(firstCoords.x, firstCoords.y));

    var shape1 = this.shape.getCopy(); //TODO: modifier centre gravité. (faire fct dans shape).
    shape1.buildSteps = shape1BS;
    shape1.segmentPoints = shape1SP;
    shape1.otherPoints = [];
    shape1.__computePoints();
    var coords = shape1.getCoordinates();
    shape1.x = coords.x - 30;
    shape1.y = coords.y - 30;

    //TODO faire la seconde forme.

    this.app.workspace.addShape(shape1);
    this.app.canvas.refresh();
    this.reset();
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
CutState.prototype.draw = function(canvas, mouseCoordinates){
    //dessine la forme qui est en train d'être bougée lors d'une duplication

    //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
    var xDiff = this.clickCoordinates.x - this.newShape.x;
    var yDiff = this.clickCoordinates.y - this.newShape.y;

    var newX = mouseCoordinates.x - xDiff;
    var newY = mouseCoordinates.y - yDiff;

    canvas.drawMovingShape(this.newShape, {"x": newX, "y": newY});
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
CutState.prototype.makeHistory = function(shape){
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
CutState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
        console.log("DuplicateState.cancelAction: shape not found...");
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
CutState.prototype.getElementsToHighlight = function(overflownShape){
    var data = {
        'shapes': [overflownShape],
        'segments': [],
        'points': []
    };

    return data;
};

/**
 * Annuler l'action en cours
 */
CutState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
CutState.prototype.mouseup = function(point){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
CutState.prototype.mousedown = function(){};

/**
 * démarrer l'état
 */
CutState.prototype.start = function(params){};
