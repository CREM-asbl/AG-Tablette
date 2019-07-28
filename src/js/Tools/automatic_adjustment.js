import { app } from '../App'
import { Points } from './points'

/**
 * Calcule la transformation (déplacement et/ou rotation) qu'il faut appliquer à
 * un groupe de formes en fonction de la grille et de l'ajustement automatique.
 * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
 * @param  {Shape} mainShape      La forme principale
 * @param  {Point} coordinates    Les coordonnées de la forme principale
 * @param  {Boolean} [excludeSelf=true] False: peut magnétiser la forme avec
 *              elle-même (son ancienne position). Utile pour Copy()
 * @return {Object}
 *          {
 *              'rotation': float,  //Rotation à effectuer
 *              'move': Point       //Déplacement à effectuer (après la rotation)
 *          }
 *
 */
export function getShapeAdjustment(shapes, mainShape, coordinates, excludeSelf = true) {
    /**
     * Il faut considérer que les coordonnées des formes du groupe (shapes[i].x,
     * shapes[i].y) doivent d'abord subir une translation de coordinates-mainShape!
     */
    let grid = app.workspace.settings.get("isGridShown"),
        automaticAdjustment = app.settings.get("automaticAdjustment"),
        transformation = {
            'rotation': 0,
            'move': { 'x': 0, 'y': 0 }
        };

    if(!grid && !automaticAdjustment)
        return transformation;

    //La grille peut engendrer un déplacement, mais pas une rotation.
    if(grid) {
        let data = app.workspace.grid.getClosestGridPointFromShapeGroup(shapes, mainShape, coordinates);
        if(!data) { //Forme sans sommet. TODO que faire?
            return transformation; //ne rien faire
        }
        let { gridPoint, shape, shapePoint } = data;

        let realPoint = Points.add(shapePoint, shape, Points.sub(coordinates, mainShape)),
            groupOffset = Points.sub(gridPoint, realPoint);

        transformation.move = groupOffset;
    }

    if(automaticAdjustment) {
        if(grid) {
            //TODO ajouter rotation si possible (ne pas bouger le point grid)
            //utiliser l'action Rotate ensuite !!
        } else {
            //Liste des sommets et segmentPoints
            let points = shapes.map(s => {
                let list = [];
                s.buildSteps.forEach(bs => {
                    if(bs.type == "vertex") {
                        list.push({
                            'shape': s,
                            'relativePoint': bs.coordinates,
                            'realPoint': Points.add(bs.coordinates, s, Points.sub(coordinates, mainShape))
                        });
                    } else if(bs.type == "segment") {
                        bs.points.forEach(pt => {
                            list.push({
                                'shape': s,
                                'relativePoint': pt,
                                'realPoint': Points.add(pt, s, Points.sub(coordinates, mainShape))
                            });
                        })
                    }
                });
                return list;
            }).reduce((total, val) => {
                return total.concat(val);
            }, []);

            //Forme sans sommet
            if(points.length==0) return transformation;

            let bestDist = 10000000,
                bestTranslation = null;
            points.forEach(pt => {
                let excludeList = [];
                if(excludeSelf)
                    excludeList = shapes;
                let point = app.interactionAPI.selectPoint(pt.realPoint, false, true, true, excludeList);
                if(point && Points.dist(pt.realPoint, point.coordinates)<bestDist) {
                    bestDist = Points.dist(pt.realPoint, point.coordinates);
                    bestTranslation = Points.sub(point.coordinates, pt.realPoint);
                }
            });

            //Aucun point proche
            if(!bestTranslation) return transformation;

            transformation.move = bestTranslation;

            //TODO ajouter légère rotation si possible?
            //utiliser l'action Rotate ensuite!!
        }
    }

    return transformation;
}

/**
 * Calcule la translation à appliquer à une forme qu'on a ajouté au canvas,
 * à la position donnée.
 * @param  {Point} coordinates Coordonnées du clic lors de l'ajout de la forme
 * @return {Point}             Translation à effectuer.
 */
export function getNewShapeAdjustment(coordinates) {
    let grid = app.workspace.settings.get("isGridShown"),
        automaticAdjustment = app.settings.get("automaticAdjustment"),
        translation = { 'x': 0, 'y': 0 };

    if(!grid && !automaticAdjustment)
        return translation;

    if(grid) {
        let gridPoint = app.workspace.grid.getClosestGridPoint(coordinates);
        return Points.sub(gridPoint, coordinates);
    } else { //automaticAdjustment
        let point = app.interactionAPI.selectPoint(coordinates, false, true, false);
        if(!point) return translation;
        return Points.sub(point.coordinates, coordinates);
    }
}


/*
            //Appliquer le déplacement:
            var shapesSave = [];
            for (var i = 0; i < this.shapesList.length; i++) {
                shapesSave.push(this.shapesList[i].getSaveData());


                var xDiff = this.clickCoordinates.x - this.shapesList[i].x;
                var yDiff = this.clickCoordinates.y - this.shapesList[i].y;

                //n.
                var newX = point.x - xDiff;
                var newY = point.y - yDiff;

                this.shapesList[i].setCoordinates({ "x": newX, "y": newY });
            }

            //déplacer si la grille est là.
            var bestSegment;
            if (settings.get('isGridShown')) {
                var t = app.workspace.getClosestGridPoint(this.shapesList);
                var gridCoords = t.grid.getAbsoluteCoordinates(),
                    shapeCoords = t.shape.getAbsoluteCoordinates();
                for (var i = 0; i < this.shapesList.length; i++) {
                    this.shapesList[i].x += gridCoords.x - shapeCoords.x;
                    this.shapesList[i].y += gridCoords.y - shapeCoords.y;
                }

                if (settings.get('automaticAdjustment')) {
                    //Est-ce qu'il y a un segment dont l'une des extrémités est le point sélectionné de la grille
                    //TODO HERE: trouver un segment autour du point, pour une rotation ?
                }


            } else if (settings.get('automaticAdjustment')) {
                bestSegment = null; //segment du groupe de forme qui va être rapproché d'un segment d'une forme externe.
                var otherShapeSegment = null; //le segment de la forme externe correspondante.
                var segmentScore = 1000 * 1000 * 1000; //somme des carrés des distances entre les sommets des 2 segments ci-dessus.

                var total_elligible_segments = 0;
                for (var i = 0; i < this.shapesList.length; i++) { //Pour chacune des formes en cours de déplacement:
                    var shape = this.shapesList[i];
                    if (shape.points.length == 0)
                        continue;
                    var p1;
                    var p2 = app.workspace.pointsNearPoint(shape.points[0]);
                    shape.points.push(shape.points[0]);
                    for (var j = 1; j < shape.points.length; j++) { //pour chaque segment de la forme
                        p1 = p2;
                        p2 = app.workspace.pointsNearPoint(shape.points[j]);
                        var pos1 = shape.points[j - 1].getAbsoluteCoordinates(),
                            pos2 = shape.points[j].getAbsoluteCoordinates();

                        var seg_length = Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
                        for (var k = 0; k < p1.length; k++) { //pour chacun des points proches du premier point du segment (points[j-1])
                            if (this.shapesList.indexOf(p1[k].shape) != -1)
                                continue;
                            for (var l = 0; l < p2.length; l++) { //pour chacun des points proches du second point du segment (points[j])
                                if (this.shapesList.indexOf(p2[l].shape) != -1)
                                    continue;
                                var p1k_pos = p1[k].getAbsoluteCoordinates(),
                                    p2l_pos = p2[l].getAbsoluteCoordinates();
                                if (p1[k].shape == p2[l].shape) {
                                    var len = Math.sqrt(Math.pow(p1k_pos.x - p2l_pos.x, 2) + Math.pow(p1k_pos.y - p2l_pos.y, 2));
                                    var diff = Math.abs(len - seg_length);
                                    if (diff <= 2) {
                                        //Segment élligible.
                                        total_elligible_segments++;

                                        var score = Math.pow(p1k_pos.x - pos1.x, 2) + Math.pow(p1k_pos.y - pos1.y, 2);
                                        score += Math.pow(p2l_pos.x - pos2.x, 2) + Math.pow(p2l_pos.y - pos2.y, 2);

                                        if (score < segmentScore) {
                                            segmentScore = score;
                                            otherShapeSegment = [
                                                { 'x': p1k_pos.x, 'y': p1k_pos.y },
                                                { 'x': p2l_pos.x, 'y': p2l_pos.y }
                                            ];
                                            bestSegment = [
                                                { 'x': pos1.x, 'y': pos1.y },
                                                { 'x': pos2.x, 'y': pos2.y }
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
                if (bestSegment) { //On déplace la forme pour que bestSegment et otherShapeSegment deviennent identiques.
                    //Translater le groupe de formes pour que les 2 segments aient un point en commun
                    for (var i = 0; i < this.shapesList.length; i++) {
                        this.shapesList[i].x += otherShapeSegment[0].x - bestSegment[0].x;
                        this.shapesList[i].y += otherShapeSegment[0].y - bestSegment[0].y;

                    }

                    //Faire une rotation du groupe de formes, ayant pour centre otherShapeSegment[0]
                    bestSegment[1].x -= bestSegment[0].x;
                    bestSegment[1].y -= bestSegment[0].y;
                    var t = { 'x': otherShapeSegment[1].x - otherShapeSegment[0].x, 'y': otherShapeSegment[1].y - otherShapeSegment[0].y };
                    var a = app.getAngleBetweenPoints({ 'x': 0, 'y': 0 }, t);
                    var b = app.getAngleBetweenPoints({ 'x': 0, 'y': 0 }, bestSegment[1]);
                    var angle = a - b;

                    for (var i = 0; i < this.shapesList.length; i++) {
                        var n = app.states.rotate_shape.computeNewShapePos(this.shapesList[i], angle, otherShapeSegment[0]);
                        this.shapesList[i].x = n.x;
                        this.shapesList[i].y = n.y;

                        for (var j = 0; j < this.shapesList[i].buildSteps.length; j++) {
                            var transformation = app.states.rotate_shape.computePointPosition(this.shapesList[i].buildSteps[j].x, this.shapesList[i].buildSteps[j].y, angle);
                            this.shapesList[i].buildSteps[j].setCoordinates(transformation.x, transformation.y);
                        }
                        this.shapesList[i].recomputePoints();
                        for (var j = 0; j < this.shapesList[i].segmentPoints.length; j++) {
                            var pos = this.shapesList[i].segmentPoints[j].getRelativeCoordinates();
                            var transformation = app.states.rotate_shape.computePointPosition(pos.x, pos.y, angle);
                            this.shapesList[i].segmentPoints[j].setCoordinates(transformation.x, transformation.y);
                        }
                        for (var j = 0; j < this.shapesList[i].otherPoints.length; j++) {
                            var pos = this.shapesList[i].otherPoints[j].getRelativeCoordinates();
                            var transformation = app.states.rotate_shape.computePointPosition(pos.x, pos.y, angle);
                            this.shapesList[i].otherPoints[j].setCoordinates(transformation.x, transformation.y);
                        }
                    }
                }

            }
            if (!settings.get('isGridShown') && !bestSegment) {
                //Trouver un point proche ?
                var bestPoint = null; //point du groupe de forme qui va être rapproché d'un point d'une forme externe.
                var otherShapePoint = null; //le point de la forme externe correspondante.
                var pointScore = 1000 * 1000 * 1000; //carrés de la distance entre les 2 points.

                for (var i = 0; i < this.shapesList.length; i++) { //Pour chacune des formes en cours de déplacement:
                    var shape = this.shapesList[i];
                    for (var j = 0; j < shape.points.length; j++) { //pour chaque point de la forme
                        var pts = app.workspace.pointsNearPoint(shape.points[j]);
                        var shape_ptj_pos = shape.points[j].getAbsoluteCoordinates();

                        for (var k = 0; k < pts.length; k++) { //pour chacun des points proches du point de la forme
                            if (this.shapesList.indexOf(pts[k].shape) != -1) //le point appartient à une des formes du groupe de forme.
                                continue;
                            var pts_k_pos = pts[k].getAbsoluteCoordinates();
                            var score = Math.pow(pts_k_pos.x - shape_ptj_pos.x, 2) + Math.pow(pts_k_pos.y - shape_ptj_pos.y, 2);
                            if (score < pointScore) {
                                pointScore = score;
                                otherShapePoint = {
                                    'x': pts_k_pos.x,
                                    'y': pts_k_pos.y
                                };
                                bestPoint = {
                                    'x': shape_ptj_pos.x,
                                    'y': shape_ptj_pos.y
                                };
                            }
                        }
                    }
                }

                if (bestPoint) {
                    //Translater le groupe de formes pour que les 2 points soient identiques.
                    for (var i = 0; i < this.shapesList.length; i++) {
                        this.shapesList[i].x += otherShapePoint.x - bestPoint.x;
                        this.shapesList[i].y += otherShapePoint.y - bestPoint.y;
                    }
                }
            }
         */
