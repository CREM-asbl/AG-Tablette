import { app, App } from '../Core/App';
import { SelectManager } from '../Core/Managers/SelectManager';
import { Silhouette } from '../Core/Objects/Silhouette';

const serverURL = 'https://api.crem.be/';

addEventListener('close-tangram-popup', () => TangramManager.closePopup());

addEventListener('file-parsed', async e => {
  document.querySelector('state-menu').remove();
  const data = e.detail;
  const level = await TangramManager.selectLevel();
  if (data.silhouetteData) {
    app.silhouette = Silhouette.initFromObject(data.silhouetteData, level);
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }
});

addEventListener('new-window', () => (app.silhouette = null));

export class TangramManager {
  static closePopup() {
    document.querySelector('tangram-popup').remove();
  }

  static showPopup() {
    import('./tangram-popup');
    App.showPopup('tangram-popup');
  }

  static async selectLevel() {
    await import('./level-popup');
    App.showPopup('level-popup');
    return new Promise(resolve =>
      addEventListener('tangram-level-selected', e => resolve(e.detail))
    );
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
      filenames = ['Carré.agt'],
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
