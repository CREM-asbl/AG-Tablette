/**
 * Renvoie true si le point est dans le polygone, false sinon.
 * @param  {[Point]} polygon Coordonnées des points du polygone
 * @param  {Point} point   Coordonnées du point
 * @return {boolean}         true si le point est dans le polygone
 * @copyright: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
 */
export function isPointInPolygon(polygon, point) {
  /* Iterate through each line */
  let crossings = 0;
  let nb_pts = polygon.length;

  for (let i = 0; i < nb_pts; i++) {
    let x1, x2;
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
    if (
      point.x > x1 &&
      point.x <= x2 &&
      (point.y < polygon[i].y || point.y <= polygon[(i + 1) % nb_pts].y)
    ) {
      let eps = 0.000001;

      /* Find the equation of the line */
      let dx = polygon[(i + 1) % nb_pts].x - polygon[i].x;
      let dy = polygon[(i + 1) % nb_pts].y - polygon[i].y;
      let k;

      if (Math.abs(dx) < eps) {
        k = Infinity; // math.h
      } else {
        k = dy / dx;
      }

      let m = polygon[i].y - k * polygon[i].x;

      /* Find if the ray crosses the line */
      let y2 = k * point.x + m;
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
    [x2, y2] = [pt3.x - pt1.x, pt3.y - pt1.y];
  return Math.abs(x1 * y2 - x2 * y1) < 1e-12;
}

/**
 * Renvoie l'angle équivalent dans l'intervalle [0, 2*Math.PI[
 * @param  {[type]} angle en radians
 * @return {[type]}       angle équivalent dans l'intervalle [0, 2*Math.PI[
 */
export function positiveAngle(angle) {
  let val = angle % (2 * Math.PI); //angle dans l'intervalle ]2*Math.PI, 2*Math.PI[
  if (val < 0) val += 2 * Math.PI;
  return val == 0 ? 0 : val; // éviter de retourner -0.
}

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
  if (!direction) {
    //Sens horloger
    if (dstAngle > srcAngle) {
      //situation normale
      return srcAngle <= angle && angle <= dstAngle;
    } else {
      //l'angle de destination était plus grand que 2*Math.PI
      return srcAngle <= angle || angle <= dstAngle;
    }
  } else {
    //Le sens inverse
    if (dstAngle < srcAngle) {
      //situation normale.
      return srcAngle >= angle && angle >= dstAngle;
    } else {
      //l'angle de destination était plus petit que zéro
      return srcAngle >= angle || angle >= dstAngle;
    }
  }
}

/**
 * Renvoie un valeur dans l'intervalle [0, 2*Math.PI[ de Math.atan2.
 * Attention aux arguments: y puis x (comme pour atan2).
 * @param  {float} y premier argument de Math.atan2
 * @param  {float} x second argument de Math.atan2
 * @return {[type]}	l'angle en radians entre la partie positive de l'axe
 * 					des x d'un plan, et le point (x,y) de ce plan.
 */
export function positiveAtan2(y, x) {
  let val = Math.atan2(y, x);
  if (val < 0) val += 2 * Math.PI;
  if (2 * Math.PI - val < 0.00001) val = 0;
  return val;
}
