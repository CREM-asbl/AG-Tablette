/**
 * Cette classe permet de diviser un segment en plusieurs "parties" de tailles égales en créant des points entre ces parties.
 * Le segment peut être une arrête d'une forme, ou être défini par 2 points existants.
 *
 *
 * Utilisation:
 * -sélectionner un segment d'une forme. Cela divise le segment en X parts (-> crée x-1 nouveaux points)
 * -sélectionner une forme (si cette forme est un cercle). divise le contour du cercle en X.
 */
function DivideState(app) {
    this.app = app;
    this.name = "divide_segment";
    this.nb_parts = null;
}

App.heriter(DivideState.prototype, State.prototype);

/**
 * Renvoie le segment actuellement sélectionné, ou null s'il n'y a pas de segment sélectionné.
 * @param  {Shape} shape            la forme actuelle
 * @param  {{'x': float, 'y': float}} clickCoordinates coordonnées de la souris.
 * @return {{'p1': float, 'p2': float, 'sourcepoint1': Point, 'sourcepoint2': Point}}  le segment (ou null).
 */
DivideState.prototype.getSelectedSegment = function(shape, clickCoordinates){
    var lastPoint = null;
    for(var i=1;i<shape.buildSteps.length;i++) {
        lastPoint = shape.buildSteps[i-1].getFinalPoint(lastPoint);
        if(shape.buildSteps[i].type!="line")
            continue;
        var u = {
            'x': (clickCoordinates.x - shape.x) - lastPoint.x,
            'y': (clickCoordinates.y - shape.y) - lastPoint.y
        };
        var v = {
            'x': shape.buildSteps[i].x - lastPoint.x,
            'y':shape.buildSteps[i].y - lastPoint.y
        };
        //calculer la projection de u sur v.
        var produit_scalaire = u.x * v.x + u.y * v.y;
        var norme_v = v.x*v.x + v.y*v.y;

        var proj = {
            'x': produit_scalaire*v.x /norme_v +lastPoint.x,
            'y': produit_scalaire*v.y /norme_v +lastPoint.y
        };

        var pt1 = lastPoint,
            pt2 = shape.buildSteps[i],
            pt3 = proj,
            precision = this.app.settings.get('precision');

        var dist = Math.sqrt(Math.pow(proj.x-(clickCoordinates.x - shape.x), 2) + Math.pow(proj.y-(clickCoordinates.y - shape.y), 2));
        if(dist<this.app.settings.get('magnetismDistance')) {
            //Vérifier que proj est bien entre shape
            if(Math.abs((pt3.x-pt1.x) * (pt2.y-pt1.y) - (pt2.x-pt1.x) * (pt3.y-pt1.y))<precision) { //pt1,2,3 alignés
                //déterminant de (AB, AC) est nul!
                if((pt1.x-pt3.x) * (pt2.x-pt3.x) + (pt1.y-pt3.y) * (pt2.y-pt3.y) <= precision) { //pt3 entre pt1 et pt2
                    //produit scalaire de CA, CB est négatif ou nul!
                    return { //Ce segment est sélectionné!
                        'p1': lastPoint,
                        'p2': shape.buildSteps[i],
                        'sourcepoint1': shape.points[i-1],
                        'sourcepoint2': shape.points[i % shape.points.length], //i peut valoir shape.points.length max, car il y a une buildStep en plus.
                        'index': i
                    };
                }
            }
        }
    }
    return null;
};

DivideState.prototype.getSelectedArc = function (shape, clickCoordinates) {
    var lastPoint = null;
    for(var i=1;i<shape.buildSteps.length;i++) {
        lastPoint = shape.buildSteps[i-1].getFinalPoint(lastPoint);
        if(shape.buildSteps[i].type!="arc")
            continue;

        var x = clickCoordinates.x - shape.getCoordinates().x, //Coordonnées relatives du clic par rapport au centre de la forme
            y = clickCoordinates.y - shape.getCoordinates().y,
            center = shape.buildSteps[i],
            center_dist = Math.sqrt(Math.pow(x-center.x, 2) + Math.pow(y-center.y, 2)),
            rayon = Math.sqrt(Math.pow(lastPoint.x-center.x, 2) + Math.pow(lastPoint.y-center.y, 2)),
            start_angle = window.app.positiveAtan2(lastPoint.y-center.y, lastPoint.x-center.x),
            end_angle = null,
            angle = window.app.positiveAtan2(y-center.y, x-center.x);

        //Vérifier si la souris est dans le bon angle.
        if(shape.buildSteps[i].direction) //sens anti-horloger
            end_angle = window.app.positiveAngle(start_angle - center.angle);
        else
            end_angle = window.app.positiveAngle(start_angle + center.angle);

        if(Math.abs(rayon-center_dist) < this.app.settings.get('magnetismDistance') || shape.buildSteps.length==2 /*cercle*/) { //distance entre le centre du cercle et le point égale au rayon
            if(window.app.isAngleBetweenTwoAngles(start_angle, end_angle, shape.buildSteps[i].direction, angle)) {
                return { //Cet arc est sélectionné!
                    'start_angle': start_angle,
                    'rayon': rayon,
                    'buildstep': shape.buildSteps[i],
                    'buildstepIndex': i
                };
            }
        }
    }
    return null;
};

/**
 * @param coordinates: {x: int, y: int}
 */
DivideState.prototype.click = function(coordinates) {
    if(this.nb_parts==null)
        return;

    var list = this.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop();
    var addedPoints = [];

    //a-t-on sélectionné un segment de la forme ?
    var seg = this.getSelectedSegment(shape, coordinates);
    if(seg) {
        for(var j=1;j<this.nb_parts;j++) {
            var x = seg.p1.x + j*(1.0/this.nb_parts)*(seg.p2.x-seg.p1.x),
                y = seg.p1.y + j*(1.0/this.nb_parts)*(seg.p2.y-seg.p1.y);
            var pt = new Point(x, y, "division", shape);
            pt.sourcepoint1 = seg.sourcepoint1;
            pt.sourcepoint2 = seg.sourcepoint2;
            shape.segmentPoints.push(pt);
            addedPoints.push(pt);
        }
    } else {
        //Arc de cercle ?
        var arc = this.getSelectedArc(shape, coordinates);
        if(arc) {
            var angle_step = arc.buildstep.angle/this.nb_parts;
            if(arc.buildstep.direction) angle_step *= -1;
            for(var j=0;j<this.nb_parts;j++) { //j=0 si cercle entier, =1 sinon? TODO
                var a = arc.start_angle + j*angle_step,
                    x = arc.buildstep.x + arc.rayon * Math.cos(a),
                    y = arc.buildstep.y + arc.rayon * Math.sin(a);
                var pt = new Point(x, y, "division", shape);
                shape.segmentPoints.push(pt);
                addedPoints.push(pt);
            }
        }


    }

    if(addedPoints.length>0) {
        this.makeHistory(shape, addedPoints);
    }

	this.app.canvas.refresh(coordinates);
};

/**
 * Réinitialiser l'état
 */
DivideState.prototype.reset = function(){
    this.nb_parts = null;
};

/**
 * démarrer l'état
 */
DivideState.prototype.start = function(){
    this.nb_parts = null;
    document.getElementById('divide-popup-gray').style.display='block';
};

/**
 * Renvoie les éléments (formes, segments et points) qu'il faut surligner si la forme reçue en paramètre est survolée.
 * @param  {Shape} overflownShape La forme qui est survolée par la souris
 * @return { {'shapes': [Shape], 'segments': [{shape: Shape, segmentId: int}], 'points': [{shape: Shape, pointId: int}]} } Les éléments.
 */
DivideState.prototype.getElementsToHighlight = function(overflownShape, coordinates){
    var data = {
        'shapes': [],
        'segments': [],
        'points': []
    };

    var seg = this.getSelectedSegment(overflownShape, coordinates);
    if(seg) {
        data.segments.push({'shape': overflownShape, 'segment': seg.p2});
    } else {
        var arc = this.getSelectedArc(overflownShape, coordinates);
        if(arc) {
            data.segments.push({'shape': overflownShape, 'segment': arc.buildstep});
        }
    }

    return data;
};

/**
 * Ajoute l'action qui vient d'être effectuée dans l'historique
 */
DivideState.prototype.makeHistory = function(shape, pointsList){
    var data = {
        'shape_id': shape.id,
        'points': pointsList.map(function(val){
            return val.getSaveData();
        })
    };
    this.app.workspace.history.addStep(this.name, data);
};

/**
 * Annule une action. Ne pas utiliser de données stockées dans this dans cette fonction.
 * @param  {Object} data        les données envoyées à l'historique par makeHistory
 * @param {Function} callback   une fonction à appeler lorsque l'action a été complètement annulée.
 */
DivideState.prototype.cancelAction = function(data, callback){
    var ws = this.app.workspace;
    var shape = ws.getShapeById(data.shape_id)
    if(!shape) {
        console.error("DivideState.cancelAction: shape not found...");
        callback();
        return;
    }

    var nb_removed = 0;
    for(var i=0;i<data.points.length;i++) {
        var p = Point.createFromSaveData(data.points[i]);
        for(var j=0; j<shape.segmentPoints.length; j++) {
            var sp = shape.segmentPoints[j];
            if(sp.x==p.x && sp.y==p.y) {
                nb_removed++;
                shape.segmentPoints.splice(j, 1);
                break;
            }
        }
    }
    if(nb_removed!=data.points.length) {
        console.error("DivideState.cancelAction: couldn't remove all points, some are missing.");
    }

    callback();
};

/**
 * Annuler l'action en cours
 */
DivideState.prototype.abort = function(){};

/**
* Appelée lorsque l'événement mousedown est déclanché sur le canvas
 */
DivideState.prototype.mousedown = function(){};

/**
* Appelée lorsque l'événement mouseup est déclanché sur le canvas
 */
DivideState.prototype.mouseup = function(){};
