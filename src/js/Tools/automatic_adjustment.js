import { app } from '../App'
import { Points } from './points'

/**
 * Calcule la transformation (déplacement et/ou rotation) qu'il faut appliquer à
 * un groupe de formes en fonction de la grille et de l'ajustement automatique.
 * @param  {[Shape]} shapes       Le groupe de formes que l'on déplace
 * @param  {Shape} mainShape      La forme principale
 * @param  {Point} coordinates    Les coordonnées de la forme principale
 * @return {Object}
 *          {
 *              'rotation': float,  //Rotation à effectuer
 *              'move': Point       //Déplacement à effectuer (après la rotation)
 *          }
 *
 * Il faut considérer que les coordonnées des formes du groupe (shapes[i].x,
 * shapes[i].y) doivent d'abord subir une translation de coordinates-mainShape!
 */
export function getShapeAdjustment(shapes, mainShape, coordinates) {
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

    if(automaticAdjustment) { //TODO: si point proche
        if(grid) {
            //Uniquement rotation supplémentaire, ne modifiant pas le point
            //attaché à la grille.
        } else {
            //TODO
            //Rotation et/ou déplacement
        }
    }

    return transformation;
}

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
