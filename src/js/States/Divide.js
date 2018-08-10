/**
 * Cette classe permet de diviser un segment en plusieurs "parties" de tailles égales en créant des points entre ces parties.
 * Le segment peut être une arrête d'une forme, ou être défini par 2 points existants.
 * Cette division d'un segment en parties peut impliquer une liaison de 2 formes (si les 2 points font parties de formes différentes)
 *
 * Utilisation:
 * -sélectionner 2 points d'une même forme ou de 2 formes différentes
 *      -> si les 2 formes sont différentes, elles deviennent liées (voir workspace.systemShapeGroups[])
 *      ->cela divise le segment en X parts (-> crée x-1 nouveaux points)
 * -sélectionner un segment d'une forme. Résultat idem.
 * -sélectionner une forme (si cette forme est un cercle). divise le contour du cercle en X.
 */
function DivideState(app) {
    this.app = app;
    this.name = "divide_segment";

    //premier point sélectionné
    this.firstPoint = null;
}

App.heriter(DivideState.prototype, State.prototype);

/**
 * Réinitialiser l'état
 */
DivideState.prototype.reset = function(){
    this.firstPoint = null;
};

/**
 * démarrer l'état
 */
DivideState.prototype.start = function(){};

/**
 * @param coordinates: {x: int, y: int}
 */
DivideState.prototype.click = function(coordinates) {
    var pointsNear = this.app.workspace.pointsNearPoint(new Point(coordinates.x, coordinates.y, null, null));
    var nb_parts = this.app.settings.get('divideStateNumberOfParts');
    if(this.firstPoint) { //Si on a déjà ajouté un premier point
        if(pointsNear.length==0)
            return;

        var last = pointsNear[pointsNear.length-1];

        var shape = this.firstPoint.shape;
        var first = this.firstPoint;
        var firstCoords = first.getRelativeCoordinates(),
            lastCoords = last.getRelativeCoordinates();

        //vérifier si les 2 points sont les extrémités d'une arrête d'une forme
        var on_segment = false;
        if(last.shape == first.shape) {

            shape.points.push(shape.points[0]);
            for(var i=1;i<shape.points.length;i++) {
                var p1 = shape.points[i-1].getRelativeCoordinates(), p2 = shape.points[i].getRelativeCoordinates();
                if( (p1.x == lastCoords.x && p1.y == lastCoords.y && p2.x == firstCoords.x && p2.y == firstCoords.y)
                    || (p1.x == firstCoords.x && p1.y == firstCoords.y && p2.x == lastCoords.x && p2.y == lastCoords.y)) {
                    //si formes contenant arc de cercle: vérifier qu'entre les 2 points c'est bien une droite et pas un arc de cercle (dans buildSteps)
                    on_segment = true;
                    break;
                }
            }
            shape.points.pop();
        }

        //Ajouter les points à la forme
        var pointsArray = on_segment ? shape.segmentPoints : shape.otherPoints;
        var diff = {
            'x': (lastCoords.x+last.shape.x)-(firstCoords.x+this.firstPoint.shape.x),
            'y': (lastCoords.y+last.shape.y)-(firstCoords.y+this.firstPoint.shape.y)
        };
        for(var i=1;i<nb_parts;i++) {
            var x = firstCoords.x + i*(1.0/nb_parts)*diff.x,
                y = firstCoords.y + i*(1.0/nb_parts)*diff.y;
            var shape2 = null;
            if(last.shape != first.shape)
                shape2 = last.shape;
            var pt = new Point(x, y, "division", shape);
            pt.sourcepoint1 = this.firstPoint;
            pt.sourcepoint2 = last;
            pointsArray.push(pt);
        }

        //Lier les 2 formes ensembles
        if(last.shape != first.shape) {
            var g1 = this.app.workspace.getShapeGroup(first.shape, 'system');
            var g2 = this.app.workspace.getShapeGroup(last.shape, 'system');
            if(!g1 && !g2) {
                this.app.workspace.systemShapeGroups.push([first.shape, last.shape]);
            } else if (g1 && g2) {
                //fusionner les 2 systemgroups...
                var index1 = this.app.workspace.getGroupIndex(g1, 'system');
                var index2 = this.app.workspace.getGroupIndex(g2, 'system');
                if(index1==index2) { //elles sont déjà dans le même groupe.
                    this.reset();
                    this.app.canvas.refresh(coordinates);
                    return;
                } else if(index1>index2) {
                    var t = g1;
                    g1 = g2;
                    g2 = t;

                    t = index1;
                    index1 = index2;
                    index2 = t;
                }
                //g1 référence le groupe que l'on va garder, et index1 son index.

                //on fusionne les 2 groupes.
                this.app.workspace.systemShapeGroups[index1] = this.app.workspace.systemShapeGroups[index1].concat(g2);
                this.app.workspace.systemShapeGroups.splice(index2, 1); //on supprime l'autre groupe.
            } else if(g1) {
                g1.push(last.shape);
            } else { //g2
                g2.push(first.shape);
            }
        }

        this.reset();
    } else if(pointsNear.length>0) { //Si on ajoute un premier point
        var last = pointsNear[pointsNear.length-1];
        this.firstPoint = last;
    } else {
        var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
        if(list.length==0)
            return;
        var shape = list.pop();

        //a-t-on sélectionné un segment d'une forme ?
        var segment_selected = false;
        for(var i=1;i<shape.buildSteps.length;i++) {
            if(shape.buildSteps[i].type!="line")
                continue;
            var u = {
                'x': (coordinates.x - shape.x) - shape.buildSteps[i-1].x,
                'y': (coordinates.y - shape.y) - shape.buildSteps[i-1].y
            };
            var v = {
                'x': shape.buildSteps[i].x - shape.buildSteps[i-1].x,
                'y':shape.buildSteps[i].y - shape.buildSteps[i-1].y
            };
            //calculer la projection de u sur v.
            var produit_scalaire = u.x * v.x + u.y * v.y;
            var norme_v = v.x*v.x + v.y*v.y;

            var proj = {
                'x': produit_scalaire*v.x /norme_v +shape.buildSteps[i-1].x,
                'y': produit_scalaire*v.y /norme_v +shape.buildSteps[i-1].y
            };

            var dist = Math.sqrt(Math.pow(proj.x-(coordinates.x - shape.x), 2) + Math.pow(proj.y-(coordinates.y - shape.y), 2));
            if(dist<this.app.settings.get('magnetismDistance')) {
                segment_selected = true;
                var p1 = shape.buildSteps[i-1],
                    p2 = shape.buildSteps[i];
                for(var j=1;j<nb_parts;j++) {
                    var x = p1.x + j*(1.0/nb_parts)*(p2.x-p1.x),
                        y = p1.y + j*(1.0/nb_parts)*(p2.y-p1.y);
                    var pt = new Point(x, y, "division", shape);
                    pt.sourcepoint1 = shape.points[i-1];
                    pt.sourcepoint2 = shape.points[i % shape.points.length]; //i peut valoir shape.points.length max, car il y a une buildStep en plus.
                    shape.segmentPoints.push(pt);
                }
                break;
            }
        }

        if(!segment_selected) {
            //Arc de cercle ?
            var arc_selected = false;
            for(var i=1;i<shape.buildSteps.length;i++) {
                if(shape.buildSteps[i].type!="arc")
                    continue;
                var x = coordinates.x - shape.getCoordinates().x,
                    y = coordinates.y - shape.getCoordinates().y;
                var center_dist = Math.sqrt(Math.pow(x-shape.buildSteps[i].x, 2) + Math.pow(y-shape.buildSteps[i].y, 2));
                var rayon = Math.sqrt(Math.pow(shape.buildSteps[i-1].x-shape.buildSteps[i].x, 2) + Math.pow(shape.buildSteps[i-1].y-shape.buildSteps[i].y, 2));

                var start_angle = Math.atan2(shape.buildSteps[i-1].y-shape.buildSteps[i].y, shape.buildSteps[i-1].x-shape.buildSteps[i].x);
    			//var start_angle = -this.app.getAngleBetweenPoints(s, start_pos);
    			var end_angle = this.app.getAngle(start_angle+shape.buildSteps[i].angle*Math.PI/180) + 2*Math.PI;
                var direction = shape.buildSteps[i].direction
    			if(direction) {
    				end_angle = this.app.getAngle(start_angle-shape.buildSteps[i].angle*Math.PI/180) - 2*Math.PI;
    			}

                var angle = Math.atan2(y-shape.buildSteps[i].y, x-shape.buildSteps[i].x);
                //TODO: pour des arc de cercles, vérifier si cela fonctionne aussi (si l'angle est bon).


                if(Math.abs(rayon-center_dist) < this.app.settings.get('magnetismDistance') || shape.buildSteps.length==2 /*cercle*/) { //distance entre le centre du cercle et le point égale au rayon
                    if((start_angle >= angle && angle >= end_angle) || (start_angle <= angle && angle <= end_angle)) {
                        arc_selected = true;

                        var angle_step = shape.buildSteps[i].angle*(Math.PI/180)/nb_parts;
                        if(direction) angle_step *= -1;
                        for(var j=0;j<nb_parts;j++) { //j=0 si cercle entier, =1 sinon? TODO
                            var a = start_angle + j*angle_step,
                                x = shape.buildSteps[i].x + rayon * Math.cos(a),
                                y = shape.buildSteps[i].y + rayon * Math.sin(a);
                            var pt = new Point(x, y, "division", shape);
                            shape.segmentPoints.push(pt);
                        }

                        //console.log("arc ! " + start_angle+" "+end_angle+" "+angle);
                    }
                    //console.log("bad angle! " + start_angle+" "+end_angle+" "+angle);
                }
            }

        }


    }

	this.app.canvas.refresh(coordinates);
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
