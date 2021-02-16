import { app } from '../App';

/**
 * Représente un angle
 */
export class Angle {
  /**
   * @param {Number}                      amplitude
   */
  constructor(amplitude) {
    this.amplitude = parseFloat(amplitude);
  }

  get amplitudeInDegree() {
    return this.amplitude * 180 / Math.PI;
  }

  static createFromDegree(degree) {
    return new Angle(degree / 180 * Math.PI);
  }

  /**
   * Vérifie si un angle est entre 2 autres angles
   * @param  {[type]} srcAngle  angle de départ, en radians, dans l'intervalle [0, 2*Math.PI[
   * @param  {[type]} dstAngle  angle d'arrivée, en radians, dans l'intervalle [0, 2*Math.PI[
   * @param  {[type]} direction true si sens anti-horloger, false si sens horloger
   * @return {[type]}           true si l'angle est dans l'intervalle, false sinon.
   * @note: si srcAngle = dstAngle, l'angle est d'office compris entre les 2.
   */
  isBetweenTwoAngles(srcAngle, dstAngle, direction) {
    const srcAmplitude = srcAngle.amplitude;
    const dstAmplitude = dstAngle.amplitude;
    const thisAmplitude = this.amplitude;
    if (!direction) {
      //Sens horloger
      if (dstAmplitude > srcAmplitude) {
        //situation normale
        return srcAmplitude <= thisAmplitude && thisAmplitude <= dstAmplitude;
      } else {
        //l'angle de destination était plus grand que 2*Math.PI
        return srcAmplitude <= thisAmplitude || thisAmplitude <= dstAmplitude;
      }
    } else {
      //Le sens inverse
      if (dstAmplitude < srcAmplitude) {
        //situation normale.
        return srcAmplitude >= thisAmplitude && thisAmplitude >= dstAmplitude;
      } else {
        //l'angle de destination était plus petit que zéro
        return srcAmplitude >= thisAmplitude || thisAmplitude >= dstAmplitude;
      }
    }
  }

  /**
   * Renvoie l'angle équivalent dans l'intervalle [0, 2*Math.PI[
   * @return {[type]}       angle équivalent dans l'intervalle [0, 2*Math.PI[
   */
  positiveAngle() {
    let newAmplitude = this.amplitude % (2 * Math.PI); // angle dans l'intervalle ]2*Math.PI, 2*Math.PI[
    if (newAmplitude < 0) newAmplitude += 2 * Math.PI;
    newAmplitude = newAmplitude == 0 ? 0 : newAmplitude; // éviter de retourner -0.
    return new Angle(newAmplitude);
  }
}
