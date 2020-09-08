import { app, App } from '../Core/App';
import { Silhouette } from '../Core/Objects/Silhouette';

const serverURL = 'https://api.crem.be/';

addEventListener('file-parsed', async e => {
  TangramManager.closeForbiddenCanvas();
  document.querySelector('state-menu')?.remove();
  const data = e.detail;
  const level = await TangramManager.selectLevel();
  if (level == 3 || level == 4) {
    await TangramManager.openForbiddenCanvas();
  }
  if (data.silhouetteData) {
    app.silhouette = Silhouette.initFromObject(data.silhouetteData, level);
    window.dispatchEvent(new CustomEvent('refreshBackground'));
  }
});

addEventListener('new-window', () => (app.silhouette = null));

export class TangramManager {
  static async openForbiddenCanvas() {
    await import('./forbidden-canvas.js');
    App.showPopup('forbidden-canvas');
    return new Promise(resolve =>
      addEventListener('forbidden-canvas-drawn', e => resolve(e.detail))
    );
  }

  static closeForbiddenCanvas() {
    window.dispatchEvent(new Event('close-forbidden-canvas'));
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
}

app.CremTangrams = [];

TangramManager.retrieveTangrams();
