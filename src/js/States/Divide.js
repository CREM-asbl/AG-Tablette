/**
 * Cette classe permet de diviser un segment en plusieurs "parties" de tailles égales en créant des points entre ces parties.
 * Le segment peut être une arrête d'une forme, ou être défini par 2 points existants.
 * Cette division d'un segment en parties peut impliquer une liaison de 2 formes (si les 2 points font parties de formes différentes)
 *
 * Utilisation:
 * -sélectionner 2 points d'une même forme ou de 2 formes différentes
 *      -> si les 2 formes sont différentes, elles deviennent liées (voir workspace;systemShapeGroups[])
 *      ->cela divise le segment en X parts (-> crée x-1 points)
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
    var pointsNear = this.app.workspace.pointsNearPoint(this.app.workspace.points, coordinates);
    var nb_parts = this.app.workspace.divideStateNumberOfParts;
    if(this.firstPoint) { //Si on a déjà ajouté un premier point
        if(pointsNear.length==0)
            return;

        var last = pointsNear[pointsNear.length-1];

        var shape = this.firstPoint.shape;
        var first = this.firstPoint;

        //vérifier si les 2 points sont les extrémités d'une arrête d'une forme
        var on_segment = false;
        if(last.shape == first.shape) {

            shape.points.push(shape.points[0]);
            for(var i=1;i<shape.points.length;i++) {
                var p1 = shape.points[i-1], p2 = shape.points[i];
                if( (p1.x == last.x && p1.y == last.y && p2.x == first.x && p2.y == first.y)
                    || (p1.x == first.x && p1.y == first.y && p2.x == last.x && p2.y == last.y)) {
                    //si formes contenant arc de cercle: vérifier qu'entre les 2 points c'est bien une droite et pas un arc de cercle (dans buildSteps)
                    on_segment = true;
                    break;
                }
            }
            shape.points.pop();
        }

        var pointsArray = on_segment ? shape.segmentPoints : shape.otherPoints;
        var diff = {
            'x': (last.x+last.shape.x)-(this.firstPoint.x+this.firstPoint.shape.x),
            'y': (last.y+last.shape.y)-(this.firstPoint.y+this.firstPoint.shape.y)
        };
        for(var i=1;i<nb_parts;i++) {
            var x = this.firstPoint.x + i*(1.0/nb_parts)*diff.x,
                y = this.firstPoint.y + i*(1.0/nb_parts)*diff.y;
            var shape2 = null;
            if(last.shape != first.shape)
                shape2 = last.shape;
            var pt = {
				"x": x, "y": y, //x et y relatifs
				"absX": shape.x + x, "absY": shape.y + y, //x et y absolus
				"link": null, //pas utilisé ? pas sûr.
				"shape": shape,
                "shape2": shape2 //quand on supprime une forme, si un point a cette forme comme shape2, on le supprime aussi.
			};
            pointsArray.push(pt);
            this.app.workspace.points.push(pt);
        }

        if(last.shape != first.shape) {
            var g1 = this.app.workspace.getShapeGroup(first.shape, 'system');
            var g2 = this.app.workspace.getShapeGroup(last.shape, 'system');
            if(!g1 && !g2) {
                last.shape.linkedShape = first.shape;
                this.app.workspace.systemShapeGroups.push([first.shape, last.shape]);
            } else if (g1 && g2) {
                //fusionner les 2 systemgroups...
                var index1 = this.app.workspace.getGroupIndex(g1, 'system');
                var index2 = this.app.workspace.getGroupIndex(g2, 'system');
                if(index1==index2) { //elles sont déjà dans le même groupe.
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
        var list = window.app.workspace.shapesOnPoint(coordinates);
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
            if(dist<this.app.magnetismDistance) {
                segment_selected = true;
                var p1 = shape.buildSteps[i-1],
                    p2 = shape.buildSteps[i];
                for(var j=1;j<nb_parts;j++) {
                    var x = p1.x + j*(1.0/nb_parts)*(p2.x-p1.x),
                        y = p1.y + j*(1.0/nb_parts)*(p2.y-p1.y);
                    var pt = {
        				"x": x, "y": y, //x et y relatifs
        				"absX": shape.x + x, "absY": shape.y + y, //x et y absolus
        				"link": null, //pas utilisé ? pas sûr.
        				"shape": shape
        			};
                    shape.segmentPoints.push(pt);
                    this.app.workspace.points.push(pt);
                }
                break;
            }
        }

        if(!segment_selected) {
            //cercle ? ou forme avec arc de cercle? ou juste rien de sélectionné.
            if(shape.buildSteps.length==2 && shape.buildSteps[1].type=="arc") {
                //Cercle!
                //ajouter des points autour du cercle.
                console.log("TODO cercle");
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
