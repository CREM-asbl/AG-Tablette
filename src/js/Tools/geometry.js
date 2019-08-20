import { Points } from './points'

/** //TODO delete (remplacer par Points.dist())
 * Renvoie la distance entre 2 points du plan
 * @param  {Point} pt1 le premier point
 * @param  {Point} pt2 le second point
 * @return {float}     la distance en pixels
 */
export function distanceBetweenPoints(pt1, pt2) {
    let pow1 = Math.pow(pt2.x - pt1.x, 2),
        pow2 = Math.pow(pt2.y - pt1.y, 2);
    return Math.sqrt(pow1 + pow2);
}

/**
 * Renvoie true si le point est dans le polygone, false sinon.
 * @param  {[Point]} polygon Coordonnées des points du polygone
 * @param  {Point} point   Coordonnées du point
 * @return {boolean}         true si le point est dans le polygone
 * @copyright: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
 */
export function isPointInPolygon(polygon, point) {

    /* Iterate through each line */
    var crossings = 0;
    var nb_pts = polygon.length;

    for (var i = 0; i < nb_pts; i++) {
        var x1, x2;
        /* This is done to ensure that we get the same result when
           the line goes from left to right and right to left */
        if (polygon[i].x < polygon[(i + 1) % nb_pts].x) {
            x1 = polygon[i].x;
            x2 = polygon[(i + 1) % nb_pts].x;
        } else {
            x1 = polygon[(i + 1) % nb_pts].x;
            x2 = polygon[i].x;
        }

        /* First check if the ray is possible to cross the line */
        if (point.x > x1 && point.x <= x2 && (point.y < polygon[i].y || point.y <= polygon[(i + 1) % nb_pts].y)) {
            var eps = 0.000001;

            /* Calculate the equation of the line */
            var dx = polygon[(i + 1) % nb_pts].x - polygon[i].x;
            var dy = polygon[(i + 1) % nb_pts].y - polygon[i].y;
            var k;

            if (Math.abs(dx) < eps) {
                k = Infinity;   // math.h
            } else {
                k = dy / dx;
            }

            var m = polygon[i].y - k * polygon[i].x;

            /* Find if the ray crosses the line */
            var y2 = k * point.x + m;
            if (point.y <= y2) {
                crossings++;
            }
        }
    }
    if (crossings % 2 == 1) {
        return true;
    }
    return false;
}

/**
 * Vérifie si 3 points sont colinéaires
 * @param  {Point} pt1
 * @param  {Point} pt2
 * @param  {Point} pt3
 * @return {Boolean}
 */
export function collinear(pt1, pt2, pt3) {
    let [x1, y1] = [pt2.x - pt1.x, pt2.y - pt1.y],
        [x2, y2] = [pt3.x - pt1.x, pt3.y - pt1.y]
    return Math.abs(x1 * y2 - x2 * y1) < 1e-12
}

/**
 * Renvoie l'angle équivalent dans l'intervalle [0, 2*Math.PI[
 * @param  {[type]} angle en radians
 * @return {[type]}       angle équivalent dans l'intervalle [0, 2*Math.PI[
 */
export function positiveAngle(angle) {
    var val = angle % (2 * Math.PI); //angle dans l'intervalle ]2*Math.PI, 2*Math.PI[
    if (val < 0) val += 2 * Math.PI;
    return (val == 0) ? 0 : val; // éviter de retourner -0.
};

/**
 * Vérifie si un angle est entre 2 autres angles
 * @param  {[type]} srcAngle  angle de départ, en radians, dans l'intervalle [0, 2*Math.PI[
 * @param  {[type]} dstAngle  angle d'arrivée, en radians, dans l'intervalle [0, 2*Math.PI[
 * @param  {[type]} direction true si sens anti-horloger, false si sens horloger
 * @param  {[type]} angle     l'angle, dans l'intervalle [0, 2*Math.PI[
 * @return {[type]}           true si l'angle est dans l'intervalle, false sinon.
 * @note: si srcAngle = dstAngle, l'angle est d'office compris entre les 2.
 */
export function isAngleBetweenTwoAngles(srcAngle, dstAngle, direction, angle) {
    if (!direction) { //Sens horloger
        if (dstAngle > srcAngle) { //situation normale
            return (srcAngle <= angle && angle <= dstAngle);
        } else { //l'angle de destination était plus grand que 2*Math.PI
            return (srcAngle <= angle || angle <= dstAngle);
        }
    } else { //Le sens inverse
        if (dstAngle < srcAngle) { //situation normale.
            return (srcAngle >= angle && angle >= dstAngle);
        } else { //l'angle de destination était plus petit que zéro
            return (srcAngle >= angle || angle >= dstAngle);
        }
    }
};

/**
 * Renvoie un valeur dans l'intervalle [0, 2*Math.PI[ de Math.atan2.
 * Attention aux arguments: y puis x (comme pour atan2).
 * @param  {float} y premier argument de Math.atan2
 * @param  {float} x second argument de Math.atan2
 * @return {[type]}	l'angle en radians entre la partie positive de l'axe
 * 					des x d'un plan, et le point (x,y) de ce plan.
 */
export function positiveAtan2(y, x) {
    var val = Math.atan2(y, x);
    if (val < 0)
        val += 2 * Math.PI;
    if (2 * Math.PI - val < 0.00001) val = 0;
    return val;
};

/**
 * Renvoie l'angle (en radians) entre la droite reliant refPoint et point, et l'axe
 * horizontal passant par refPoint.
 * @param  {Point} refPoint Le point de référence
 * @param  {Point} point    Le second point
 * @return {float}          L'angle, en radians. L'angle renvoyé est dans
 *                              l'intervalle [0, 2PI[
 */
export function getAngleOfPoint(refPoint, point) {
    let pt = {
        'x': point.x - refPoint.x,
        'y': point.y - refPoint.y
    };
    //Trouver l'angle de pt par rapport à (0,0)
    // https://en.wikipedia.org/wiki/Atan2 -> voir image en haut à droite,
    //  sachant qu'ici l'axe des y est inversé.
    let angle = Math.atan2(pt.y, pt.x);
    if (angle < 0)
        angle += 2 * Math.PI;
    if (2 * Math.PI - angle < 0.00001)
        angle = 0;
    return angle;
}

/**
 * Applique une rotation d'un certain angle sur un point.
 * @param  {Point} point Le point
 * @param  {float} angle L'angle en radians
 * @param  {Point} center Le centre autour duquel effectuer la rotation
 */
export function rotatePoint(point, angle, center) {
    let s = Math.sin(angle),
        c = Math.cos(angle),
        x = point.x - center.x,
        y = point.y - center.y,
        newX = x * c - y * s + center.x,
        newY = x * s + y * c + center.y;
    return { 'x': newX, 'y': newY };
}

/**
 * Renvoie la projection d'un point sur un segment
 * @param  {Point} point        Le point
 * @param  {Point} segmentStart Première extrémité du segment
 * @param  {Point} segmentEnd   Seconde extrémité du segment
 * @return {Point}              La projection du point. Celle-ci peut être en
 * dehors des 2 extrémité (c'est-à-dire sur la droite passant par les 2
 * extrémités du segment, mais pas sur le segment lui-même)
 */
export function getProjectionOnSegment(point, segmentStart, segmentEnd) {
    let center = null,
        p1x = segmentStart.x,
        p1y = segmentStart.y,
        p2x = segmentEnd.x,
        p2y = segmentEnd.y;

    //Calculer la projection du point sur l'axe.
    if (Math.abs(p2x-p1x) < 0.001) { //segment vertical
        center = { 'x': p1x, 'y': point.y };
    } else if (Math.abs(p2y-p1y) < 0.001) { //segment horizontal
        center = { 'x': point.x, 'y': p1y };
    } else { // axe.type=='NW' || axe.type=='SW'
        let f_a = (p1y - p2y) / (p1x - p2x),
            f_b = p2y - f_a * p2x,
            x2 = (point.x + point.y * f_a - f_a * f_b) / (f_a * f_a + 1),
            y2 = f_a * x2 + f_b;
        center = {
            'x': x2,
            'y': y2
        };
    }
    return center;
}
