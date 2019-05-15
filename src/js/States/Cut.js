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

/**
 * Réinitialiser l'état
 */
CutState.prototype.reset = function () {
    this.shape = null;
    this.firstPoint = null;
    this.centerPoint = null;
    this.lastPoint = null;
};

/**
 * Click sur le canvas
 * @param point: {x: int, y: int}
 */
CutState.prototype.click = function (point, selection) {
    //On sélectionne la forme
    if (!this.shape) {
        var list = this.app.workspace.shapesOnPoint(new Point(point.x, point.y, null, null));
        if (list.length > 0 || selection.shape) {
            this.shape = selection.shape ? selection.shape : list.pop();
            this.app.canvas.refresh();
        }
        return;
    }

    var list = this.app.workspace.pointsNearPoint(new Point(point.x, point.y, null, null))

    if (list.length === 0) {
        console.log("CutState: Pas de point proche");
        return;
    }

    var pointsPossibles = list.filter(point => point.shape === this.shape)

    if (pointsPossibles.length === 0) {
        console.log("Cutstate: le point ne fait pas partie de la forme sélectionnée");
        return;
    }

    pointObj = pointsPossibles[0]

    //On ajoute le premier point (ce doit être un point sur un segment).
    if (!this.firstPoint && !this.centerPoint) {
        if (pointObj.type == "vertex" || pointObj.type == "division") {
            this.firstPoint = pointObj;
            this.app.canvas.refresh();
            console.log("CutState: sélection du premier point");
        } else {
            console.log("CutState: Le point doit être sur un segment");
        }
        return;
    }

    //On ajoute un second point qui est le centre
    if (!this.centerPoint && pointObj.type == "center") {
        this.centerPoint = pointObj;
        this.app.canvas.refresh();
        console.log("CutState: sélection du centre!");
        return;
    }

    //On ajoute le dernier point:
    if (pointObj.type != "vertex" && pointObj.type != "division") {
        console.log("CutState: Le point doit être sur un segment (2)");
        return;
    }
    if (pointObj == this.firstPoint) {
        console.log("CutState: Le point final est identique au point d'origine");
        return;
    }
    this.lastPoint = pointObj;

    this.cutShape(); //Le découpage peut ne pas se faire dans certains cas, voir le détail dans la fonction.
};

/**
 * Effectue le découpage.
 * TODO: factoriser cette fonction...
 */
CutState.prototype.cutShape = function () {
    this.shape.__computeFinalBuildStepsPoints();

    /* Fonctionnement:
        1. Générer une liste ordonnée des points autour de la forme, composée
        des sommets (BuildStep de type "line"), des points sur les segments ou arcs de cercles (Point), et des
        BuildStep de type 'arc' (qui ne représentent pas un point si la forme principale est un cercle)
        La liste étant ordonnée, une buildStep de type
        'line' se trouve après les points qui se trouvent sur le segment reliant cette
        buildstep à la buildStep précédente. Une BuildStep de type 'arc' se trouve
        avant les points qui se trouvent sur cet arc de cercle. Si la forme n'est pas
        un cercle, après la buidlStep de type arc et les points se trouvant sur l'arc,
        un point de type finalarcpoint est ajouté à la liste. La liste contient
        des objets {'type': String, 'data': Object}. Type vaut buildstep, arcpoint, linepoint ou finalarcpoint.

        2. Retrouver les 2 objets de cette liste qui correspondent aux points de départ
        et d'arrivée. Il ne peut s'agir d'une BuildStep de type arc (un arc n'étant pas un objet
        sélectionnable).

        3. Générer les 2 formes. L'une des formes reprend les éléments de la liste
        situés entre indexFirstPoint et indexLastPoint, et l'autre les éléments
        situés entre indexLastPoint et la fin de la liste, et les éléments situés
        entre 0 et indexFirstPoint.
     */


    //Générer la liste ordonnée des points autour de la forme
    var shapePointsList = [{ 'type': 'buildstep', 'data': this.shape.buildSteps[0] }],
        isTheShapeACircle = (this.shape.buildSteps.length == 2 && this.shape.buildSteps[1].type == "arc");

    var precision = this.app.settings.get('precision'),
        prevBSFinalPoint = null;
    for (var i = 1; i < this.shape.buildSteps.length; i++) {
        prevBSFinalPoint = this.shape.buildSteps[i - 1].getFinalPoint(prevBSFinalPoint); //vaut null la première fois, pas grave car non utilisé cette fois là.
        var bs = this.shape.buildSteps[i],
            pt1 = bs,
            pt2 = prevBSFinalPoint,
            spList = [];

        if (bs.type == "line") {
            //Trouver les points qui se trouvent sur le segment actuel:
            for (var j = 0; j < this.shape.segmentPoints.length; j++) {
                var isOnSeg = false,
                    sp = this.shape.segmentPoints[j],
                    dist = Math.sqrt(Math.pow(sp.x - bs.x, 2) + Math.pow(sp.y - bs.y, 2)),
                    pt3 = sp;
                if (Math.abs((pt3.x - pt1.x) * (pt2.y - pt1.y) - (pt2.x - pt1.x) * (pt3.y - pt1.y)) < precision) { //pt1,2,3 alignés
                    //déterminant de (AB, AC) est nul!
                    if ((pt1.x - pt3.x) * (pt2.x - pt3.x) + (pt1.y - pt3.y) * (pt2.y - pt3.y) <= precision) { //pt3 entre pt1 et pt2
                        //produit scalaire de CA, CB est négatif ou nul!
                        spList.push({
                            'point': sp,
                            'dist': dist
                        });
                    }
                }
            }

            //Les trier
            spList.sort(function (a, b) {
                if (a.dist > b.dist)
                    return -1; //Trier a avant b.
                return 1; //Trier a après b.
            });

            //Les ajouter:
            spList.forEach(function (val) {
                shapePointsList.push({ 'type': 'linepoint', 'data': val.point });
            });

            //Ajouter la buildStep:
            shapePointsList.push({ 'type': 'buildstep', 'data': this.shape.buildSteps[i] });
        } else if (bs.type == "arc") {
            //Trouver les points qui se trouvent sur l'arc de cercle actuel:
            var center = { 'x': bs.x, 'y': bs.y },
                start_angle = window.app.positiveAtan2(prevBSFinalPoint.y - center.y, prevBSFinalPoint.x - center.x),
                end_angle = null,
                rayon = Math.sqrt(Math.pow((prevBSFinalPoint.x - center.x), 2) + Math.pow((prevBSFinalPoint.y - center.y), 2));
            if (!bs.direction) { //sens horloger
                end_angle = window.app.positiveAngle(start_angle + bs.angle);
            } else {
                end_angle = window.app.positiveAngle(start_angle - bs.angle);
            }

            for (var j = 0; j < this.shape.segmentPoints.length; j++) {
                var sp = this.shape.segmentPoints[j],
                    dist = Math.sqrt(Math.pow((sp.x - center.x), 2) + Math.pow((sp.y - center.y), 2)),
                    spAngle = window.app.positiveAtan2(sp.y - center.y, sp.x - center.x);

                if (dist - rayon <= precision && window.app.isAngleBetweenTwoAngles(start_angle, end_angle, bs.direction, spAngle)) {
                    spList.push({
                        'point': sp,
                        'spAngle': spAngle
                    });
                }
            }

            //Les trier
            var getAngleStatus = function (angle) {
                var end_angle_min_start_angle = (end_angle - start_angle == 0) ? 2 * Math.PI : end_angle - start_angle; //si end_angle = start_angle, on travaille sur un cercle entier (portion de cercle = 100% = 2*Math.PI)
                if (!bs.direction) {
                    if (start_angle <= angle) {
                        if (angle <= end_angle) return (angle - start_angle) / (end_angle_min_start_angle);
                        else return (angle - start_angle) / (2 * Math.PI + end_angle_min_start_angle);
                    } else {
                        return (angle + 2 * Math.PI - start_angle) / (2 * Math.PI + end_angle_min_start_angle);
                    }
                } else {
                    if (start_angle >= angle) {
                        if (angle >= end_angle) return (start_angle - angle) / (-end_angle_min_start_angle);
                        else return (start_angle - angle) / (2 * Math.PI - end_angle_min_start_angle);
                    } else {
                        return (-angle + 2 * Math.PI + start_angle) / (2 * Math.PI - end_angle_min_start_angle);
                    }
                }
            };
            spList.sort(function (a, b) {
                if (getAngleStatus(a.spAngle) > getAngleStatus(b.spAngle))
                    return 1;
                return -1;

                if (!bs.direction) { //Sens horloger
                    var tmp = end_angle + 2 * Math.PI;
                    return (tmp - b.spAngle) - (tmp - a.spAngle); // si négatif, trie a avant b.
                } else { //Le sens inverse
                    var tmp = end_angle - 2 * Math.PI;
                    return (b.spAngle - tmp) - (a.spAngle - tmp);
                }
            });

            //Ajouter l'arc:
            shapePointsList.push({ 'type': 'buildstep', 'data': this.shape.buildSteps[i] });

            //Ajouter les points
            spList.forEach(function (val) {
                shapePointsList.push({ 'type': 'arcpoint', 'data': val.point });
            });

            //Ajouter le point au bout de l'arc (sauf si c'est un cercle)
            if (!isTheShapeACircle) {
                var new_pt_coords = this.shape.buildSteps[i].getFinalPoint(prevBSFinalPoint),
                    new_pt = new Point(new_pt_coords.x, new_pt_coords.y, 'vertex', this.shape);
                shapePointsList.push({ 'type': 'finalarcpoint', 'data': new_pt });
            }
        } else {
            console.log("unknown type");
        }
    }

    //Retrouver le point de début et de fin du découpage:
    var indexFirstPoint = -1,
        indexLastPoint = -1;

    var tmpSegId = -1, isOnSameSegment = false, firstSegId = -1, that = this;
    shapePointsList.forEach(function (val, index) {
        if (val.type == "buildstep" && val.data.type == "arc") return;
        if ((val.type == "buildstep" && val.data.type == "line") || val.type == "finalarcpoint") tmpSegId++;

        var found = false;
        if (val.data.x == that.firstPoint.x && val.data.y == that.firstPoint.y) {
            indexFirstPoint = index;
            found = true;
        }
        if (val.data.x == that.lastPoint.x && val.data.y == that.lastPoint.y) {
            indexLastPoint = index;
            found = true;
        }

        if (found && (val.type == "buildstep" || val.type == 'linepoint')) {
            if (firstSegId < 0)
                firstSegId = tmpSegId;
            else if (firstSegId == tmpSegId || (val.type == "buildstep" && val.data.type == "line" && firstSegId == tmpSegId - 1))
                isOnSameSegment = true;
        }

    });
    if (indexFirstPoint < 0 || indexLastPoint < 0) {
        console.error("CutShape: point not found..."); //Ne devrait pas arriver!
        return;
    }

    if (isOnSameSegment && !this.centerPoint) { //Si les 2 points sont sur le même segment et qu'on ne passe pas par le centre.
        console.log("CutState: les points de départ et d'arrivée sont sur le même segment");
        return;
    }

    if (indexFirstPoint > indexLastPoint) { //On inverse les 2 points.
        var tmp = indexFirstPoint;
        indexFirstPoint = indexLastPoint;
        indexLastPoint = tmp;
        tmp = this.firstPoint;
        this.firstPoint = this.lastPoint;
        this.lastPoint = tmp;
    }

    //Dédoubler la liste:
    shapePointsList = shapePointsList.concat(shapePointsList.slice(1));

    //#######################
    //Construire les 2 formes
    //#######################

    var createdShapesList = [];
    for (var _shapeIndex = 0; _shapeIndex < 2; _shapeIndex++) {
        var startIndex = (_shapeIndex == 0) ? indexFirstPoint : indexLastPoint,
            stopIndex = (_shapeIndex == 0) ? indexLastPoint : ((shapePointsList.length + 1) / 2) + indexFirstPoint - 1;

        var shapeBuildSteps = [],
            shapeSegmentPoints = [],
            firstCoords = null,
            shape = this.shape.getCopy(),
            editedArc = null,
            bsFinalPoint = null,
            oldBSFinalPoint = null;

        //Première Buildstep:
        if (shapePointsList[startIndex].type == "buildstep") {
            //Il s'agit d'office d'une BuildStep de type line.
            var cp = shapePointsList[startIndex].data.getCopy();
            shapeBuildSteps.push(cp);
            firstCoords = { 'x': cp.x, 'y': cp.y };
            bsFinalPoint = firstCoords;
        } else if (shapePointsList[startIndex].type == "linepoint") {
            var bs = new ShapeStep('line', shapePointsList[startIndex].data.x, shapePointsList[startIndex].data.y);
            shapeBuildSteps.push(bs);
            firstCoords = { 'x': bs.x, 'y': bs.y };
            bsFinalPoint = firstCoords;
        } else if (shapePointsList[startIndex].type == "finalarcpoint") {
            var bs = new ShapeStep('line', shapePointsList[startIndex].data.x, shapePointsList[startIndex].data.y);
            shapeBuildSteps.push(bs);
            firstCoords = { 'x': bs.x, 'y': bs.y };
            bsFinalPoint = firstCoords;
        } else { //arcpoint
            //Point de départ:
            var bs = new ShapeStep('line', shapePointsList[startIndex].data.x, shapePointsList[startIndex].data.y);
            shapeBuildSteps.push(bs);
            //Modifier l'arc de cercle
            oldBSFinalPoint = bs;
            //Trouver l'arc
            var tmp_index = shapePointsList.slice(0, startIndex).reverse().findIndex(function (val) {
                return val.type == "buildstep";
            });
            if (tmp_index === -1) {
                console.log("Arc non trouvé...");
                return;
            }
            editedArc = shapePointsList[startIndex - 1 - tmp_index].data;
            var arc = shapePointsList[startIndex - 1 - tmp_index].data.getCopy();
            //Trouver le point de départ original de l'arc
            var prevBS = shapePointsList.slice(0, startIndex - 1 - tmp_index).reverse().find(function (val) {
                return val.type == "buildstep";
            });
            if (prevBS === undefined) {
                console.log("BuildStep précédente non trouvée...");
                return;
            }
            var originalStart = prevBS.data.__finalPoint;

            //Adapter l'arc. Le centre ne change pas, il faut juste diminuer l'angle.
            var start_angle = window.app.positiveAtan2(originalStart.y - arc.y, originalStart.x - arc.x),
                new_angle = window.app.positiveAtan2(bs.y - arc.y, bs.x - arc.x),
                end_angle = null;
            if (!arc.direction) { //sens horloger
                end_angle = window.app.positiveAngle(start_angle + arc.angle);
                if (new_angle >= start_angle) { // 8/9: >=! (couper en 7, sélectionner point tout en haut puis pt en bas à gauche)
                    arc.angle -= (new_angle - start_angle);
                } else {
                    arc.angle = end_angle - new_angle;
                }
            } else {
                end_angle = window.app.positiveAngle(start_angle - arc.angle);
                if (new_angle < start_angle) {
                    arc.angle -= (start_angle - new_angle);
                } else {
                    arc.angle = new_angle - end_angle;
                }
            }
            //console.log("new angle1: "+arc.angle);
            shapeBuildSteps.push(arc);
            bsFinalPoint = arc.getFinalPoint(bs);

            firstCoords = { 'x': bs.x, 'y': bs.y };
        }

        //BuildStep dans la forme:
        for (var i = startIndex + 1; i < stopIndex; i++) {
            if (shapePointsList[i].type == "buildstep") {
                var cp = shapePointsList[i].data.getCopy();
                oldBSFinalPoint = bsFinalPoint;
                bsFinalPoint = shapePointsList[i].data.getFinalPoint(bsFinalPoint);
                shapeBuildSteps.push(cp);
                editedArc = null;
            } else if (shapePointsList[i].type == "finalarcpoint") {
                continue;
            } else {
                var pt = shapePointsList[i].data.getCopy();
                pt.shape = shape;
                shapeSegmentPoints.push(pt);
            }
        }

        //Dernière Builstep:
        if (shapePointsList[stopIndex].type == "buildstep") {
            //Il s'agit d'office d'une BuildStep de type line.
            var cp = shapePointsList[stopIndex].data.getCopy();
            shapeBuildSteps.push(cp);
        } else if (shapePointsList[stopIndex].type == "linepoint") {
            var bs = new ShapeStep('line', shapePointsList[stopIndex].data.x, shapePointsList[stopIndex].data.y);
            shapeBuildSteps.push(bs);
        } else if (shapePointsList[stopIndex].type == "finalarcpoint") {
            //rien à faire ?
        } else { //arcpoint
            //Trouver l'arc:
            var arcIndex = shapeBuildSteps.slice().reverse().findIndex(function (val) {
                return val.type == "arc";
            });
            if (arcIndex === -1) {
                console.error("Arc non trouvé...");
                return;
            }
            arcIndex = shapeBuildSteps.length - 1 - arcIndex;
            var arc = shapeBuildSteps[arcIndex];

            //Trouver le point de départ original de l'arc
            var tmp_index = shapePointsList.slice(0, stopIndex).reverse().findIndex(function (val) {
                return val.type == "buildstep";
            });
            if (tmp_index === -1) {
                console.error("Arc non trouvé...");
                return;
            } //var old_arc = shapePointsList[stopIndex-1-tmp_index];
            var prevBS = shapePointsList.slice(0, stopIndex - 1 - tmp_index).reverse().find(function (val) {
                return val.type == "buildstep";
            });
            if (prevBS === undefined) {
                console.error("BuildStep précédente non trouvée...");
                return;
            }
            var stopPoint = shapePointsList[stopIndex].data,
                originalStart = oldBSFinalPoint; //prevBS.data.__finalPoint;
            if (editedArc && editedArc == shapePointsList[stopIndex - 1 - tmp_index].data) { //L'arc est le même que le premier arc.
                originalStart = firstCoords;
            }

            //Adapter l'arc. Le centre ne change pas, il faut juste diminuer l'angle.
            var start_angle = window.app.positiveAtan2(originalStart.y - arc.y, originalStart.x - arc.x),
                end_angle = null,
                new_angle = window.app.positiveAtan2(stopPoint.y - arc.y, stopPoint.x - arc.x);

            if (!arc.direction) { //sens horloger
                end_angle = window.app.positiveAngle(start_angle + arc.angle);
                if (new_angle <= end_angle) {
                    arc.angle -= (end_angle - new_angle);
                } else {
                    arc.angle -= (end_angle + (2 * Math.PI - new_angle));
                }
            } else {
                end_angle = window.app.positiveAngle(start_angle - arc.angle);
                if (new_angle >= end_angle) {
                    arc.angle -= (new_angle - end_angle);
                } else {
                    arc.angle -= (new_angle + (2 * Math.PI - end_angle));
                }
            }

            //Fix bug... à corriger autrement si possible.
            if ((!editedArc || editedArc != shapePointsList[stopIndex - 1 - tmp_index].data) && (2 * Math.PI - arc.angle) <= 0.0001) {
                shapeBuildSteps.splice(arcIndex, 1);
            }
            //console.log("new angle2: "+arc.angle);
        }

        //Retirer les arcs dont l'angle vaut 0:
        for (var i = 0; i < shapeBuildSteps.length; i++) {
            if (shapeBuildSteps[i].type == "arc" && shapeBuildSteps[i].angle <= 0.000001) {
                shapeBuildSteps.splice(i, 1);
                i--;
            }
        }

        //Si 2 arcs de cercles qui se suivent ont le même centre, les fusionner:
        for (var i = 0; i < shapeBuildSteps.length - 1; i++) {
            var s1 = shapeBuildSteps[i],
                s2 = shapeBuildSteps[i + 1];
            if (s1.type == "arc" && s2.type == "arc" && s1.x == s2.x && s1.y == s2.y && s1.direction == s2.direction) {
                s1.angle += s2.angle;
                s1.__finalPoint = s2.__finalPoint;
                s1.updateId++;
                shapeBuildSteps.splice(i + 1, 1); //supprimer le second arc.
                i--; //réanalyser ce nouvel arc avec le suivant.
            }
        }

        //Ajouter le point central:
        if (this.centerPoint) {
            shapeBuildSteps.push(new ShapeStep('line', this.centerPoint.x, this.centerPoint.y));
        }

        //Ajouter le point de départ:
        shapeBuildSteps.push(new ShapeStep('line', firstCoords.x, firstCoords.y));


        shape.buildSteps = shapeBuildSteps;
        shape.segmentPoints = shapeSegmentPoints;
        shape.otherPoints = [];
        shape.name = "Custom";
        shape.familyName = "Custom";
        var centerOffset = shape.centerShape(); //Définir le nouveau centre de la forme. (à améliorer?)
        shape.__computePoints();
        var coords = shape.getCoordinates();
        shape.x = coords.x + 2 * centerOffset.x + 20;
        shape.y = coords.y + 2 * centerOffset.y + 20;

        this.app.workspace.addShape(shape);
        createdShapesList.push(shape);
    }

    this.makeHistory(createdShapesList[0], createdShapesList[1]);

    this.reset();
    this.app.canvas.refresh();


    return;
};

/**
 * Appelée par la fonction de dessin, après avoir dessiné les formes
 * @param canvas: référence vers la classe Canvas
 */
CutState.prototype.draw = function (canvas, mouseCoordinates) {
    //dessine la forme qui est en train d'être bougée lors d'une duplication

    //calculer le décalage X et Y entre le centre de la forme et le click de départ de la translation
    var xDiff = this.clickCoordinates.x - this.newShape.x;
    var yDiff = this.clickCoordinates.y - this.newShape.y;

    var newX = mouseCoordinates.x - xDiff;
    var newY = mouseCoordinates.y - yDiff;

    canvas.drawMovingShape(this.newShape, { "x": newX, "y": newY });
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
CutState.prototype.makeHistory = function (shape1, shape2) {
    var data = {
        'shape1_id': shape1.id,
        'shape2_id': shape2.id
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
CutState.prototype.cancelAction = function (data, callback) {
    var ws = this.app.workspace;

    for (var i = 1; i <= 2; i++) {
        var shape = ws.getShapeById(data['shape' + i + '_id']);
        if (!shape) {
            console.error("CutState.cancelAction: shape not found...");
            callback();
            return;
        }
        ws.removeShape(shape);
    }

    callback();
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
CutState.prototype.getElementsToHighlight = function (overflownShape, mouseCoordinates) {
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    if (!this.shape) {
        data.shapes.push(overflownShape);
    } else {
        var list = this.app.workspace.pointsNearPoint(new Point(mouseCoordinates.x, mouseCoordinates.y, null, null));
        list.reverse();
        for (var i = 0; i < list.length; i++) {
            var pt = list[i];
            if (pt.shape == this.shape) {
                data.points.push({ 'shape': this.shape, 'point': pt });
                break;
            } //TODO: si c'est pas un sommet ni un point de segment (= si c'est un otherPoint), ne pas le sélectionner si on a pas encore sélectionné le premier point.
        }
    }


    return data;
};

/**
 * Annuler l'action en cours
 */
CutState.prototype.abort = function () { };

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
CutState.prototype.mouseup = function (point) { };

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
CutState.prototype.mousedown = function () { };

/**
 * démarrer l'état
 */
CutState.prototype.start = function (params) { };
