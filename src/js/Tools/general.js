

export function uniqId() {
    var timestamp = new Date().getTime();
    var randInt = Math.floor(Math.random() * 1000 * 1000);
    var result = timestamp.toString(16) + randInt.toString(16);
    return result;
}

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
