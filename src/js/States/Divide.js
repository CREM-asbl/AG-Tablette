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
 * @param coordinates: {x: int, y: int}
 */
DivideState.prototype.click = function(coordinates) {
    if(this.nb_parts==null)
        return;
    var nb_parts = this.app.settings.get('divideStateNumberOfParts');

    var list = window.app.workspace.shapesOnPoint(new Point(coordinates.x, coordinates.y, null, null));
    if(list.length==0)
        return;
    var shape = list.pop();

    //a-t-on sélectionné un segment de la forme ?
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
            //Ce segment est sélectionné!
            segment_selected = true;
            var p1 = shape.buildSteps[i-1],
                p2 = shape.buildSteps[i];
            for(var j=1;j<this.nb_parts;j++) {
                var x = p1.x + j*(1.0/this.nb_parts)*(p2.x-p1.x),
                    y = p1.y + j*(1.0/this.nb_parts)*(p2.y-p1.y);
                var pt = new Point(x, y, "division", shape);
                pt.sourcepoint1 = shape.points[i-1];
                pt.sourcepoint2 = shape.points[i % shape.points.length]; //i peut valoir shape.points.length max, car il y a une buildStep en plus.
                shape.segmentPoints.push(pt);
            }
            break;
        }
    }

    //Arc de cercle ?
    if(!segment_selected) {

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

                    var angle_step = shape.buildSteps[i].angle*(Math.PI/180)/this.nb_parts;
                    if(direction) angle_step *= -1;
                    for(var j=0;j<this.nb_parts;j++) { //j=0 si cercle entier, =1 sinon? TODO
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
