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
 * Il faut considérer que les coordonnées des formes du groupe (shapes[i].x,
 * shapes[i].y) doivent d'abord subir une translation de coordinates-mainShape!
 */
export function getShapeAdjustment(shapes, mainShape, coordinates, excludeSelf = true) {
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
                    } else if(bs.type == "segmentPoint") {
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
