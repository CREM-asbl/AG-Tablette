import { app } from '../App'
import { Points } from './points'
import { getAngleOfPoint, rotatePoint } from './geometry'

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
        tangram = app.workspace.settings.get("isTangramShown"),
        automaticAdjustment = app.settings.get("automaticAdjustment"),
        transformation = {
            'rotation': 0,
            'move': { 'x': 0, 'y': 0 }
        };

    if(!grid && !automaticAdjustment && !tangram)
        return transformation;

    if(tangram) {
        //l'offset peut être de (0, 0) si rien à bouger (car rien détecté par ex)
        let offset = app.tangramManager.getShapeGroupOffset(shapes, mainShape, coordinates);
        transformation.move = offset;
    }

    //La grille peut engendrer un déplacement, mais pas une rotation.
    let gridPointData;
    if(grid && !tangram) {
        gridPointData = app.workspace.grid.getClosestGridPointFromShapeGroup(shapes, mainShape, coordinates);
        if(!gridPointData) { //Forme sans sommet -> rien à faire
            return transformation;
        }
        let { gridPoint, shape, shapePoint } = gridPointData;

        let realPoint = Points.add(shapePoint.relativePoint, shape, Points.sub(coordinates, mainShape)),
            groupOffset = Points.sub(gridPoint, realPoint);

        transformation.move = groupOffset;
    }

    if(automaticAdjustment) {
        let bestPoint = null;
        if(grid && !tangram) {
            bestPoint = gridPointData.shapePoint;
        } else {
            //Liste des sommets et segmentPoints
            let points = shapes.map(s => {
                let list = [];
                s.buildSteps.forEach((bs, i1) => {
                    if(bs.type == "vertex") {
                        list.push({
                            'shape': s,
                            'relativePoint': bs.coordinates,
                            'realPoint': Points.add(bs.coordinates, s, Points.sub(coordinates, mainShape)),
                            'type': 'vertex',
                            'vertexIndex': i1
                        });
                    } else if(bs.type == "segment") {
                        bs.points.forEach((pt, i2) => {
                            list.push({
                                'shape': s,
                                'relativePoint': pt,
                                'realPoint': Points.add(pt, s, Points.sub(coordinates, mainShape)),
                                'type': 'segmentPoint',
                                'segmentIndex': i1,
                                'ptIndex': i2
                            });
                        })
                    }
                });
                if(s.isCenterShown) {
                    list.push({
                        'shape': s,
                        'relativePoint': s.center,
                        'realPoint': Points.add(s.center, s, Points.sub(coordinates, mainShape)),
                        'type': 'center',
                    });
                }

                return list;
            }).reduce((total, val) => {
                return total.concat(val);
            }, []);

            //Forme sans sommet
            if(points.length==0) return transformation;

            let bestDist = 10000000,
                bestTranslation = null,
                constr = app.interactionAPI.getEmptySelectionConstraints()['points'];
            constr.canSelect = true;
            constr.types = ['vertex', 'segmentPoint', 'center'];
            if(excludeSelf)
                constr.blacklist = shapes;
            points.forEach(pt => {
                let point = app.interactionAPI.selectPoint(pt.realPoint, constr);
                if(point && Points.dist(pt.realPoint, point.coordinates)<bestDist) {
                    bestDist = Points.dist(pt.realPoint, point.coordinates);
                    bestTranslation = Points.sub(point.coordinates, pt.realPoint);
                    bestPoint = pt;
                }
            });

            //Aucun point proche
            if(!bestTranslation) return transformation;

            transformation.move = bestTranslation;
        }

        if(bestPoint.type=='vertex') {// OU type = segmentPoint!! TODO.
            let newBestPointPos = Points.add(bestPoint.realPoint, transformation.move);
            let pointsToTest = [];

            //previous vertex:
            let shape = bestPoint.shape,
                bestPointIndex = bestPoint.vertexIndex,
                prev1 = shape.getPrevBuildstepIndex(bestPointIndex),
                pt1 = shape.buildSteps[prev1],
                prev2 = shape.getPrevBuildstepIndex(prev1),
                pt2 = shape.buildSteps[prev2];
            if(pt1.type=='segment' && pt1.isArc!==true && pt2.type=='vertex') {
                pointsToTest.push({
                    'realPoint': Points.add(pt2.coordinates, shape, Points.sub(coordinates, mainShape)),
                    'type': 'vertex',
                    'vertexIndex': prev2
                });
            }
            //next vertex:
            let next1 = shape.getNextBuildstepIndex(bestPointIndex);
            pt1 = shape.buildSteps[next1];
            let next2 = shape.getNextBuildstepIndex(next1);
            pt2 = shape.buildSteps[next2];
            if(pt1.type=='segment' && pt1.isArc!==true && pt2.type=='vertex') {
                pointsToTest.push({
                    'realPoint': Points.add(pt2.coordinates, shape, Points.sub(coordinates, mainShape)),
                    'type': 'vertex',
                    'vertexIndex': next2
                });
            }

            //find common segment (that includes bestPoint)
            let constr = app.interactionAPI.getEmptySelectionConstraints()['points'];
            constr.canSelect = true;
            constr.types = ['vertex']; //, 'segmentPoint'];
            if(excludeSelf)
                constr.blacklist = shapes;

            let bestOther = null,
                bestOtherDist = 1000*1000*1000,
                bestOtherTranslation = null;
            pointsToTest.forEach(pt => {
                let point = app.interactionAPI.selectPoint(pt.realPoint, constr);
                if(point && Points.dist(pt.realPoint, point.coordinates)<bestOtherDist) {
                    bestOtherDist = Points.dist(pt.realPoint, point.coordinates);
                    bestOtherTranslation = Points.sub(point.coordinates, pt.realPoint);
                    bestOther = pt;
                }
            });

            if(!bestOther) return transformation;

            let segment = {
                pt1: {
                    'ref': newBestPointPos,
                    'moving': bestPoint.realPoint
                },
                pt2: {
                    'ref': Points.add(bestOther.realPoint, bestOtherTranslation),
                    'moving': bestOther.realPoint
                }
            };

            let pts = {
                'pt1': Points.sub(segment.pt2.ref, segment.pt1.ref),
                'pt2': Points.sub(segment.pt2.moving, segment.pt1.moving)
            }

            let angle1 = getAngleOfPoint(Points.create(0, 0), pts.pt1), //ref
                angle2 = getAngleOfPoint(Points.create(0, 0), pts.pt2); //moving

            let angle = angle1 - angle2;
            if(angle>Math.PI) angle -= 2*Math.PI;
            if(angle<-Math.PI) angle += 2*Math.PI;
            if(Math.abs(angle)<0.00000001) angle = 0;

            let afterRotationCoords = {
                'pt1': rotatePoint(segment.pt1.moving, angle, Points.add(coordinates, shape.center)),
                'pt2': rotatePoint(segment.pt2.moving, angle, Points.add(coordinates, shape.center))
            };

            transformation = {
                'rotation': angle,
                'move': Points.sub(segment.pt1.ref, afterRotationCoords.pt1)
            };

            //TODO: un 'segment' commun pourrait être formé par un vertex et un segmentPoint? pour l'instant non.
        } else if(bestPoint.type=='segmentPoint') {
            //TODO idem au dessus.
            /*
            bestPoint:
            {
                'shape': s,
                'relativePoint': pt,
                'realPoint': Points.add(pt, s, Points.sub(coordinates, mainShape)),
                'type': 'segmentPoint',
                'segmentIndex': i1,
                'ptIndex': i2
            }
             */
        } else { //center
            //TODO: si un autre point est commun, faire une petite rotation si ça ne fait pas bouger les 2 centres?
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
        /*
        Si la grille est activée, être uniquement attiré par la grille.
         */
        let gridPoint = app.workspace.grid.getClosestGridPoint(coordinates);
        return Points.sub(gridPoint, coordinates);
    } else if(automaticAdjustment) {
        let constr = app.interactionAPI.getEmptySelectionConstraints()['points'];
        constr.canSelect = true;
        constr.types = ['center', 'vertex', 'segmentPoint'];
        let point = app.interactionAPI.selectPoint(coordinates, constr);
        if(!point) return translation;
        return Points.sub(point.coordinates, coordinates);
    }
}


/*

            if (settings.get('automaticAdjustment')) {
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
