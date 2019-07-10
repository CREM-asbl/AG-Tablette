
/**
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

/*
TODO

export const isCommonSegment = (point1, point2, point3, point4) => {
    const delta = settings.get('precision')
    return (distanceBetweenTwoPoints(point1, point3) <= delta
        && distanceBetweenTwoPoints(point2, point4) <= delta)
}

export const hasCommonSegments = (shape1, shape2) => {
    for (let i = 0; i < shape1.points.length; i++) {
        if (shape1.buildSteps[i + 1].type != 'line') continue
        let shape1StartPoint = shape1.points[i].getAbsoluteCoordinates()
        let shape1EndPoint = shape1.points[(i + 1) % shape1.points.length].getAbsoluteCoordinates()

        for (let j = 0; j < shape2.points.length; j++) {
            if (shape2.buildSteps[j + 1].type != 'line') continue
            let shape2StartPoint = shape2.points[j].getAbsoluteCoordinates()
            let shape2EndPoint = shape2.points[(j + 1) % shape2.points.length].getAbsoluteCoordinates()

            if (isCommonSegment(shape1StartPoint, shape1EndPoint, shape2StartPoint, shape2EndPoint)
                || isCommonSegment(shape1StartPoint, shape1EndPoint, shape2EndPoint, shape2StartPoint)) {
                return true
            }
        }
    }
    return false
}

export const isSamePoints = (point1, point2) => {
    const delta = settings.get('precision')
    return distanceBetweenTwoPoints(point1, point2) <= delta
    // return point1.x === point2.x && point1.y === point2.y
}
 */
