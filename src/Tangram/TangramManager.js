import { app } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Silhouette } from '../Core/Objects/Silhouette';

const serverURL = 'https://api.crem.be/';

addEventListener('close-tangram-popup', () => TangramManager.closePopup());

addEventListener('file-parsed', e => {
  const data = e.detail;
  if (data.silhouetteData) {
    app.silhouette = Silhouette.initFromObject(data.silhouetteData);
  }
});

addEventListener('new-window', () => (app.silhouette = null));

export class TangramManager {
  static closePopup() {
    document.querySelector('tangram-popup').remove();
  }

  static showPopup() {
    console.log('showPopup');
    import('./tangram-popup');
    const popup = document.createElement('tangram-popup');
    popup.style.display = 'block';
    document.querySelector('body').appendChild(popup);
  }

  static async getTangramFromServer(filename) {
    const response = await fetch(filename, { mode: 'cors' }),
      smallFilename = filename.slice(serverURL.length);
    if (response.ok) {
      let object = await response.json();
      if (object) return { ...object, filename: smallFilename };
      else console.error('Failed to parse file', smallFilename);
    } else {
      console.error('Failed to get file', smallFilename);
    }
  }

  static async retrieveTangrams() {
    if (!app || app.CremTangrams.length) return;

    const folder = 'tangram/',
      filenames = ['withInternal.agt', 'noInternal.agt'],
      fullFilenames = filenames.map(name => serverURL + folder + name);

    let jsons = (
      await Promise.all(
        fullFilenames.map(async filename => this.getTangramFromServer(filename))
      )
    ).filter(Boolean);

    jsons.forEach(json => app.CremTangrams.push(json));
  }

  /**
   * Renvoie un point de la silhouette du tangram qui est proche du point reçu,
   * ou null si pas de point proche.
   * @param  {Point} point Coordonnées d'un point
   * @return {Point}
   */
  static getNearTangramPoint(point) {
    const shapes = app.silhouette.shapes,
      allPoints = shapes.map(s => s.allPoints).flat();

    let bestPoint = null,
      bestDist = 1000 * 1000 * 1000;

    allPoints.forEach(tangramPt => {
      if (SelectManager.arePointsInMagnetismDistance(point, tangramPt)) {
        let dist = point.dist(tangramPt);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = tangramPt;
        }
      }
    });

    return bestPoint;
  }
}

app.CremTangrams = [];

TangramManager.retrieveTangrams();
