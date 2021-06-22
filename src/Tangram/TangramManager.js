import { app, setState } from '../Core/App';
import { Silhouette } from '../Core/Objects/Silhouette';
import { createElem } from '../Core/Tools/general';
import { WorkspaceManager } from '../Core/Managers/WorkspaceManager';

const serverURL = 'https://api.crem.be/';

addEventListener('new-window', () => setState({ tangram: {...app.defaultState.tangram } }));

export class TangramManager {
  static async openForbiddenCanvas() {
    await import('./forbidden-canvas.js');
    createElem('forbidden-canvas');
    return new Promise((resolve) =>
      addEventListener('forbidden-canvas-drawn', (e) => resolve(e.detail)),
    );
  }

  static closeForbiddenCanvas() {
    window.dispatchEvent(new Event('close-forbidden-canvas'));
  }

  static async selectLevel() {
    await import('./level-popup');
    createElem('level-popup');
    return new Promise((resolve) =>
      addEventListener('tangram-level-selected', (e) => resolve(e.detail)),
    );
  }

  static removeSilhouette() {
    app.backgroundDrawingEnvironment.removeAllObjects();
    TangramManager.closeForbiddenCanvas();
    window.dispatchEvent(new CustomEvent('refresh-background'));
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
      filenames = ['Carre.agt'],
      fullFilenames = filenames.map((name) => serverURL + folder + name);

    let jsons = (
      await Promise.all(
        fullFilenames.map(async (filename) =>
          this.getTangramFromServer(filename),
        ),
      )
    ).filter(Boolean);

    jsons.forEach((json) => app.CremTangrams.push(json));
  }

  static async loadKit() {
    const response = await fetch('data/Tangram/tangramShapeKit.json');
    return response.text();
  }

  static async initShapes() {
    if (!TangramManager.kit)
      TangramManager.kit = await TangramManager.loadKit();
    const ws = JSON.parse(this.kit);
    WorkspaceManager.setWorkspaceFromObject(ws);
  }
}

app.CremTangrams = [];

TangramManager.retrieveTangrams();